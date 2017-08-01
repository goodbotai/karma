# Production

### Environment variables

You will want to set at least some these env vars before running Karma either
in development or production.

|     Environment variable     |  Default  |
|:----------------------------:|:---------:|
|      NODE_ENV                |   'dev'   |
|      HOST_PORT (docker)      | undefined |
|      APP_PORT (docker)       |   3000    |
|      PORT                    |   3000    |
|      ONADATA_API_TOKEN       | undefined |
|      RAPIDPRO_API_TOKEN      | undefined |
|      RAPIDPRO_GROUPS         |    '[]'   |
|      SENTRY_DSN              | undefined |
|      KARMA_ACCESS_LOG_FILE   | undefined |
|      DEBUG_TRANSLATIONS      |   false   |
|   FACEBOOK_PAGE_ACCESS_TOKEN |  'karma'  |
|   FACEBOOK_VERIFY_TOKEN      | undefined |
|   FACEBOOK_APP_SECRET        | undefined |
|   FACEBOOK_API_VERSION       |   'v2.6'  |


### Using docker

```
$ docker-compose up -d
```

### Without docker
`HOST_PORT` and `APP_PORT` environment variables are only needed for docker.
When not using docker you can fail to set `PORT` and let it default to 3000
or set `PORT` to a different value.

* Install npm using your preferred method
* Clone Karma
```
$ git clone git@github.com:onaio/karma.git
```

* Install dependencies and run Karma
```
$ npm install yarn
$ yarn install
$ yarn add pm2

# Run Karma
$  pm2 start karma.js -i 0
```

# Development

There's no need to set `NODE_ENV` in development because Karma only
checks whether `NODE_ENV` is set to "production".


* Install npm using your preferred method
* Clone Karma
```
$ git clone git@github.com:onaio/karma.git
```

* Install dependencies and run Karma
```
$ npm install yarn
$ yarn install --only=dev

$ yarn dev
```
