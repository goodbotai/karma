const uuidV4 = require('uuid/v4');
const {
  localeUtils,
  config,
  services,
  facebook,
  logger,
  translate: t,
  conversations: {goto, utterances},
} = require('borq');
const {initConversation, createContact} = require('../utils.js');

const {maxRetries} = require('../constants.js');

/**
 * Initializes and handles the conversations of the first bot
 * @param {string} err an exception thrown by startConversation
 * @param {object} convo the conversation object
 * @param {string} referringSurveyUUID UUID of the survey that lead the user to the bot
 * @param {object} bot a botkit bot instance object
 * @param {object} message  Conversation message object from botkit
 */
async function consent(err, convo, referringSurveyUUID, bot, message) {
  const profile = await facebook.getFacebookProfile(message.user);
  const lang = localeUtils.lookupISO6391(localeUtils.pickLanguage(profile));
  const {generateYesNoButtonTemplate} = initConversation(lang, convo);

   convo.addMessage(
    {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: t(`${lang}:consent.text`),
          buttons: [
            {
              type: 'web_url',
              url: t(`${lang}:consent.URL`),
              title: t(`${lang}:consent.title`),
            },
          ],
        },
      },
    },
  );

  convo.addQuestion(
    generateYesNoButtonTemplate(t(`${lang}:consent.proceed`), [
      'yes_proceed',
      'no_proceed',
    ]),
    [
      {
        pattern: utterances.yes,
        callback: (res, conv) => {
          conv.setVar('consent', 'accept');
          conv.gotoThread('accept');
          conv.next();
        },
      },
      {
        pattern: utterances.no,
        callback: goto('reject'),
      },
      {
        default: true,
        callback: (res, conv) => {
          conv.say(t(`${lang}:utils.pressYN`));
          conv.repeat();
          conv.next();
        },
      },
    ]
  );

  convo.addMessage(t(`${lang}:consent.accept`), 'accept');
  convo.addMessage(t(`${lang}:consent.reject`), 'reject');

  convo.on('end', async (conversation) => {
    if (conversation.vars.consent) {
      const submissionUUID = uuidV4();
      transactConsentApproval(message, profile, convo, referringSurveyUUID, submissionUUID, maxRetries);
    }
  });
}

async function transactConsentApproval(message, profile, convo, referringSurveyUUID, submissionUUID, retries) {
  if (retries) {
    try {
      const contact = await createContact(message.user);
      if (contact) {
        try {
          const country = localeUtils.lookupCountry(profile)
                ? localeUtils.lookupCountry(profile)
                : profile.locale;
          retries = 0;
          services.genAndPostSubmissionToOna(convo, {
            name: contact.name,
            idString: config.onaFormIds.referrer,
            country,
            referrer: referringSurveyUUID,
            uuid: submissionUUID,
          });
        } catch (e) {
          throw Error('Failed to submit to ONA in consent ' + e);
        }
      } else {
        throw Error('Failed to createContact in consent');
      }
    } catch (e) {
      transactConsentApproval(message, profile, convo, referringSurveyUUID, submissionUUID, retries -= 1);
    }
  } else {
    try {
      transactConsentApproval(message, profile, convo, referringSurveyUUID, submissionUUID, 0);
    } catch(e) {
      logger.logRejectedPromise(`Failed to create user ${message.user} ` + e);
    }
  }
}

module.exports = consent;
