import {fireEvent, render, screen} from '@testing-library/react-native';
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Linking} from 'react-native';

import {OperationalGate} from '../src/components/OperationalGate';
import {useAppContent} from '../src/context/AppContentContext';

// Mock the useAppContent hook
jest.mock('../src/context/AppContentContext', () => ({
  useAppContent: jest.fn(),
}));

const useAppContentMock = useAppContent as jest.MockedFunction<typeof useAppContent>;

const metrics = {
  frame: {height: 844, width: 390, x: 0, y: 0},
  insets: {bottom: 34, left: 0, right: 0, top: 47},
};

const renderGate = async (children: React.ReactNode = null) => {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <OperationalGate>{children}</OperationalGate>
    </SafeAreaProvider>,
  );
};

const appContent = (bootstrap: any) => ({
  bootstrap,
  error: null,
  loading: false,
  refresh: jest.fn().mockResolvedValue(undefined),
  stale: false,
});

describe('PlatformSpecific tests', () => {
  const Platform = require('react-native').Platform;
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  test('renders correctly on iOS', async () => {
    Platform.OS = 'ios';
    useAppContentMock.mockReturnValue(appContent({
      featureFlags: {},
      operationalControls: {mode: 'notice', bannerMessage: 'Test notice'},
      promotions: [],
    }));

    await renderGate();

    // Basic render check - notice should be visible
    expect(screen.getByTestId('operational-notice')).toHaveTextContent('Test notice');
  });

  test('renders correctly on Android', async () => {
    Platform.OS = 'android';
    useAppContentMock.mockReturnValue(appContent({
      featureFlags: {},
      operationalControls: {mode: 'notice', bannerMessage: 'Test notice'},
      promotions: [],
    }));

    await renderGate();

    // Basic render check - notice should be visible
    expect(screen.getByTestId('operational-notice')).toHaveTextContent('Test notice');
  });

  test('opens iOS store URL when on iOS', async () => {
    Platform.OS = 'ios';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    useAppContentMock.mockReturnValue(appContent({
      featureFlags: {},
      operationalControls: {
        appUpdate: {
          minimumVersion: '3.0.0',
          policy: 'required',
          iosStoreUrl: 'https://ios.app.store/update',
          androidStoreUrl: 'https://android.app.store/update',
          message: 'Update available'
        },
        mode: 'normal'
      },
      promotions: [],
    }));

    await renderGate();
    await fireEvent.press(screen.getByRole('link', { name: /update now/i }));
    expect(openURL).toHaveBeenCalledWith('https://ios.app.store/update');
  });

  test('opens Android store URL when on Android', async () => {
    Platform.OS = 'android';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    useAppContentMock.mockReturnValue(appContent({
      featureFlags: {},
      operationalControls: {
        appUpdate: {
          minimumVersion: '3.0.0',
          policy: 'required',
          iosStoreUrl: 'https://ios.app.store/update',
          androidStoreUrl: 'https://android.app.store/update',
          message: 'Update available'
        },
        mode: 'normal'
      },
      promotions: [],
    }));

    await renderGate();
    await fireEvent.press(screen.getByRole('link', { name: /update now/i }));
    expect(openURL).toHaveBeenCalledWith('https://android.app.store/update');
  });

  test('handles Platform.OS changes dynamically', async () => {
    Platform.OS = 'ios';
    useAppContentMock.mockReturnValue(appContent({
      featureFlags: {},
      operationalControls: {mode: 'notice', bannerMessage: 'Test notice'},
      promotions: [],
    }));

    await renderGate();

    // Change platform and re-render
    Platform.OS = 'android';
    await renderGate();

    // Component should still render without errors
    expect(screen.getByTestId('operational-notice')).toHaveTextContent('Test notice');
  });
});