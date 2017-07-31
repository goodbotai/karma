const env = process.env;

module.exports = {
  // core
  environment: env.NODE_ENV || 'dev', // dev, prod, test
  PORT: env.PORT || 3000, // env to run karma on

  // facebook
  facebookPageAccessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN,
  facebookAppSecret: env.FACEBOOK_APP_SECRET,
  facebookApiVersion: env.FACEBOOK_API_VERSION || 'v2.6',
  facebookVerifyToken: env.FACEBOOK_VERIFY_TOKEN || 'karma', // webhook verification token

  // external data stores
  onadataApiToken: env.ONADATA_API_TOKEN,
  rapidproApiToken: env.RAPIDPRO_API_TOKEN,

  // logging and error reporting
  sentryDSN: env.SENTRY_DSN,
  karmaAccessLogFile: env.KARMA_ACCESS_LOG_FILE || './logs/karma_access.log',
  debugTranslations: env.DEBUG_TRANSLATIONS === 'true' || false,
};
