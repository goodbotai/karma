const {facebook, services, logger, config, localeUtils} = require('borq');

const {menu, defaultGreeting} = require('./constants.js');
const {trigger} = require('./conversations/conversations.js');

/**
 * Entrypoint into karma bot
 * @param {object} bot a botkit bot instance object
 */
function setup(bot) {
  facebook.setGreeting(defaultGreeting);
  facebook.setGetStarted('get_started');
  facebook.setMenu(menu);

  /**
   * @param {object} body - request body
   * @param {string} survey - the survey to start
   */
  async function sendGreeting(
    {urn, contact_name: contactName, contact},
    survey
  ) {
    try {
      const {
        body: {
          results: [rapidProContact],
        },
      } = await services.getUser({
        urn,
      });
      logger.log('info', {
        message: 'Triggered survey',
        survey,
        name: contactName,
        urn,
      });

      const lang =
        localeUtils.lookupISO6391(rapidProContact.language) ||
        config.defaultLanguage;
      const facebookId = urn.split(':')[1];
      const message = {user: facebookId, channel: facebookId};
      bot.startConversation(message, (err, convo) =>
        trigger(
          err,
          convo,
          bot,
          lang,
          message,
          contactName,
          rapidProContact,
          survey
        )
      );
    } catch (e) {
      logger.logRejectedPromise(
        `Failed to getRapidProContact in sendGreeting: ${e}`
      );
      throw Error(e);
    }
  }

  /**
   * Generalize request and response handling
   * @param {object} req - HTTP request object
   * @param {object} res - HTTP response object
   * @param {string} endpoint - the URN that the API exponses
   */
  async function handler(req, res, endpoint) {
    try {
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
    webserver.post('/trigger/one', (req, res) => handler(req, res, 'one'));
    webserver.post('/trigger/two', (req, res) => handler(req, res, 'two'));
  });
}

module.exports = setup;
