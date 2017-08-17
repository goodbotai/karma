module.exports = {
  apps : [
    {
      name      : 'Karma',
      script    : 'karma.js',
      // pm2 is only used in production.
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'cluster'
    },
  ],
};
