import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../../theme/tokens';
import type {RichText as RichTextValue, RichTextNode} from '../../types/content';

const nodeText = (node?: RichTextNode): string => {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  return node.children?.map(nodeText).join('') || '';
};

export const extractRichText = (value?: RichTextValue | null): string[] => {
  const root = value?.root;
  if (!root) return [];
  const nodes = root.children?.length ? root.children : [root];
  return nodes.map(nodeText).map(text => text.trim()).filter(Boolean);
};

export const RichText = ({value}: {value?: RichTextValue | null}) => {
  const paragraphs = extractRichText(value);
  if (!paragraphs.length) return null;
  return <View style={styles.container}>{paragraphs.map((paragraph, index) => <Text key={`${index}-${paragraph}`} style={styles.text}>{paragraph}</Text>)}</View>;
};

const styles = StyleSheet.create({
  container: {gap: spacing.sm},
  text: {color: colors.ink, fontSize: 16, lineHeight: 24},
});
