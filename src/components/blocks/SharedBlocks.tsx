import {usePostHog} from 'posthog-react-native';
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {absoluteMediaURL} from '../../api/content';
import {submitFormSubmission} from '../../api/forms';
import {colors, spacing} from '../../theme/tokens';
import type {ArchiveItem, BlockOf, FormField} from '../../types/content';
import {RemoteImage} from '../RemoteImage';
import {hrefForCMSLink, openContentLink} from './contentLinks';
import {RichText} from './RichText';

type NavigationProps = {onNavigate: (path: string) => void};

const Action = ({href, label, onNavigate}: NavigationProps & {href?: string; label: string}) => (
  <Pressable accessibilityRole="link" onPress={() => openContentLink(href, onNavigate)} style={styles.button}>
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

export const SharedArchiveBlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'archive'>}) => {
  const posthog = usePostHog();
  return (
    <View style={styles.section}>
      <RichText value={block.introContent} />
      {archiveItems(block).map((item, index) => {
        const copy = item.excerpt || item.meta?.description;
        const card = <View style={styles.archiveItem}><Text accessibilityRole="header" style={styles.itemTitle}>{item.title || 'Untitled'}</Text>{copy ? <Text style={styles.itemBody}>{copy}</Text> : null}</View>;
        return item.slug ? (
          <Pressable
            accessibilityRole="link"
            key={item.id || item.slug}
            onPress={() => {
              posthog.capture('archive_item_tapped', {
                item_id: item.id ?? null,
                item_slug: item.slug ?? null,
                item_title: item.title ?? null,
              });
              openContentLink(`/posts/${item.slug}`, onNavigate);
            }}>
            {card}
          </Pressable>
        ) : <View key={item.id || index}>{card}</View>;
      })}
    </View>
  );
};

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
    return <Pressable accessibilityLabel={label} accessibilityRole="checkbox" accessibilityState={{checked}} onPress={() => onChange(!checked)} style={styles.checkbox} testID={`form-field-${field.name}`}><Text style={styles.checkboxMark}>{checked ? '[x]' : '[ ]'}</Text><Text>{label}{field.required ? ' *' : ''}</Text></Pressable>;
  }
  if (field.blockType === 'select') {
    const options = field.options || [];
    const selected = options.find(option => option.value === value);
    const selectNext = () => {
      const current = options.findIndex(option => option.value === value);
      onChange(options[(current + 1) % options.length]?.value || '');
    };
    return <View><Text style={styles.label}>{label}{field.required ? ' *' : ''}</Text><Pressable accessibilityHint="Selects the next available option" accessibilityLabel={label} accessibilityRole="button" onPress={selectNext} style={styles.input} testID={`form-field-${field.name}`}><Text>{selected?.label || field.placeholder || 'Select an option'}</Text></Pressable></View>;
  }
  return <View><Text nativeID={`form-${field.name}`} style={styles.label}>{label}{field.required ? ' *' : ''}</Text><TextInput accessibilityLabel={label} accessibilityLabelledBy={`form-${field.name}`} autoCapitalize={field.blockType === 'email' ? 'none' : 'sentences'} autoCorrect={field.blockType !== 'email'} inputMode={field.blockType === 'email' ? 'email' : field.blockType === 'number' ? 'numeric' : 'text'} multiline={field.blockType === 'textarea'} onChangeText={onChange} placeholder={field.placeholder || undefined} style={[styles.input, field.blockType === 'textarea' && styles.textarea]} testID={`form-field-${field.name}`} textAlignVertical={field.blockType === 'textarea' ? 'top' : 'center'} value={String(value)} /></View>;
};

const isMissing = (value: FormValue | undefined) =>
  typeof value === 'boolean' ? !value : typeof value === 'string' ? !value.trim() : value === undefined;

export const SharedFormBlock = ({block, onNavigate}: NavigationProps & {block: BlockOf<'formBlock'>}) => {
  const form = typeof block.form === 'object' ? block.form : undefined;
  const fields = form?.fields || [];
  const [values, setValues] = useState<Record<string, FormValue>>(() => initialValues(fields));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const posthog = usePostHog();

  if (!form) return <View style={styles.section}><Text>Form unavailable.</Text></View>;

  const submit = async () => {
    const missing = fields.some(field => field.blockType !== 'message' && field.required && isMissing(values[field.name]));
    if (missing) {
      setMessage('Complete all required fields.');
      setStatus('error');
      return;
    }
    const invalidEmail = fields.some(field => field.blockType === 'email' && values[field.name] && !/^\S+@\S+\.\S+$/.test(String(values[field.name]).trim()));
    if (invalidEmail) {
      setMessage('Enter a valid email address.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      await submitFormSubmission(
        form.id,
        fields.flatMap(field => field.blockType === 'message' ? [] : [{field: field.name, value: field.blockType === 'checkbox' ? checkboxValue(values[field.name]) : String(values[field.name] ?? '')}]),
      );
      posthog.capture('form_submitted', {form_id: form.id, form_title: form.title});
      setStatus('submitted');
      if (form.confirmationType === 'redirect') {
        await openContentLink(form.redirect?.url, onNavigate);
      }
    } catch {
      posthog.capture('form_submission_failed', {form_id: form.id, form_title: form.title});
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
    <Pressable accessibilityLabel={form.submitButtonLabel || 'Submit form'} accessibilityRole="button" accessibilityState={{disabled: status === 'submitting'}} disabled={status === 'submitting'} onPress={submit} style={styles.submit} testID={`form-${form.id}-submit`}><Text style={styles.submitText}>{status === 'submitting' ? 'Submitting...' : form.submitButtonLabel || 'Submit'}</Text></Pressable>
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
