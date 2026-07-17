import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {CMS_URL} from '../../api/config';
import {absoluteMediaURL} from '../../api/content';
import {colors, spacing} from '../../theme/tokens';
import type {ArchiveItem, BlockOf, FormField} from '../../types/content';
import {RemoteImage} from '../RemoteImage';
import {hrefForCMSLink, openContentLink} from './contentLinks';
import {RichText} from './RichText';

type NavigationProps = {onNavigate: (path: string) => void};

const Action = ({href, label, onNavigate}: NavigationProps & {href?: string; label: string}) => (
  <Pressable accessibilityRole="button" onPress={() => openContentLink(href, onNavigate)} style={styles.button}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

export const SharedCTABlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'cta'>}) => (
  <View style={styles.cta}>
    <RichText value={block.richText} />
    <View style={styles.actions}>
      {block.links?.map(({link, id}, index) => <Action href={hrefForCMSLink(link)} key={id || `${link.label}-${index}`} label={link.label} onNavigate={onNavigate} />)}
    </View>
  </View>
);

export const SharedContentBlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'content'>}) => (
  <View style={styles.section}>
    {block.columns?.map((column, index) => (
      <View key={column.id || index} style={styles.column}>
        <RichText value={column.richText} />
        {column.enableLink && column.link ? <Action href={hrefForCMSLink(column.link)} label={column.link.label} onNavigate={onNavigate} /> : null}
      </View>
    ))}
  </View>
);

export const SharedMediaBlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'mediaBlock'>}) => {
  const media = typeof block.media === 'object' ? block.media : undefined;
  const isVideo = media?.mimeType?.startsWith('video/');
  const url = absoluteMediaURL(media?.url || undefined);

  if (isVideo) {
    return <View style={styles.media}><Text style={styles.mediaTitle}>{media?.alt || 'Video'}</Text><Action href={url} label="Open video" onNavigate={onNavigate} /></View>;
  }
  return <View style={styles.media}><RemoteImage height={340} media={media} /></View>;
};

const archiveItems = (block: BlockOf<'archive'>): ArchiveItem[] => {
  if (block.posts?.length) return block.posts;
  if (block.items?.length) return block.items;
  if (block.docs?.length) return block.docs;
  return block.selectedDocs?.flatMap(item => typeof item.value === 'object' ? [item.value] : []) || [];
};

export const SharedArchiveBlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'archive'>}) => (
  <View style={styles.section}>
    <RichText value={block.introContent} />
    {archiveItems(block).map((item, index) => {
      const copy = item.excerpt || item.meta?.description;
      const card = <View style={styles.archiveItem}><Text accessibilityRole="header" style={styles.itemTitle}>{item.title || 'Untitled'}</Text>{copy ? <Text style={styles.itemBody}>{copy}</Text> : null}</View>;
      return item.slug ? <Pressable accessibilityRole="link" key={item.id || item.slug} onPress={() => openContentLink(`/posts/${item.slug}`, onNavigate)}>{card}</Pressable> : <View key={item.id || index}>{card}</View>;
    })}
  </View>
);

type FormValue = boolean | number | string;

const checkboxValue = (value: unknown) => value === true || value === 'true';

const initialValues = (fields: FormField[]) => {
  const entries: Array<[string, FormValue]> = [];
  fields.forEach(field => {
    if (field.blockType === 'message') return;
    entries.push([
      field.name,
      field.blockType === 'checkbox' ? checkboxValue(field.defaultValue) : field.defaultValue ?? '',
    ]);
  });
  return Object.fromEntries(entries) as Record<string, FormValue>;
};

const FormInput = ({field, value, onChange}: {field: Exclude<FormField, {blockType: 'message'}>; value: FormValue; onChange: (value: FormValue) => void}) => {
  const label = field.label || field.name;
  if (field.blockType === 'checkbox') {
    const checked = checkboxValue(value);
    return <Pressable accessibilityRole="checkbox" accessibilityState={{checked}} onPress={() => onChange(!checked)} style={styles.checkbox}><Text style={styles.checkboxMark}>{checked ? '[x]' : '[ ]'}</Text><Text>{label}{field.required ? ' *' : ''}</Text></Pressable>;
  }
  if (field.blockType === 'select') {
    const options = field.options || [];
    const selected = options.find(option => option.value === value);
    const selectNext = () => {
      const current = options.findIndex(option => option.value === value);
      onChange(options[(current + 1) % options.length]?.value || '');
    };
    return <View><Text style={styles.label}>{label}{field.required ? ' *' : ''}</Text><Pressable accessibilityLabel={label} accessibilityRole="button" onPress={selectNext} style={styles.input}><Text>{selected?.label || field.placeholder || 'Select an option'}</Text></Pressable></View>;
  }
  return <View><Text nativeID={`form-${field.name}`} style={styles.label}>{label}{field.required ? ' *' : ''}</Text><TextInput accessibilityLabel={label} accessibilityLabelledBy={`form-${field.name}`} inputMode={field.blockType === 'email' ? 'email' : field.blockType === 'number' ? 'numeric' : 'text'} multiline={field.blockType === 'textarea'} onChangeText={onChange} placeholder={field.placeholder || undefined} style={[styles.input, field.blockType === 'textarea' && styles.textarea]} textAlignVertical={field.blockType === 'textarea' ? 'top' : 'center'} value={String(value)} /></View>;
};

export const SharedFormBlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'formBlock'>}) => {
  const form = typeof block.form === 'object' ? block.form : undefined;
  const fields = form?.fields || [];
  const [values, setValues] = useState<Record<string, FormValue>>(() => initialValues(fields));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!form) return <View style={styles.section}><Text>Form unavailable.</Text></View>;

  const submit = async () => {
    const missing = fields.some(field => field.blockType !== 'message' && field.required && !values[field.name]);
    if (missing) {
      setMessage('Complete all required fields.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      const response = await fetch(`${CMS_URL}/api/form-submissions`, {
        body: JSON.stringify({
          form: form.id,
          submissionData: fields.flatMap(field => field.blockType === 'message' ? [] : [{field: field.name, value: field.blockType === 'checkbox' ? checkboxValue(values[field.name]) : String(values[field.name] ?? '')}]),
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Form submission failed (${response.status}).`);
      setStatus('submitted');
      if (form.confirmationType === 'redirect') {
        await openContentLink(form.redirect?.url, onNavigate);
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'submitted') {
    return <View accessibilityLiveRegion="polite" style={styles.form}><RichText value={form.confirmationMessage} />{!form.confirmationMessage ? <Text>Thank you. Your response was submitted.</Text> : null}</View>;
  }

  return <View style={styles.form}>
    {block.enableIntro ? <RichText value={block.introContent} /> : null}
    <Text accessibilityRole="header" style={styles.formTitle}>{form.title}</Text>
    {fields.map((field, index) => field.blockType === 'message' ? <RichText key={index} value={field.message} /> : <FormInput field={field} key={field.name} onChange={value => setValues(current => ({...current, [field.name]: value}))} value={values[field.name] ?? ''} />)}
    {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{disabled: status === 'submitting'}} disabled={status === 'submitting'} onPress={submit} style={styles.submit}><Text style={styles.submitText}>{status === 'submitting' ? 'Submitting...' : form.submitButtonLabel || 'Submit'}</Text></Pressable>
  </View>;
};

const styles = StyleSheet.create({
  actions: {gap: spacing.sm, marginTop: spacing.md},
  archiveItem: {borderBottomColor: colors.blueSoft, borderBottomWidth: 1, paddingVertical: spacing.md},
  button: {borderColor: colors.ink, borderWidth: 2, padding: spacing.md},
  buttonText: {color: colors.ink, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  checkbox: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  checkboxMark: {fontFamily: 'Courier', fontSize: 18},
  column: {gap: spacing.sm},
  cta: {backgroundColor: colors.corn, padding: spacing.lg},
  error: {color: colors.tomato, fontWeight: '700'},
  form: {backgroundColor: colors.white, gap: spacing.md, padding: spacing.lg},
  formTitle: {fontSize: 28, fontWeight: '900'},
  input: {borderColor: colors.muted, borderWidth: 1, color: colors.ink, minHeight: 48, paddingHorizontal: spacing.md},
  itemBody: {color: colors.muted, lineHeight: 21, marginTop: spacing.xs},
  itemTitle: {fontSize: 20, fontWeight: '900'},
  label: {fontWeight: '700', marginBottom: spacing.xs},
  media: {backgroundColor: colors.ink, padding: spacing.md},
  mediaTitle: {color: colors.white, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  section: {backgroundColor: colors.white, gap: spacing.lg, padding: spacing.lg},
  submit: {backgroundColor: colors.tomato, padding: spacing.md},
  submitText: {color: colors.white, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  textarea: {height: 120, paddingTop: spacing.sm},
});
