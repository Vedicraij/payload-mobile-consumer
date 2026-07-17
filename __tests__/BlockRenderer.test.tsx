import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text} from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('react-native-device-info', () => ({getVersion: () => '2.4.0'}));

import {BlockRenderer} from '../src/components/BlockRenderer';
import type {ContentBlock} from '../src/types/content';

const richText = (text: string) => ({root: {children: [{children: [{text, type: 'text'}], type: 'paragraph'}], type: 'root'}});

const knownBlocks: Array<[string, ContentBlock]> = [
  ['restaurantHero', {blockType: 'restaurantHero', headline: 'Hero'}],
  ['cardGrid', {blockType: 'cardGrid', title: 'Cards', cards: []}],
  ['carousel', {blockType: 'carousel', title: 'Slides', slides: []}],
  ['promoRail', {blockType: 'promoRail', title: 'Promotions', promotions: []}],
  ['textBlock', {blockType: 'textBlock', heading: 'Text', body: 'Body'}],
  ['imageBlock', {blockType: 'imageBlock', image: {id: 'image'}}],
  ['restaurantCTA', {blockType: 'restaurantCTA', headline: 'Visit us', label: 'Menu', href: '/menu'}],
  ['cta', {blockType: 'cta', richText: richText('Shared CTA'), links: []}],
  ['content', {blockType: 'content', columns: [{richText: richText('Shared content')}]}],
  ['mediaBlock', {blockType: 'mediaBlock', media: {id: 'media', url: '/media/photo.jpg', mimeType: 'image/jpeg'}}],
  ['archive', {blockType: 'archive', introContent: richText('Recent posts'), items: [{id: 'post', title: 'A post'}]}],
  ['formBlock', {blockType: 'formBlock', form: {id: 'contact', title: 'Contact', fields: [], submitButtonLabel: 'Send'}}],
];

test.each(knownBlocks)('renders the known %s CMS block', async (_slug, block) => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<BlockRenderer block={block} onNavigate={() => undefined} />);
  });
  expect(renderer!.toJSON()).not.toBeNull();
});

test('extracts and presents shared rich text', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<BlockRenderer block={{blockType: 'cta', richText: richText('Content delivered by Payload.')}} onNavigate={() => undefined} />);
  });
  const text = renderer!.root.findAllByType(Text).map(node => node.props.children);
  expect(text).toContain('Content delivered by Payload.');
});

test('ignores unknown CMS blocks with a development warning', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<BlockRenderer block={{blockType: 'futureBlock'}} onNavigate={() => undefined} />);
  });
  expect(renderer!.toJSON()).toBeNull();
  expect(warning).toHaveBeenCalledWith('Unsupported CMS block: futureBlock');
  warning.mockRestore();
});
