import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';

import {ContentAlerts} from '../src/components/ContentAlerts';
import type {ContentAlert} from '../src/types/content';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-device-info', () => ({getUniqueId: jest.fn()}));

const makeAlert = (overrides: Partial<ContentAlert>): ContentAlert => ({
  actions: [],
  dismissible: true,
  frequency: {type: 'always'},
  id: 'alert',
  message: 'Alert message',
  pageSlugs: ['home'],
  placement: 'topBar',
  priority: 1,
  revision: 1,
  title: 'Alert title',
  trigger: {type: 'load'},
  ...overrides,
});

test('presents only the highest-priority eligible alert per placement', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ContentAlerts
        alerts={[
          makeAlert({id: 'low', title: 'Low priority'}),
          makeAlert({id: 'high', priority: 10, title: 'High priority'}),
          makeAlert({id: 'modal', placement: 'modal', title: 'Modal alert'}),
          makeAlert({id: 'other-page', pageSlugs: ['menu'], priority: 100, title: 'Wrong page'}),
        ]}
        isFocused
        onNavigate={() => undefined}
        pageLoaded
        scrollPercent={0}
        slug="home"
      />,
    );
  });

  const text = renderer!.root.findAllByType(Text).map(node => node.props.children);
  expect(text).toContain('High priority');
  expect(text).toContain('Modal alert');
  expect(text).not.toContain('Low priority');
  expect(text).not.toContain('Wrong page');
});

test('waits for the configured scroll threshold', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const props = {
    alerts: [makeAlert({title: 'Scrolled alert', trigger: {scrollPercent: 50, type: 'scroll'}})],
    isFocused: true,
    onNavigate: () => undefined,
    pageLoaded: true,
    slug: 'home',
  };
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<ContentAlerts {...props} scrollPercent={49} />);
  });
  expect(renderer!.root.findAllByType(Text).map(node => node.props.children)).not.toContain('Scrolled alert');

  await ReactTestRenderer.act(async () => {
    renderer!.update(<ContentAlerts {...props} scrollPercent={50} />);
  });
  expect(renderer!.root.findAllByType(Text).map(node => node.props.children)).toContain('Scrolled alert');
});
