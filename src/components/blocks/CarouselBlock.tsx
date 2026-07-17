import React from 'react';
import {FlatList, StyleSheet, Text, View, useWindowDimensions} from 'react-native';

import {RemoteImage} from '../RemoteImage';
import {colors, spacing} from '../../theme/tokens';
import type {BlockOf} from '../../types/content';

export const CarouselBlock = ({block}: {block: BlockOf<'carousel'>}) => {
  const {width} = useWindowDimensions();
  return <View style={styles.section}><Text style={styles.heading}>{block.title}</Text><FlatList contentContainerStyle={styles.rail} data={block.slides || []} horizontal keyExtractor={item => item.title} renderItem={({item, index}) => <View style={[styles.slide, {width: width * 0.76}]}><Text style={styles.index}>0{index + 1}</Text><RemoteImage height={190} media={item.image} /><Text style={styles.title}>{item.title}</Text><Text>{item.description}</Text></View>} showsHorizontalScrollIndicator={false} /></View>;
};

const styles = StyleSheet.create({
  heading: {fontSize: 38, fontWeight: '900', letterSpacing: -2, lineHeight: 36, paddingHorizontal: spacing.lg, textTransform: 'uppercase'},
  index: {fontSize: 12, fontWeight: '900', marginBottom: spacing.xs},
  rail: {gap: spacing.md, paddingHorizontal: spacing.lg},
  section: {backgroundColor: colors.corn, paddingVertical: spacing.xl},
  slide: {marginTop: spacing.lg},
  title: {fontSize: 23, fontWeight: '900', marginTop: spacing.sm, textTransform: 'uppercase'},
});
