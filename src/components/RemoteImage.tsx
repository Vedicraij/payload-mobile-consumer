import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

import {absoluteMediaURL} from '../api/content';
import {colors} from '../theme/tokens';
import type {Media} from '../types/content';

export const RemoteImage = ({media, height = 240}: {height?: number; media?: Media}) => {
  const uri = absoluteMediaURL(media?.url || undefined);
  const heightStyle = height === 90 ? styles.h90 : height === 170 ? styles.h170 : height === 190 ? styles.h190 : height === 300 ? styles.h300 : height === 340 ? styles.h340 : styles.h240;
  if (!uri) {
    return <View style={[styles.placeholder, heightStyle]} />;
  }
  return <Image accessibilityLabel={media?.alt || undefined} resizeMode="cover" source={{uri}} style={[styles.image, heightStyle]} />;
};

const styles = StyleSheet.create({
  h90: {height: 90},
  h170: {height: 170},
  h190: {height: 190},
  h240: {height: 240},
  h300: {height: 300},
  h340: {height: 340},
  image: {width: '100%'},
  placeholder: {backgroundColor: colors.blueSoft, width: '100%'},
});
