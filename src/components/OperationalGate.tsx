import DeviceInfo from 'react-native-device-info';
import {usePostHog} from 'posthog-react-native';
import React, {useEffect, useState} from 'react';
import {Linking, Modal, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenState} from './ScreenState';
import {useAppContent} from '../context/AppContentContext';
import {colors, spacing} from '../theme/tokens';

const compare = (left: string, right: string) => {
  const segment = (value: string) => Number(value.match(/^\d+/)?.[0] || 0);
  const a = left.split('.').map(segment);
  const b = right.split('.').map(segment);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
  }
  return 0;
};

export const OperationalGate = ({children}: {children: React.ReactNode}) => {
  const {bootstrap, error, loading, refresh} = useAppContent();
  const [dismissed, setDismissed] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const insets = useSafeAreaInsets();
  const controls = bootstrap?.operationalControls;
  const update = controls?.appUpdate;
  const version = DeviceInfo.getVersion();
  const required = Boolean(update?.minimumVersion && compare(version, update.minimumVersion) < 0) || update?.policy === 'required';
  const recommended = update?.policy === 'recommended' && Boolean(update.recommendedVersion && compare(version, update.recommendedVersion) < 0);
  const storeURL = Platform.OS === 'ios' ? update?.iosStoreUrl : update?.androidStoreUrl;
  const showUpdate = required || (!dismissed && recommended);
  const posthog = usePostHog();

  useEffect(() => {
    if (showUpdate) {
      posthog.capture('app_update_prompted', {
        update_policy: update?.policy ?? null,
        is_required: required,
        current_version: version,
        minimum_version: update?.minimumVersion ?? null,
        recommended_version: update?.recommendedVersion ?? null,
      });
    }
  }, [posthog, required, showUpdate, update?.minimumVersion, update?.policy, update?.recommendedVersion, version]);

  const openStore = async () => {
    if (!storeURL) return;
    setUpdateError('');
    posthog.capture('app_update_started', {
      update_policy: update?.policy ?? null,
      is_required: required,
      current_version: version,
      store_url: storeURL,
    });
    try {
      if (!await Linking.canOpenURL(storeURL)) {
        throw new Error('The app store link is not available on this device.');
      }
      await Linking.openURL(storeURL);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The app store could not be opened.';
      setUpdateError(message);
      posthog.capture('app_update_open_failed', {store_url: storeURL});
    }
  };

  if (loading && !bootstrap) return <ScreenState />;
  if (error && !bootstrap) return <ScreenState message={error} onRetry={refresh} />;
  if (controls?.mode === 'maintenance') return <View style={[styles.maintenance, {paddingBottom: spacing.xl + insets.bottom, paddingTop: spacing.xl + insets.top}]} testID="maintenance-screen"><Text style={styles.mark}>CASA MAÍZ</Text><Text accessibilityRole="header" style={styles.title}>The fire rests for a moment.</Text><Text style={styles.body}>{controls.maintenanceMessage || 'We are performing maintenance. Please return soon.'}</Text><Pressable accessibilityRole="button" onPress={refresh} style={styles.maintenanceButton} testID="maintenance-retry-button"><Text style={styles.maintenanceButtonText}>Check again</Text></Pressable></View>;

  const showNotice = controls?.mode === 'notice' && Boolean(controls.bannerMessage);
  const showStoreBanner = Boolean(bootstrap?.featureFlags.show_store_locator_banner);
  const showBannerStack = showNotice || showStoreBanner;

  return (
    <View style={styles.container}>
      {showBannerStack ? (
        <View style={[styles.bannerStack, !showNotice && styles.storeBannerBackground, {paddingTop: insets.top}]}>
          {showNotice ? <Text accessibilityRole="alert" style={styles.notice} testID="operational-notice">{controls?.bannerMessage}</Text> : null}
          {showStoreBanner ? <Text style={styles.storeBanner} testID="store-locator-banner">Find your nearest Casa Maíz location</Text> : null}
        </View>
      ) : null}
      {children}
      <Modal animationType="slide" onRequestClose={() => !required && setDismissed(true)} transparent visible={showUpdate}>
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={[styles.modal, {paddingBottom: spacing.xl + insets.bottom}]} testID="app-update-modal">
            <Text style={styles.mark}>APP UPDATE</Text>
            <Text accessibilityRole="header" style={styles.modalTitle}>{required ? 'Update required' : 'A new version is ready'}</Text>
            <Text style={styles.modalBody}>{update?.message || 'Update Casa Maíz for the latest experience.'}</Text>
            {storeURL ? (
              <Pressable
                accessibilityRole="link"
                onPress={openStore}
                style={styles.updateButton}
                testID="update-now-button">
                <Text style={styles.updateButtonText}>Update now</Text>
              </Pressable>
            ) : required ? (
              <Pressable accessibilityRole="button" onPress={refresh} style={styles.updateButton} testID="update-check-again-button">
                <Text style={styles.updateButtonText}>Check again</Text>
              </Pressable>
            ) : null}
            {updateError ? <Text accessibilityRole="alert" style={styles.error}>{updateError}</Text> : null}
            {!required ? <Pressable accessibilityRole="button" onPress={() => setDismissed(true)} style={styles.later} testID="update-later-button"><Text>Not now</Text></Pressable> : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerStack: {backgroundColor: colors.corn},
  body: {color: colors.white, fontSize: 18, lineHeight: 28, marginTop: spacing.lg},
  container: {backgroundColor: colors.paper, flex: 1},
  error: {color: colors.tomato, fontWeight: '700', marginTop: spacing.md},
  later: {alignItems: 'center', padding: spacing.md},
  maintenance: {backgroundColor: colors.blue, flex: 1, justifyContent: 'center', padding: spacing.xl},
  maintenanceButton: {borderColor: colors.corn, borderWidth: 2, marginTop: spacing.xl, padding: spacing.md},
  maintenanceButtonText: {color: colors.corn, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  mark: {color: colors.tomato, fontSize: 11, fontWeight: '900', letterSpacing: 1.4},
  modal: {backgroundColor: colors.paper, borderTopColor: colors.corn, borderTopWidth: 8, padding: spacing.xl},
  modalBody: {fontSize: 17, lineHeight: 25},
  modalTitle: {fontSize: 38, fontWeight: '900', letterSpacing: -2, lineHeight: 36, marginVertical: spacing.md, textTransform: 'uppercase'},
  notice: {backgroundColor: colors.corn, color: colors.ink, fontSize: 10, fontWeight: '900', padding: spacing.sm, textAlign: 'center', textTransform: 'uppercase'},
  overlay: {backgroundColor: 'rgba(16,20,29,.72)', flex: 1, justifyContent: 'flex-end'},
  storeBanner: {backgroundColor: colors.blueSoft, color: colors.blue, fontSize: 10, fontWeight: '900', padding: spacing.sm, textAlign: 'center', textTransform: 'uppercase'},
  storeBannerBackground: {backgroundColor: colors.blueSoft},
  title: {color: colors.white, fontSize: 52, fontWeight: '900', letterSpacing: -3, lineHeight: 47, marginTop: spacing.sm, textTransform: 'uppercase'},
  updateButton: {backgroundColor: colors.tomato, marginTop: spacing.lg, padding: spacing.md},
  updateButtonText: {color: colors.white, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
});
