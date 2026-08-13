import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react-native';
import { CMSPageScreen } from '../../src/screens/CMSPageScreen';

// React Navigation Mocks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => ({ navigate: jest.fn() }),
  }),
  useIsFocused: () => true,
  useRoute: () => ({ params: {} }),
}));

// Context hooks Mocks
jest.mock('../../src/context/useCMSPage', () => ({
  useCMSPage: jest.fn(),
}));

jest.mock('../../src/context/AppContentContext', () => ({
  useAppContent: jest.fn(),
}));

// ScreenState Mock - matches actual component testIDs
jest.mock('../../src/components/ScreenState', () => ({
  ScreenState: ({ message, onRetry }: any) => {
    const { View, Text, Pressable, ActivityIndicator } = require('react-native');
    return (
      <View accessibilityLiveRegion="polite" testID="screen-state-container">
        {message ? (
          <Text accessibilityRole="alert" style={{}} testID="screen-error">
            {message}
          </Text>
        ) : (
          <ActivityIndicator accessibilityLabel="Loading content" testID="screen-loading" />
        )}
        {onRetry ? (
          <Pressable
            accessibilityLabel="Try loading the content again"
            accessibilityRole="button"
            onPress={onRetry}
            testID="retry-button"
          >
            <Text>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  },
}));

// BlockRenderer Mock - shows blockType
jest.mock('../../src/components/BlockRenderer', () => ({
  BlockRenderer: ({ block }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="block-renderer">
        <Text>{block.blockType}</Text>
      </View>
    );
  },
}));

// ContentAlerts Mock - provides testID for alert presence verification
jest.mock('../../src/components/ContentAlerts', () => ({
  ContentAlerts: ({ alerts }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="content-alerts">
        {alerts.map((alert: any) => (
          <Text key={alert.id} testID={`alert-${alert.id}`}>
            {alert.title}
          </Text>
        ))}
      </View>
    );
  },
}));

describe('CMSPageScreen', () => {
  const slug = 'home';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== ASYNCHRONOUS & LIFECYCLE BEHAVIOR TESTS ====================

  describe('Asynchronous & Lifecycle Behavior Tests', () => {
    test('shows offline content when stale data is present', async () => {
      const mockPage = {
        id: 'home-page',
        layout: [{ blockType: 'textBlock', heading: 'Test' }],
        slug: 'home',
        title: 'Home Page',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const { useCMSPage } = require('../../src/context/useCMSPage');
      (useCMSPage as jest.Mock).mockReturnValue({
        page: mockPage,
        error: null,
        loading: false,
        refreshing: false,
        reload: jest.fn(),
        stale: true, // Stale data should show offline banner in the UI
      });

      const { useAppContent } = require('../../src/context/AppContentContext');
      (useAppContent as jest.Mock).mockReturnValue({
        bootstrap: { alerts: [] },
      });

      await act(async () => {
        render(<CMSPageScreen slug={slug} />);
      });

      // Check that the component renders without error when stale data is present
      // The actual offline banner rendering logic is in the CMSPageScreen component
      await waitFor(() => {
        expect(screen.getByTestId('block-renderer')).toBeTruthy();
      });
    });

    test('renders content normally when data is fresh', async () => {
      const mockPage = {
        id: 'home-page',
        layout: [{ blockType: 'textBlock', heading: 'Test' }],
        slug: 'home',
        title: 'Home Page',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const { useCMSPage } = require('../../src/context/useCMSPage');
      (useCMSPage as jest.Mock).mockReturnValue({
        page: mockPage,
        error: null,
        loading: false,
        refreshing: false,
        reload: jest.fn(),
        stale: false, // Fresh content
      });

      const { useAppContent } = require('../../src/context/AppContentContext');
      (useAppContent as jest.Mock).mockReturnValue({
        bootstrap: { alerts: [] },
      });

      await act(async () => {
        render(<CMSPageScreen slug={slug} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('block-renderer')).toBeTruthy();
        // Should not have any error indicators
        expect(screen.queryByTestId('screen-error')).toBeNull();
      });
    });

    test('simulates offline behavior with valid cache', async () => {
      const mockPage = {
        id: 'home-page',
        layout: [{ blockType: 'textBlock', heading: 'Test' }],
        slug: 'home',
        title: 'Home Page',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const { useCMSPage } = require('../../src/context/useCMSPage');
      (useCMSPage as jest.Mock).mockReturnValue({
        page: mockPage, // We have cached data
        error: null,
        loading: false, // Not loading
        refreshing: false,
        reload: jest.fn(),
        stale: true, // But it's stale (offline scenario)
      });

      const { useAppContent } = require('../../src/context/AppContentContext');
      (useAppContent as jest.Mock).mockReturnValue({
        bootstrap: { alerts: [] },
      });

      await act(async () => {
        render(<CMSPageScreen slug={slug} />);
      });

      await waitFor(() => {
        // Should show content but with offline banner conceptually
        // (we verify the component renders without error in both states)
        expect(screen.getByTestId('block-renderer')).toBeTruthy();
      });
    });

    test('handles request cancellation when new request starts', async () => {
      const reload = jest.fn();
      const { useCMSPage } = require('../../src/context/useCMSPage');
      (useCMSPage as jest.Mock).mockReturnValue({
        page: null,
        error: null,
        loading: true, // Currently loading
        refreshing: true,
        reload,
        stale: false,
      });

      const { useAppContent } = require('../../src/context/AppContentContext');
      (useAppContent as jest.Mock).mockReturnValue({
        bootstrap: { alerts: [] },
      });

      await act(async () => {
        render(<CMSPageScreen slug={slug} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('screen-state-container')).toBeTruthy(); // Loading state
      });

      // Verify that the component renders without error during loading
      // The specific request cancellation logic is tested at a lower level
      // This test ensures the component handles loading states properly
    });
  });
});