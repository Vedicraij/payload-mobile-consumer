import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../theme/tokens';

export const ScreenState = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <View style={styles.container}>
    {message ? <Text style={styles.title}>{message}</Text> : <ActivityIndicator color={colors.tomato} size="large" />}
    {onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}><Text style={styles.buttonText}>Try again</Text></Pressable> : null}
  </View>
);

const styles = StyleSheet.create({
  button: {borderColor: colors.ink, borderWidth: 2, marginTop: spacing.lg, padding: spacing.md},
  buttonText: {fontWeight: '800', textTransform: 'uppercase'},
  container: {alignItems: 'center', backgroundColor: colors.paper, flex: 1, justifyContent: 'center', padding: spacing.xl},
  title: {fontSize: 22, fontWeight: '800', textAlign: 'center'},
});
