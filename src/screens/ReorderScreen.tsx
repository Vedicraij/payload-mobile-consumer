import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../theme/tokens';

export const ReorderScreen = () => <View style={styles.container} testID="reorder-screen"><Text style={styles.eyebrow}>Feature flag enabled</Text><Text accessibilityRole="header" style={styles.title}>Order your favorites again.</Text><Text style={styles.body}>Ordering remains in the external restaurant platform. Payload controls whether this entry point is visible.</Text></View>;

const styles = StyleSheet.create({
  body: {fontSize: 17, lineHeight: 26, marginTop: spacing.lg},
  container: {backgroundColor: colors.corn, flex: 1, justifyContent: 'center', padding: spacing.xl},
  eyebrow: {fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase'},
  title: {fontSize: 48, fontWeight: '900', letterSpacing: -3, lineHeight: 43, marginTop: spacing.sm, textTransform: 'uppercase'},
});
