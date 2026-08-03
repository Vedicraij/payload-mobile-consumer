import DeviceInfo from 'react-native-device-info';
import {usePostHog} from 'posthog-react-native';
import React, {useEffect, useMemo, useState} from 'react';
import {Linking, Modal, Platform, Pressable, StyleSheet, Text, View} from 'react-native';

import {ScreenState} from './ScreenState';
import {useAppContent} from '../context/AppContentContext';
import {colors, spacing} from '../theme/tokens';

const compare = (left: string, right: string) => {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
  }
  return 0;
};

export const OperationalGate = ({children}: {children: React.ReactNode}) => {
  const {bootstrap, error, loading, refresh} = useAppContent();
  const [dismissed, setDismissed] = useState(false);
  const controls = bootstrap?.operationalControls;
  const update = controls?.appUpdate;
  const version = DeviceInfo.getVersion();
  const required = Boolean(update?.minimumVersion && compare(version, update.minimumVersion) < 0) || update?.policy === 'required';
  const recommended = update?.policy === 'recommended' && Boolean(update.recommendedVersion && compare(version, update.recommendedVersion) < 0);
  const storeURL = Platform.OS === 'ios' ? update?.iosStoreUrl : update?.androidStoreUrl;
  const showUpdate = useMemo(() => !dismissed && (required || recommended), [dismissed, recommended, required]);
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
  }, [showUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !bootstrap) return <ScreenState />;
  if (error && !bootstrap) return <ScreenState message={error} onRetry={refresh} />;
  if (controls?.mode === 'maintenance') return <View style={styles.maintenance}><Text style={styles.mark}>CASA MAIZ</Text><Text style={styles.title}>The fire rests for a moment.</Text><Text style={styles.body}>{controls.maintenanceMessage || 'We are performing maintenance. Please return soon.'}</Text></View>;

  return (
    <>
      {controls?.mode === 'notice' && controls.bannerMessage ? <Text style={styles.notice}>{controls.bannerMessage}</Text> : null}
      {bootstrap?.featureFlags.show_store_locator_banner ? <Text style={styles.storeBanner}>Find your nearest Casa Maiz location</Text> : null}
      {children}
      <Modal animationType="slide" transparent visible={showUpdate}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.mark}>APP UPDATE</Text>
            <Text style={styles.modalTitle}>{required ? 'Update required' : 'A new version is ready'}</Text>
            <Text style={styles.modalBody}>{update?.message || 'Update Casa Maiz for the latest experience.'}</Text>
            {storeURL ? (
              <Pressable
                onPress={() => {
                  posthog.capture('app_update_started', {
                    update_policy: update?.policy ?? null,
                    is_required: required,
                    current_version: version,
                    store_url: storeURL,
                  });
                  Linking.openURL(storeURL);
                }}
                style={styles.updateButton}>
                <Text style={styles.updateButtonText}>Update now</Text>
              </Pressable>
            ) : null}
            {!required ? <Pressable onPress={() => setDismissed(true)} style={styles.later}><Text>Not now</Text></Pressable> : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  body: {color: colors.white, fontSize: 18, lineHeight: 28, marginTop: spacing.lg},
  later: {alignItems: 'center', padding: spacing.md},
  maintenance: {backgroundColor: colors.blue, flex: 1, justifyContent: 'center', padding: spacing.xl},
  mark: {color: colors.tomato, fontSize: 11, fontWeight: '900', letterSpacing: 1.4},
  modal: {backgroundColor: colors.paper, borderTopColor: colors.corn, borderTopWidth: 8, padding: spacing.xl},
  modalBody: {fontSize: 17, lineHeight: 25},
  modalTitle: {fontSize: 38, fontWeight: '900', letterSpacing: -2, lineHeight: 36, marginVertical: spacing.md, textTransform: 'uppercase'},
  notice: {backgroundColor: colors.corn, color: colors.ink, fontSize: 10, fontWeight: '900', padding: spacing.sm, textAlign: 'center', textTransform: 'uppercase'},
  overlay: {backgroundColor: 'rgba(16,20,29,.72)', flex: 1, justifyContent: 'flex-end'},
  storeBanner: {backgroundColor: colors.blueSoft, color: colors.blue, fontSize: 10, fontWeight: '900', padding: spacing.sm, textAlign: 'center', textTransform: 'uppercase'},
  title: {color: colors.white, fontSize: 52, fontWeight: '900', letterSpacing: -3, lineHeight: 47, marginTop: spacing.sm, textTransform: 'uppercase'},
  updateButton: {backgroundColor: colors.tomato, marginTop: spacing.lg, padding: spacing.md},
  updateButtonText: {color: colors.white, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
});
