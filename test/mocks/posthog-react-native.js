/* global jest */

const client = {
  capture: jest.fn(),
  screen: jest.fn(),
};

class PostHog {
  constructor() {
    return client;
  }
}

module.exports = {
  __esModule: true,
  PostHogProvider: ({children}) => children,
  __mockPostHog: client,
  default: PostHog,
  usePostHog: () => client,
};
