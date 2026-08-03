import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {RemoteImage} from '../RemoteImage';
import {colors, spacing} from '../../theme/tokens';
import type {BlockOf} from '../../types/content';

export const CardGridBlock = ({block}: {block: BlockOf<'cardGrid'>}) => (
  <View style={styles.section}>
    <Text style={styles.eyebrow}>{block.eyebrow}</Text><Text accessibilityRole="header" style={styles.heading}>{block.title}</Text>
    {block.cards?.map(card => <View key={card.title} style={styles.card}><RemoteImage height={170} media={card.image} /><View style={styles.cardCopy}><Text accessibilityRole="header" style={styles.title}>{card.title}</Text><Text style={styles.body}>{card.description}</Text><Text style={styles.price}>{card.price}</Text></View></View>)}
  </View>
);

const styles = StyleSheet.create({
  body: {color: colors.ink, lineHeight: 20, marginTop: 4},
  card: {backgroundColor: colors.blueSoft, marginTop: spacing.md},
  cardCopy: {padding: spacing.md},
  eyebrow: {fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase'},
  heading: {fontSize: 38, fontWeight: '900', letterSpacing: -2, lineHeight: 36, marginTop: spacing.xs, textTransform: 'uppercase'},
  price: {color: colors.tomato, fontWeight: '900', marginTop: spacing.sm, textAlign: 'right'},
  section: {backgroundColor: colors.white, padding: spacing.lg},
  title: {fontSize: 22, fontWeight: '900', textTransform: 'uppercase'},
});
