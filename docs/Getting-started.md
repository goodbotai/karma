# Install and run
```
git clone git@github.com:onaio/karma.git
npm install
page_toke="" verify_token="" app_secret="" port="" node karma.js
```

# Dev
```
npm install supervisor --save-dev
page_token="" app_secret="" verify_token="" PORT="" ./node_modules/.bin/supervisor Karma.js
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
