import {usePostHog} from 'posthog-react-native';
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {RemoteImage} from '../RemoteImage';
import {colors, spacing} from '../../theme/tokens';
import type {BlockOf} from '../../types/content';
import {openContentLink} from './contentLinks';

export const TextBlock = ({block}: {block: BlockOf<'textBlock'>}) => <View style={styles.text}><Text style={styles.eyebrow}>{block.eyebrow}</Text><Text accessibilityRole="header" style={styles.heading}>{block.heading}</Text><Text style={styles.body}>{block.body}</Text></View>;
export const ImageBlock = ({block}: {block: BlockOf<'imageBlock'>}) => <View><RemoteImage height={340} media={block.mobileImage || block.image} />{block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}</View>;
export const CTABlock = ({block, onNavigate}: {block: BlockOf<'restaurantCTA'>; onNavigate: (path: string) => void}) => {
  const posthog = usePostHog();
  return (
    <View style={styles.cta}>
      <Text accessibilityRole="header" style={styles.ctaHeading}>{block.headline}</Text>
      <Text style={styles.ctaBody}>{block.description}</Text>
      {block.label ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            posthog.capture('cta_tapped', {
              label: block.label ?? null,
              destination: block.destination?.path || block.href || null,
              headline: block.headline ?? null,
            });
            openContentLink(block.destination?.path || block.href, onNavigate);
          }}
          style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>{block.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {fontSize: 17, lineHeight: 27, textAlign: 'center'},
  caption: {backgroundColor: colors.ink, color: colors.white, fontSize: 10, padding: spacing.sm, textTransform: 'uppercase'},
  cta: {backgroundColor: colors.tomato, padding: spacing.xl},
  ctaBody: {color: colors.white, fontSize: 17, lineHeight: 25},
  ctaButton: {borderColor: colors.white, borderWidth: 2, marginTop: spacing.lg, padding: spacing.md},
  ctaButtonText: {color: colors.white, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  ctaHeading: {color: colors.white, fontSize: 44, fontWeight: '900', letterSpacing: -2, lineHeight: 40, marginBottom: spacing.md, textTransform: 'uppercase'},
  eyebrow: {fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textAlign: 'center', textTransform: 'uppercase'},
  heading: {fontSize: 40, fontWeight: '900', letterSpacing: -2, lineHeight: 36, marginVertical: spacing.md, textAlign: 'center', textTransform: 'uppercase'},
  text: {alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl},
});
