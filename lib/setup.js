const {
  facebook,
  services,
  logger,
  config,
  localeUtils,
  translate: t,
  conversations: {utterances},
  facebookUtils: {generateButtonTemplate},
} = require('borq');

const {menu, defaultGreeting} = require('./constants.js');
const trigger = require('./conversations/trigger.js');

function setup(bot) {

  facebook.setGreeting(defaultGreeting);
  facebook.setGetStarted('get_started');
  facebook.setMenu(menu);

  async function sendGreeting({urn, contact_name: contactName, contact}, slaveBot) {
    try {
      const {body: {results: [rapidProContact]}} = await services.getUser({urn});
      logger.log('info', {
        message: 'Triggered survey',
        survey: slaveBot,
        name: contactName,
        urn: urn,
      });

      let lang =
          localeUtils.lookupISO6391(rapidProContact.language) ||
          config.defaultLanguage;
      let facebookId = urn.split(':')[1];
      const message = {user: facebookId, channel: facebookId};
      bot.startConversation(message, (err, convo) => {
        return trigger(err,
                       convo,
                       bot,
                       lang,
                       message,
                       contactName,
                       rapidProContact,
                       slaveBot);
      });

    } catch (e) {
      logger.logRejectedPromise(`Failed to getRapidProContact in sendGreeting: ${e}`);
      throw Error(e);
    }
  }

  async function handler(req,res,endpoint) {
    try{
      await sendGreeting(req.body, endpoint);
      res.json({text: 'Successfully triggered messenger message'});
      res.statusCode = 200;
      res.send();
    } catch (e) {
      res.json({text: 'Failed'});
      res.statusCode = 400;
      res.send();
    }
  }

  facebook.start(bot, (err, webserver) => {
    // routes
    webserver.get('/', (req, res) => {
      const html = '<h3>Karma is your friend</h3>';
      res.send(html);
    });
    webserver.post('/trigger/one', (req, res) => {
      return handler(req,res,'one');
    });
    webserver.post('/trigger/two', (req, res) => {
      return handler(req,res,'two');
    });
  });
}

module.exports = setup;
