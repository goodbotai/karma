const {prepareConversation} = require('../user.js');

const trigger = require('./trigger.js');
const help = require('./help.js');
const consent = require('./consent.js');
const secondSurvey = require('./surveys/one.js');
const firstSurvey = require('./surveys/two.js');


module.exports = {
  help,
  prepareConversation,
  trigger,
  consent,
  firstSurvey,
  secondSurvey,
};
