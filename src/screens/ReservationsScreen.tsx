import {usePostHog} from 'posthog-react-native';
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../theme/tokens';

export const ReservationsScreen = () => {
  const posthog = usePostHog();
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Casa Maiz</Text>
      <Text accessibilityRole="header" style={styles.title}>Your table is waiting.</Text>
      <Text style={styles.body}>This demo keeps the reservation provider external. The CMS controls this entry point and its availability.</Text>
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        testID="find-table-button"
        onPress={() => posthog.capture('reservation_started')}>
        <Text style={styles.buttonText}>Find a table</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {color: colors.white, fontSize: 18, lineHeight: 28, marginTop: spacing.lg},
  button: {backgroundColor: colors.corn, marginTop: spacing.xl, padding: spacing.md},
  buttonText: {color: colors.ink, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  container: {backgroundColor: colors.blue, flex: 1, justifyContent: 'center', padding: spacing.xl},
  eyebrow: {color: colors.corn, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase'},
  title: {color: colors.white, fontSize: 56, fontWeight: '900', letterSpacing: -3, lineHeight: 50, marginTop: spacing.sm, textTransform: 'uppercase'},
});
