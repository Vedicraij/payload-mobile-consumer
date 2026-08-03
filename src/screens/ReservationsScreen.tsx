import {usePostHog} from 'posthog-react-native';
import React, {useState} from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';

import {WEBSITE_URL} from '../api/config';
import {colors, spacing} from '../theme/tokens';

export const ReservationsScreen = () => {
  const posthog = usePostHog();
  const [error, setError] = useState('');

  const openReservations = async () => {
    const url = `${WEBSITE_URL}/reservas`;
    setError('');
    posthog.capture('reservation_started');
    try {
      if (!await Linking.canOpenURL(url)) throw new Error();
      await Linking.openURL(url);
    } catch {
      setError('Reservations could not be opened. Please try again.');
      posthog.capture('reservation_open_failed', {url});
    }
  };

  return (
    <View style={styles.container} testID="reservations-screen">
      <Text style={styles.eyebrow}>Casa Maíz</Text>
      <Text accessibilityRole="header" style={styles.title}>Your table is waiting.</Text>
      <Text style={styles.body}>This demo keeps the reservation provider external. The CMS controls this entry point and its availability.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityHint="Opens the reservation website"
        accessibilityLabel="Find a table"
        accessibilityRole="link"
        onPress={openReservations}
        style={styles.button}
        testID="find-table-button">
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
  error: {color: colors.corn, fontWeight: '700', marginTop: spacing.md},
  eyebrow: {color: colors.corn, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase'},
  title: {color: colors.white, fontSize: 56, fontWeight: '900', letterSpacing: -3, lineHeight: 50, marginTop: spacing.sm, textTransform: 'uppercase'},
});
