import {usePostHog} from 'posthog-react-native';
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {RemoteImage} from '../RemoteImage';
import {colors, spacing} from '../../theme/tokens';
import type {BlockOf} from '../../types/content';
import {openContentLink} from './contentLinks';

export const HeroBlock = ({block, onNavigate}: {block: BlockOf<'restaurantHero'>; onNavigate: (path: string) => void}) => {
  const posthog = usePostHog();
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{block.eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>{block.headline}</Text>
        <Text style={styles.description}>{block.description}</Text>
        <View style={styles.actions}>
          {block.actions?.map(action => (
            <Pressable
              accessibilityRole="link"
              key={action.label}
              onPress={() => {
                posthog.capture('hero_cta_tapped', {
                  label: action.label,
                  destination: action.destination?.path || action.href || null,
                  headline: block.headline ?? null,
                });
                openContentLink(action.destination?.path || action.href, onNavigate);
              }}
              style={styles.button}>
              <Text style={styles.buttonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <RemoteImage height={300} media={block.mobileImage || block.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg},
  button: {backgroundColor: colors.corn, paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
  buttonText: {color: colors.ink, fontSize: 12, fontWeight: '900', textTransform: 'uppercase'},
  container: {backgroundColor: colors.blue},
  copy: {padding: spacing.lg},
  description: {color: colors.white, fontSize: 16, lineHeight: 24, marginTop: spacing.md},
  eyebrow: {color: colors.corn, fontSize: 11, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase'},
  title: {color: colors.white, fontSize: 55, fontWeight: '900', letterSpacing: -3, lineHeight: 48, marginTop: spacing.sm, textTransform: 'uppercase'},
});
