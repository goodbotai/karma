module.exports = {
  apps : [
    {
      name      : 'Karma',
      script    : 'Karma.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      instances: 1
    },
  ],
};
