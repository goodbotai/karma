const trigger = require('./trigger.js');
const help = require('./help.js');
const quit = require('./quit.js');
const consent = require('./consent.js');
const firstSurvey = require('./surveys/one.js');
const secondSurvey = require('./surveys/two.js');


module.exports = {
  help,
  quit,
  trigger,
  consent,
  firstSurvey,
  secondSurvey,
};
