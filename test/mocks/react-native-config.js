const config = {
  CMS_REQUEST_TIMEOUT_MS: '10000',
  CMS_URL: 'https://payload-cms-poc-seven.vercel.app',
  DEFAULT_MARKET: 'MX',
  ENABLE_ANALYTICS: 'false',
  POSTHOG_HOST: 'https://us.i.posthog.com',
  POSTHOG_PROJECT_TOKEN: '',
  WEBSITE_URL: 'https://payload-website-consumer.vercel.app',
};

module.exports = {
  __esModule: true,
  Config: config,
  default: config,
};
