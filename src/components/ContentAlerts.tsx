import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

import {RemoteImage} from './RemoteImage';
import {openContentLink} from './blocks/contentLinks';
import {colors, spacing} from '../theme/tokens';
import type {ContentAlert, ContentAlertAction} from '../types/content';
import {
  contentAlertKey,
  recordContentAlertPresentation,
  shouldPresentContentAlert,
} from '../utils/contentAlertFrequency';

export type ContentAlertEvent = {
  action?: ContentAlertAction;
  alert: ContentAlert;
  type: 'action' | 'dismiss' | 'impression';
};

type Props = {
  alerts?: ContentAlert[];
  isFocused: boolean;
  onEvent?: (event: ContentAlertEvent) => void;
  onNavigate: (path: string) => void;
  pageLoaded: boolean;
  scrollPercent: number;
  slug: string;
};

const noOp = () => undefined;
const noAlerts: ContentAlert[] = [];

export const ContentAlerts = ({
  alerts = noAlerts,
  isFocused,
  onEvent = noOp,
  onNavigate,
  pageLoaded,
  scrollPercent,
  slug,
}: Props) => {
  const active = isFocused && pageLoaded;
  const relevant = useMemo(
    () => alerts
      .filter(alert => alert.pageSlugs.length === 0 || alert.pageSlugs.some(
        pageSlug => pageSlug.replace(/^\/+|\/+$/g, '') === slug.replace(/^\/+|\/+$/g, ''),
      ))
      .sort((left, right) => right.priority - left.priority),
    [alerts, slug],
  );
  const [readyKeys, setReadyKeys] = useState<Set<string>>(new Set());
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [topBar, setTopBar] = useState<ContentAlert | null>(null);
  const [modal, setModal] = useState<ContentAlert | null>(null);
  const shownKeys = useRef(new Set<string>());

  useEffect(() => {
    shownKeys.current.clear();
    setReadyKeys(new Set());
    setDismissedKeys(new Set());
    setTopBar(null);
    setModal(null);
  }, [active, slug]);

  useEffect(() => {
    if (!active) return;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const loadKeys = relevant
      .filter(alert => alert.trigger.type === 'load')
      .map(contentAlertKey);
    if (loadKeys.length) {
      setReadyKeys(current => new Set([...current, ...loadKeys]));
    }
    relevant.forEach(alert => {
      if (alert.trigger.type !== 'delay') return;
      const timer = setTimeout(() => {
        setReadyKeys(current => new Set(current).add(contentAlertKey(alert)));
      }, Math.max(0, alert.trigger.delayMs || 0));
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [active, relevant]);

  useEffect(() => {
    if (!active) return;
    const reached = relevant
      .filter(alert => alert.trigger.type === 'scroll' && scrollPercent >= (alert.trigger.scrollPercent || 0))
      .map(contentAlertKey);
    if (reached.length) {
      setReadyKeys(current => new Set([...current, ...reached]));
    }
  }, [active, relevant, scrollPercent]);

  useEffect(() => {
    let cancelled = false;
    if (!active) return;

    const select = async (placement: ContentAlert['placement']) => {
      for (const alert of relevant) {
        const key = contentAlertKey(alert);
        if (alert.placement !== placement || !readyKeys.has(key) || dismissedKeys.has(key)) continue;
        if (shownKeys.current.has(key) || await shouldPresentContentAlert(alert)) return alert;
      }
      return null;
    };

    const update = async () => {
      const [nextTopBar, nextModal] = await Promise.all([select('topBar'), select('modal')]);
      if (cancelled) return;
      for (const alert of [nextTopBar, nextModal]) {
        if (!alert || shownKeys.current.has(contentAlertKey(alert))) continue;
        shownKeys.current.add(contentAlertKey(alert));
        await recordContentAlertPresentation(alert);
        if (!cancelled) onEvent({alert, type: 'impression'});
      }
      if (!cancelled) {
        setTopBar(nextTopBar);
        setModal(nextModal);
      }
    };
    update();
    return () => {
      cancelled = true;
    };
  }, [active, dismissedKeys, onEvent, readyKeys, relevant]);

  const dismiss = (alert: ContentAlert) => {
    if (!alert.dismissible) return;
    setDismissedKeys(current => new Set(current).add(contentAlertKey(alert)));
    onEvent({alert, type: 'dismiss'});
  };

  const openAction = (alert: ContentAlert, action: ContentAlertAction) => {
    onEvent({action, alert, type: 'action'});
    openContentLink(action.href, onNavigate);
  };

  const actions = (alert: ContentAlert, modalActions = false) => alert.actions.map(action => (
    <Pressable
      accessibilityRole="link"
      key={`${action.label}:${action.href}`}
      onPress={() => openAction(alert, action)}
      style={modalActions ? styles.modalAction : styles.topBarAction}>
      <Text style={modalActions ? styles.modalActionText : styles.topBarActionText}>{action.label}</Text>
    </Pressable>
  ));

  return (
    <>
      {topBar ? (
        <View accessibilityLiveRegion="polite" style={styles.topBar}>
          {topBar.image ? <View style={styles.topBarImage}><RemoteImage height={90} media={topBar.image} /></View> : null}
          <View style={styles.topBarCopy}>
            {topBar.eyebrow ? <Text style={styles.topBarEyebrow}>{topBar.eyebrow}</Text> : null}
            <Text accessibilityLabel={`${topBar.title}. ${topBar.message}`} accessibilityRole="alert" style={styles.topBarTitle}>{topBar.title}</Text>
            <Text style={styles.topBarMessage}>{topBar.message}</Text>
            <View style={styles.topBarActions}>{actions(topBar)}</View>
          </View>
          {topBar.dismissible ? (
            <Pressable accessibilityLabel={`Dismiss ${topBar.title}`} accessibilityRole="button" hitSlop={12} onPress={() => dismiss(topBar)} style={styles.close}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Modal
        animationType="fade"
        onRequestClose={() => modal && dismiss(modal)}
        transparent
        visible={Boolean(modal)}>
        {modal ? (
          <View style={styles.overlay}>
            <View accessibilityViewIsModal style={styles.modal}>
              {modal.image ? <RemoteImage height={240} media={modal.image} /> : null}
              <View style={styles.modalCopy}>
                {modal.eyebrow ? <Text style={styles.modalEyebrow}>{modal.eyebrow}</Text> : null}
                <Text accessibilityRole="header" style={styles.modalTitle}>{modal.title}</Text>
                <Text style={styles.modalMessage}>{modal.message}</Text>
                <View style={styles.modalActions}>{actions(modal, true)}</View>
                {modal.dismissible ? (
                  <Pressable accessibilityRole="button" onPress={() => dismiss(modal)} style={styles.modalDismiss}>
                    <Text style={styles.modalDismissText}>Not now</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  close: {padding: spacing.xs},
  closeText: {color: colors.ink, fontSize: 16, fontWeight: '900'},
  modal: {backgroundColor: colors.paper, borderTopColor: colors.corn, borderTopWidth: 8, maxHeight: '90%'},
  modalAction: {backgroundColor: colors.tomato, padding: spacing.md},
  modalActionText: {color: colors.white, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase'},
  modalActions: {gap: spacing.sm, marginTop: spacing.lg},
  modalCopy: {padding: spacing.xl},
  modalDismiss: {alignItems: 'center', marginTop: spacing.sm, padding: spacing.md},
  modalDismissText: {color: colors.ink, fontWeight: '700'},
  modalEyebrow: {color: colors.tomato, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase'},
  modalMessage: {color: colors.ink, fontSize: 17, lineHeight: 25},
  modalTitle: {color: colors.ink, fontSize: 38, fontWeight: '900', letterSpacing: -2, lineHeight: 38, marginVertical: spacing.md, textTransform: 'uppercase'},
  overlay: {backgroundColor: 'rgba(16,20,29,.72)', flex: 1, justifyContent: 'flex-end'},
  topBar: {alignItems: 'flex-start', backgroundColor: colors.corn, flexDirection: 'row', padding: spacing.md},
  topBarAction: {borderBottomColor: colors.ink, borderBottomWidth: 2, paddingVertical: spacing.xs},
  topBarActionText: {color: colors.ink, fontSize: 12, fontWeight: '900', textTransform: 'uppercase'},
  topBarActions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md},
  topBarCopy: {flex: 1},
  topBarEyebrow: {color: colors.tomato, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'},
  topBarImage: {height: 90, marginRight: spacing.md, width: 90},
  topBarMessage: {color: colors.ink, fontSize: 13, lineHeight: 18, marginTop: spacing.xs},
  topBarTitle: {color: colors.ink, fontSize: 18, fontWeight: '900', textTransform: 'uppercase'},
});
