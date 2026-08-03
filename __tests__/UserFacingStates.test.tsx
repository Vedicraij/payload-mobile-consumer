import {fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Linking} from 'react-native';

import {BlockRenderer} from '../src/components/BlockRenderer';
import {ScreenState} from '../src/components/ScreenState';
import {ReservationsScreen} from '../src/screens/ReservationsScreen';

test('exposes loading, error, and retry states to assistive technology', async () => {
  const retry = jest.fn();
  const {rerender} = await render(<ScreenState />);
  expect(screen.getByLabelText('Loading content')).toBeOnTheScreen();

  await rerender(<ScreenState message="Could not load content." onRetry={retry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load content.');
  await fireEvent.press(screen.getByTestId('retry-button'));
  expect(retry).toHaveBeenCalledTimes(1);
});

test('opens the external reservation experience', async () => {
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await render(<ReservationsScreen />);

  await fireEvent.press(screen.getByTestId('find-table-button'));

  await waitFor(() => expect(openURL).toHaveBeenCalledWith('https://payload-website-consumer.vercel.app/reservas'));
});

test('validates required and email fields before submitting a CMS form', async () => {
  await render(
    <BlockRenderer
      block={{
        blockType: 'formBlock',
        form: {
          fields: [
            {blockType: 'email', label: 'Email', name: 'email', required: true},
            {blockType: 'checkbox', label: 'Accept terms', name: 'terms', required: true},
          ],
          id: 'contact',
          title: 'Contact',
        },
      }}
      onNavigate={() => undefined}
    />,
  );

  await fireEvent.changeText(screen.getByTestId('form-field-email'), 'guest@example.com');
  await fireEvent.press(screen.getByTestId('form-contact-submit'));
  expect(screen.getByRole('alert')).toHaveTextContent('Complete all required fields.');

  await fireEvent.press(screen.getByTestId('form-field-terms'));
  await fireEvent.changeText(screen.getByTestId('form-field-email'), 'not-an-email');
  await fireEvent.press(screen.getByTestId('form-contact-submit'));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
});
