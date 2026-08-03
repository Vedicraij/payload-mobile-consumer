import {fireEvent, render, screen} from '@testing-library/react-native';
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {OperationalGate} from '../src/components/OperationalGate';
import {useAppContent} from '../src/context/AppContentContext';
import type {Bootstrap} from '../src/types/content';

jest.mock('../src/context/AppContentContext', () => ({
  useAppContent: jest.fn(),
}));

const useAppContentMock = useAppContent as jest.MockedFunction<typeof useAppContent>;

const metrics = {
  frame: {height: 844, width: 390, x: 0, y: 0},
  insets: {bottom: 34, left: 0, right: 0, top: 47},
};

const renderGate = (children: React.ReactNode = null) => render(
  <SafeAreaProvider initialMetrics={metrics}>
    <OperationalGate>{children}</OperationalGate>
  </SafeAreaProvider>,
);

const appContent = (bootstrap: Bootstrap) => ({
  bootstrap,
  error: null,
  loading: false,
  refresh: jest.fn().mockResolvedValue(undefined),
  stale: false,
});

test('blocks regular content during maintenance and supports revalidation', async () => {
  const value = appContent({
    featureFlags: {},
    operationalControls: {maintenanceMessage: 'Back after service.', mode: 'maintenance'},
    promotions: [],
  });
  useAppContentMock.mockReturnValue(value);

  await renderGate();
  expect(screen.getByTestId('maintenance-screen')).toBeOnTheScreen();
  expect(screen.getByText('Back after service.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId('maintenance-retry-button'));
  expect(value.refresh).toHaveBeenCalledTimes(1);
});

test('does not allow a required update to be dismissed when its store URL is missing', async () => {
  const value = appContent({
    featureFlags: {},
    operationalControls: {
      appUpdate: {minimumVersion: '3.0.0', policy: 'required'},
      mode: 'normal',
    },
    promotions: [],
  });
  useAppContentMock.mockReturnValue(value);

  await renderGate();
  expect(screen.getByTestId('app-update-modal')).toBeOnTheScreen();
  expect(screen.queryByTestId('update-later-button')).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId('update-check-again-button'));
  expect(value.refresh).toHaveBeenCalledTimes(1);
});
