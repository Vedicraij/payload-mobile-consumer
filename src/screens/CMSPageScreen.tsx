import type {NavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import React, {useCallback} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';

import {BlockRenderer} from '../components/BlockRenderer';
import {ScreenState} from '../components/ScreenState';
import {useCMSPage} from '../context/useCMSPage';
import {colors, spacing} from '../theme/tokens';
import type {ContentBlock} from '../types/content';

type Navigation = NavigationProp<Record<string, object | undefined>>;

const routeForPath = (path: string) => {
  if (path === '/') return {name: 'Home'};
  if (path === '/menu') return {name: 'Menu'};
  if (path === '/reservas') return {name: 'Reservations'};
  if (path === '/reorder') return {name: 'Reorder'};
  if (path.startsWith('/legal/')) return {name: 'Legal', params: {key: path.replace('/legal/', '')}};
  return null;
};

export const CMSPageScreen = ({slug}: {slug: string}) => {
  const navigation = useNavigation<Navigation>();
  const {page, error, loading, refreshing, reload, stale} = useCMSPage(slug);
  const onNavigate = useCallback((path: string) => {
    const target = routeForPath(path);
    if (!target) {
      if (__DEV__) console.warn(`Unsupported internal CMS path: ${path}`);
      return;
    }
    const parent = navigation.getParent<Navigation>();
    if (target.name === 'Legal') {
      (parent || navigation).navigate(target.name, target.params);
    } else {
      navigation.navigate(target.name);
    }
  }, [navigation]);

  if (loading && !page) return <ScreenState />;
  if (error && !page) return <ScreenState message={error} onRetry={reload} />;

  return (
    <View style={styles.container}>
      {stale ? <Text accessibilityRole="alert" style={styles.offline}>Offline content</Text> : null}
      <FlatList<ContentBlock>
        data={page?.layout || []}
        keyExtractor={(item, index) => `${item.blockType}-${index}`}
        refreshControl={<RefreshControl colors={[colors.tomato]} onRefresh={reload} refreshing={refreshing} tintColor={colors.tomato} />}
        renderItem={({item}) => <BlockRenderer block={item} onNavigate={onNavigate} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {backgroundColor: colors.paper, flex: 1},
  offline: {backgroundColor: colors.corn, color: colors.ink, fontSize: 11, fontWeight: '900', padding: spacing.sm, textAlign: 'center', textTransform: 'uppercase'},
});
