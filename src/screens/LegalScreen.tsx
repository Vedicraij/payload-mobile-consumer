import type {RouteProp} from '@react-navigation/native';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';

import {contentAPI} from '../api/content';
import {ScreenState} from '../components/ScreenState';
import {colors, spacing} from '../theme/tokens';
import type {LegalContent} from '../types/content';

const lexicalText = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  if ('text' in value && typeof value.text === 'string') return value.text;
  if ('children' in value && Array.isArray(value.children)) return value.children.map(lexicalText).join(' ');
  if ('root' in value) return lexicalText(value.root);
  return '';
};

export const LegalScreen = ({route}: {route: RouteProp<{Legal: {key: string}}, 'Legal'>}) => {
  const [content, setContent] = useState<LegalContent | null>(null);
  const [error, setError] = useState('');
  const posthog = usePostHog();

  const load = useCallback(() => {
    setError('');
    setContent(null);
    contentAPI.legal(route.params.key)
      .then(result => {
        setContent(result.data);
        posthog.capture('legal_document_viewed', {
          document_key: route.params.key,
          document_title: result.data.title,
          legal_version: result.data.legalVersion ?? null,
        });
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load legal content.'));
  }, [posthog, route.params.key]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ScreenState message={error} onRetry={load} />;
  if (!content) return <ScreenState />;
  return <ScrollView contentContainerStyle={styles.container} testID={`legal-${route.params.key}`}><Text style={styles.version}>Document {content.legalVersion}</Text><Text accessibilityRole="header" style={styles.title}>{content.title}</Text><Text style={styles.summary}>{content.summary}</Text><Text style={styles.body}>{lexicalText(content.content)}</Text></ScrollView>;
};

const styles = StyleSheet.create({
  body: {borderTopColor: colors.ink, borderTopWidth: 2, fontSize: 17, lineHeight: 28, marginTop: spacing.xl, paddingTop: spacing.lg},
  container: {backgroundColor: colors.paper, flexGrow: 1, padding: spacing.lg},
  summary: {fontSize: 20, lineHeight: 29},
  title: {fontSize: 48, fontWeight: '900', letterSpacing: -2, lineHeight: 44, marginVertical: spacing.md, textTransform: 'uppercase'},
  version: {color: colors.tomato, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: spacing.xl, textTransform: 'uppercase'},
});
