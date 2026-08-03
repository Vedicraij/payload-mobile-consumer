import type {NavigationProp} from '@react-navigation/native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, type NativeScrollEvent, type NativeSyntheticEvent, RefreshControl, StyleSheet, Text, View} from 'react-native';

import {BlockRenderer} from '../components/BlockRenderer';
import {ContentAlerts, type ContentAlertEvent} from '../components/ContentAlerts';
import {ScreenState} from '../components/ScreenState';
import {useAppContent} from '../context/AppContentContext';
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
  const isFocused = useIsFocused();
  const {bootstrap} = useAppContent();
  const {page, error, loading, refreshing, reload, stale} = useCMSPage(slug);
  const [scrollPercent, setScrollPercent] = useState(0);
  const posthog = usePostHog();

  const onAlertEvent = useCallback((event: ContentAlertEvent) => {
    if (event.type === 'impression') {
      posthog.capture('content_alert_impression', {
        alert_id: event.alert.id,
        alert_title: event.alert.title,
        alert_placement: event.alert.placement,
        page_slug: slug,
      });
    } else if (event.type === 'action') {
      posthog.capture('content_alert_action_tapped', {
        alert_id: event.alert.id,
        alert_title: event.alert.title,
        action_label: event.action?.label ?? null,
        action_href: event.action?.href ?? null,
        page_slug: slug,
      });
    } else if (event.type === 'dismiss') {
      posthog.capture('content_alert_dismissed', {
        alert_id: event.alert.id,
        alert_title: event.alert.title,
        alert_placement: event.alert.placement,
        page_slug: slug,
      });
    }
  }, [posthog, slug]);

  const onRefresh = useCallback(() => {
    posthog.capture('content_refresh_triggered', {page_slug: slug});
    reload();
  }, [posthog, reload, slug]);

  useEffect(() => setScrollPercent(0), [slug]);
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
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const scrollableHeight = contentSize.height - layoutMeasurement.height;
    const nextPercent = scrollableHeight > 0
      ? Math.min(100, Math.max(0, Math.round((contentOffset.y / scrollableHeight) * 100)))
      : 0;
    setScrollPercent(current => current === nextPercent ? current : nextPercent);
  }, []);

  if (loading && !page) return <ScreenState />;
  if (error && !page) return <ScreenState message={error} onRetry={reload} />;

  return (
    <View style={styles.container}>
      {stale ? <Text accessibilityRole="alert" style={styles.offline}>Offline content</Text> : null}
      <ContentAlerts
        alerts={bootstrap?.alerts}
        isFocused={isFocused}
        onEvent={onAlertEvent}
        onNavigate={onNavigate}
        pageLoaded={Boolean(page)}
        scrollPercent={scrollPercent}
        slug={slug}
      />
      <FlatList<ContentBlock>
        data={page?.layout || []}
        keyExtractor={(item, index) => `${item.blockType}-${index}`}
        refreshControl={<RefreshControl colors={[colors.tomato]} onRefresh={onRefresh} refreshing={refreshing} tintColor={colors.tomato} />}
        renderItem={({item}) => <BlockRenderer block={item} onNavigate={onNavigate} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {backgroundColor: colors.paper, flex: 1},
  offline: {backgroundColor: colors.corn, color: colors.ink, fontSize: 11, fontWeight: '900', padding: spacing.sm, textAlign: 'center', textTransform: 'uppercase'},
});
