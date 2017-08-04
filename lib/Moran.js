const Aggregate = require('./Aggregate.js');
const Facebook = require('./Facebook.js');
const FacebookUtils = require('./FacebookUtils.js');
const Services = require('./Services.js');
const Config = require('../config/Config.js');

module.exports = {
  aggregate: Aggregate,
  facebook: Facebook,
  facebookUtils: FacebookUtils,
  services: Services,
  config: Config,
}
