import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';
import {BlockRenderer} from '../src/components/BlockRenderer';

const richText = (text: string) => ({root: {children: [{children: [{text, type: 'text'}], type: 'paragraph'}], type: 'root'}});

describe('BlockRenderer - Content Display Tests', () => {
  // Test that blocks render the correct text content
  test('restaurantHero block displays headline and description', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'restaurantHero',
        headline: 'Test Hero Headline',
        description: 'Test Hero Description',
        eyebrow: 'Test Eyebrow'
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test Eyebrow')).toBeTruthy();
    expect(await screen.findByText('Test Hero Headline')).toBeTruthy();
    expect(await screen.findByText('Test Hero Description')).toBeTruthy();
  });

  test('cardGrid block displays title and card details', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'cardGrid',
        title: 'Test Card Grid Title',
        eyebrow: 'Test Eyebrow',
        cards: [{
          title: 'Test Card Title',
          description: 'Test Card Description',
          price: '$19.99',
          image: {id: 'card-image', url: '/test.jpg'}
        }]
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test Eyebrow')).toBeTruthy();
    expect(await screen.findByText('Test Card Grid Title')).toBeTruthy();
    expect(await screen.findByText('Test Card Title')).toBeTruthy();
    expect(await screen.findByText('Test Card Description')).toBeTruthy();
    expect(await screen.findByText('$19.99')).toBeTruthy();
  });

  test('carousel block displays title and slide details', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'carousel',
        title: 'Test Carousel Title',
        slides: [
          {title: 'Slide 1 Title', description: 'Slide 1 Description'},
          {title: 'Slide 2 Title', description: 'Slide 2 Description'}
        ]
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test Carousel Title')).toBeTruthy();
    expect(await screen.findByText('Slide 1 Title')).toBeTruthy();
    expect(await screen.findByText('Slide 1 Description')).toBeTruthy();
    expect(await screen.findByText('Slide 2 Title')).toBeTruthy();
    expect(await screen.findByText('Slide 2 Description')).toBeTruthy();
  });

  test('promoRail block displays title and promotion details', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'promoRail',
        title: 'Test Promo Rail Title',
        promotions: [
          {id: 'promo1', title: 'Promo 1', description: 'First promotion'},
          {id: 'promo2', title: 'Promo 2', description: 'Second promotion'}
        ]
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test Promo Rail Title')).toBeTruthy();
    expect(await screen.findByText('Promo 1')).toBeTruthy();
    expect(await screen.findByText('First promotion')).toBeTruthy();
    expect(await screen.findByText('Promo 2')).toBeTruthy();
    expect(await screen.findByText('Second promotion')).toBeTruthy();
  });

  test('textBlock block displays heading, body, and eyebrow', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'textBlock',
        heading: 'Test Heading',
        body: 'Test body content',
        eyebrow: 'Test Eyebrow'
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test Eyebrow')).toBeTruthy();
    expect(await screen.findByText('Test Heading')).toBeTruthy();
    expect(await screen.findByText('Test body content')).toBeTruthy();
  });

  test('cta block displays rich text content', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'cta',
        richText: richText('Test CTA Rich Text Content'),
        links: [{id: 'link1', link: {label: 'Test Link', url: '/test-link'}}]
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test CTA Rich Text Content')).toBeTruthy();
  });

  test('content block displays column rich text', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'content',
        columns: [{
          richText: richText('Test column content'),
          enableLink: true,
          link: {label: 'Read more', url: '/read-more'}
        }]
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test column content')).toBeTruthy();
    expect(await screen.findByText('Read more')).toBeTruthy();
  });

  test('archive block displays intro content and posts', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'archive',
        introContent: richText('Test archive intro'),
        posts: [
          {id: 'post1', title: 'First Post Title', excerpt: 'First post excerpt'},
          {id: 'post2', title: 'Second Post Title', excerpt: 'Second post excerpt'}
        ]
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test archive intro')).toBeTruthy();
    expect(await screen.findByText('First Post Title')).toBeTruthy();
    expect(await screen.findByText('First post excerpt')).toBeTruthy();
    expect(await screen.findByText('Second Post Title')).toBeTruthy();
    expect(await screen.findByText('Second post excerpt')).toBeTruthy();
  });

  test('formBlock displays form title and fields', async () => {
    await render(<BlockRenderer
      block={{
        blockType: 'formBlock',
        form: {
          id: 'test-form',
          title: 'Test Form Title',
          fields: [
            {blockType: 'text', label: 'Name', name: 'name', placeholder: 'Enter your name'},
            {blockType: 'email', label: 'Email', name: 'email', placeholder: 'Enter your email'},
            {blockType: 'checkbox', label: 'Subscribe to newsletter', name: 'subscribe'}
          ],
          submitButtonLabel: 'Submit Form'
        }
      }}
      onNavigate={() => undefined}
    />);

    expect(await screen.findByText('Test Form Title')).toBeTruthy();
    expect(await screen.findByText('Name')).toBeTruthy();
    expect(await screen.findByText('Email')).toBeTruthy();
    expect(await screen.findByText('Subscribe to newsletter')).toBeTruthy();
    expect(await screen.findByText('Submit Form')).toBeTruthy();
  });

  // Test user interactions
  test('cta block link presses call onNavigate', async () => {
    const onNavigate = jest.fn();
    await render(<BlockRenderer
      block={{
        blockType: 'cta',
        richText: richText('Test CTA'),
        links: [{id: 'link1', link: {label: 'Click me', url: '/test-link'}}]
      }}
      onNavigate={onNavigate}
    />);

    // Find the pressable link by its text and press it
    const link = await screen.findByText('Click me');
    await fireEvent.press(link);

    expect(onNavigate).toHaveBeenCalledWith('/test-link');
  });

  test('form submission with valid data calls onNavigate', async () => {
    // Mock the form submission API
    jest.spyOn(require('../src/api/forms'), 'submitFormSubmission').mockResolvedValue(undefined);
    // Mock PostHog capture to avoid side effects
    jest.spyOn(require('posthog-react-native'), 'usePostHog').mockReturnValue({capture: jest.fn()});

    const onNavigate = jest.fn();
    const {rerender} = await render(<BlockRenderer
      block={{
        blockType: 'formBlock',
        form: {
          id: 'contact-form',
          title: 'Contact Form',
          fields: [
            {blockType: 'text', label: 'Name', name: 'name', required: true},
            {blockType: 'email', label: 'Email', name: 'email', required: true},
            {blockType: 'checkbox', label: 'Agree', name: 'agree', required: true}
          ],
          submitButtonLabel: 'Submit',
          confirmationType: 'redirect',
          redirect: {url: '/thank-you'}
        }
      }}
      onNavigate={onNavigate}
    />);

    // Fill out the form - using testIDs since they're available in the form fields
    const nameInput = await screen.findByTestId('form-field-name');
    await fireEvent.changeText(nameInput, 'John Doe');

    const emailInput = await screen.findByTestId('form-field-email');
    await fireEvent.changeText(emailInput, 'john@example.com');

    const agreeCheckbox = await screen.findByTestId('form-field-agree');
    await fireEvent.press(agreeCheckbox);

    // Submit the form
    const submitButton = await screen.findByTestId('form-contact-form-submit');
    await fireEvent.press(submitButton);

    // Wait for submission and navigation
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/thank-you');
    }, {timeout: 5000});
  });

  test('unknown blocks render null and show warning in development', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await render(<BlockRenderer
      block={{blockType: 'unknownBlockType'}}
      onNavigate={() => undefined}
    />);

    // Should show warning in development
    expect(warnSpy).toHaveBeenCalledWith('Unsupported CMS block: unknownBlockType');
    warnSpy.mockRestore();
  });
});