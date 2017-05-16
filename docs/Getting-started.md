# Install and run
```
git clone git@github.com:onaio/karma.git
npm install
page_toke="" verify_token="" app_secret="" port="" node karma.js
```

# Dev
```
npm install --dev
page_token="" app_secret="" verify_token="" PORT="" ./node_modules/.bin/supervisor Karma.js
```

# Docker
The PORT can be changed in the docker-compose.yml file

## to build
```
page_token=<> app_secret=<> verify_token=nyan PORT=3000 rapidpro_token=<> docker-compose run karma
page_token=<> app_secret=<> verify_token=nyan PORT=3000 rapidpro_token=<> docker-compose up --build
```

## to run
```
page_token=<> app_secret=<> verify_token=nyan PORT=3000 rapidpro_token=<> docker-compose up
```

# Testing
## Linting
```
npm install eslint --save-dev
./node_modules/.bin/eslint karma.js
./node_modules/.bin/eslint karma.js --fix
```
Setting rules
http://eslint.org/docs/user-guide/configuring#using-eslintrecommended
```
./node_modules/.bin/eslint karma.js --rule 'max-len: [error, 80]'
```

# Babel
```
npm install --save-dev babel-core

```
