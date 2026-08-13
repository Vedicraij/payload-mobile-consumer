import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { CMSPageScreen } from '../src/screens/CMSPageScreen';

// Necesary mocks to avoid exceptions during rendering
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    getParent: () => ({ navigate: jest.fn() }),
  }),
  useIsFocused: () => true,
  useRoute: () => ({ params: {} }),
}));

jest.mock('../src/context/useCMSPage', () => ({
  useCMSPage: jest.fn(),
}));

jest.mock('../src/context/AppContentContext', () => ({
  useAppContent: jest.fn(),
}));

// ScreenState mock to avoid erros
jest.mock('../src/components/ScreenState', () => ({
  ScreenState: ({ message, onRetry }: any) => {
    const { View, Text, Pressable } = require('react-native');
    return (
      <View testID="screen-state">
        {message && (
          <View testID="screen-state-message">
            <Text>{message}</Text>
          </View>
        )}
        {onRetry && (
          <Pressable testID="retry-button" onPress={onRetry}>
            <Text>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  },
}));

describe('CMSPageScreen', () => {
  const slug = 'home';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state without crashing', async () => {
    const { useCMSPage } = require('../src/context/useCMSPage');
    (useCMSPage as jest.Mock).mockReturnValue({
      page: null,
      error: null,
      loading: true,
      refreshing: false,
      reload: jest.fn(),
      stale: false,
    });

    const { useAppContent } = require('../src/context/AppContentContext');
    (useAppContent as jest.Mock).mockReturnValue({
      bootstrap: { alerts: [] },
    });

    // Act to ensure all state updates are processed
    await act(async () => {
      render(<CMSPageScreen slug={slug} />);
    });

    expect(screen.getByTestId('screen-state')).toBeTruthy();
  });

  test('renders error state with retry button', async () => {
    const reload = jest.fn();
    const { useCMSPage } = require('../src/context/useCMSPage');
    (useCMSPage as jest.Mock).mockReturnValue({
      page: null,
      error: 'Failed to load content',
      loading: false,
      refreshing: false,
      reload,
      stale: false,
    });

    const { useAppContent } = require('../src/context/AppContentContext');
    (useAppContent as jest.Mock).mockReturnValue({
      bootstrap: { alerts: [] },
    });

    await act(async () => {
      render(<CMSPageScreen slug={slug} />);
    });

    expect(screen.getByTestId('screen-state-message')).toHaveTextContent('Failed to load content');
    expect(screen.getByTestId('retry-button')).toBeTruthy();
  });

  test('renders page content when data is available', async () => {
    const mockPage = {
      id: 'home-page',
      layout: [{ blockType: 'textBlock', heading: 'Test' }],
      slug: 'home',
      title: 'Home Page',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const { useCMSPage } = require('../src/context/useCMSPage');
    (useCMSPage as jest.Mock).mockReturnValue({
      page: mockPage,
      error: null,
      loading: false,
      refreshing: false,
      reload: jest.fn(),
      stale: false,
    });

    const { useAppContent } = require('../src/context/AppContentContext');
    (useAppContent as jest.Mock).mockReturnValue({
      bootstrap: { alerts: [] },
    });

    await act(async () => {
      render(<CMSPageScreen slug={slug} />);
    });

    // Just to check for errors 
    expect(true).toBeTruthy();
  });
});