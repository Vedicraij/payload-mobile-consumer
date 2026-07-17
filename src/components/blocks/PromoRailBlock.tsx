import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {RemoteImage} from '../RemoteImage';
import {colors, spacing} from '../../theme/tokens';
import type {BlockOf} from '../../types/content';
import {openContentLink} from './contentLinks';

export const PromoRailBlock = ({block, onNavigate}: {block: BlockOf<'promoRail'>; onNavigate: (path: string) => void}) => (
  <View style={styles.section}><Text style={styles.heading}>{block.title}</Text>{block.promotions?.map(promo => <View key={promo.id} style={styles.promo}><RemoteImage height={190} media={promo.mobileImage || promo.desktopImage} /><View style={styles.copy}><Text style={styles.eyebrow}>{promo.eyebrow}</Text><Text style={styles.title}>{promo.title}</Text><Text style={styles.body}>{promo.description}</Text>{promo.cta?.destination?.path ? <Pressable accessibilityRole="button" onPress={() => openContentLink(promo.cta?.destination?.path, onNavigate)} style={styles.button}><Text style={styles.buttonText}>{promo.cta.label || 'Learn more'}</Text></Pressable> : null}</View></View>)}</View>
);

const styles = StyleSheet.create({
  body: {color: colors.white, lineHeight: 21},
  button: {borderColor: colors.white, borderWidth: 2, marginTop: spacing.md, padding: spacing.sm},
  buttonText: {color: colors.white, fontSize: 11, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  copy: {padding: spacing.lg},
  eyebrow: {color: colors.corn, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase'},
  heading: {fontSize: 36, fontWeight: '900', letterSpacing: -2, lineHeight: 34, marginBottom: spacing.lg, textTransform: 'uppercase'},
  promo: {backgroundColor: colors.tomato},
  section: {backgroundColor: colors.blueSoft, padding: spacing.lg},
  title: {color: colors.white, fontSize: 34, fontWeight: '900', lineHeight: 31, marginVertical: spacing.sm, textTransform: 'uppercase'},
});
