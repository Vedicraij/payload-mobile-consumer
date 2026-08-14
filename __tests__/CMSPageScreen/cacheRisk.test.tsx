import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react-native';
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

describe('CMSPageScreen - Cache Risk Test', () => {
  const slug = 'home';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const mockPageData = {
    id: 'test-page',
    slug: 'test',
    title: 'Test Page',
    layout: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    nextChangeAt: '2099-01-01T00:00:00.000Z', // Far future to simulate fresh content
  };

  it('should display offline banner when cached content is stale (current buggy behavior)', async () => {
    // Mock useCMSPage hook to return stale data (current buggy behavior)
    const { useCMSPage } = require('../../src/context/useCMSPage');
    (useCMSPage as jest.Mock).mockReturnValue({
      page: mockPageData,
      error: null,
      loading: false,
      refreshing: false,
      reload: jest.fn(),
      stale: true, // This is the current buggy behavior - marked stale even though content is fresh
    });

    const { useAppContent } = require('../../src/context/AppContentContext');
    (useAppContent as jest.Mock).mockReturnValue({
      bootstrap: { alerts: [] },
    });

    await act(async () => {
      render(<CMSPageScreen slug={slug} />);
    });

    // Wait for content to load - using the same pattern as other tests
    await waitFor(() => {
      expect(screen.getByTestId(`cms-page-${slug}`)).toBeTruthy();
    });

    // Check if offline banner is displayed (this demonstrates the bug)
    const offlineBanner = screen.getByTestId('offline-content-banner');
    // Using toBeTruthy() instead of toBeInTheDocument()
    expect(offlineBanner).toBeTruthy();
    // Using toHaveTextContent() from the other tests
    expect(offlineBanner).toHaveTextContent('Offline content');
  });

  it('should NOT display offline banner when cached content is fresh (expected correct behavior)', async () => {
    // Mock useCMSPage hook to return fresh data (expected correct behavior)
    const { useCMSPage } = require('../../src/context/useCMSPage');
    (useCMSPage as jest.Mock).mockReturnValue({
      page: mockPageData,
      error: null,
      loading: false,
      refreshing: false,
      reload: jest.fn(),
      stale: false, // This is what should happen - content is fresh, not stale
    });

    const { useAppContent } = require('../../src/context/AppContentContext');
    (useAppContent as jest.Mock).mockReturnValue({
      bootstrap: { alerts: [] },
    });

    await act(async () => {
      render(<CMSPageScreen slug={slug} />);
    });

    // Wait for content to load - using the same pattern as other tests
    await waitFor(() => {
      expect(screen.getByTestId(`cms-page-${slug}`)).toBeTruthy();
    });

    // Check if offline banner is NOT displayed (this is what we expect after fix)
    // Using the same assertion pattern as other tests for negative cases
    expect(screen.queryByTestId('offline-content-banner')).toBeNull();
  });
});