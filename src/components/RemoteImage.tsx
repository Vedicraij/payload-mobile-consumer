import React, {useEffect, useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';

import {absoluteMediaURL} from '../api/content';
import {colors} from '../theme/tokens';
import type {Media} from '../types/content';

export const RemoteImage = ({media, height = 240}: {height?: number; media?: Media}) => {
  const uri = absoluteMediaURL(media?.url || undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View
        accessibilityLabel={failed && media?.alt ? `${media.alt}. Image unavailable.` : undefined}
        accessible={Boolean(failed && media?.alt)}
        style={[styles.placeholder, {height}]}
        testID="image-placeholder"
      />
    );
  }
  return (
    <Image
      accessibilityLabel={media?.alt || undefined}
      accessible={Boolean(media?.alt)}
      onError={() => setFailed(true)}
      resizeMode="cover"
      source={{uri}}
      style={[styles.image, {height}]}
    />
  );
};

const styles = StyleSheet.create({
  image: {width: '100%'},
  placeholder: {backgroundColor: colors.blueSoft, width: '100%'},
});
