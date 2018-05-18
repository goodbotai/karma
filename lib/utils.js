const fs = require('fs');
const winston = require('winston');

const {
  config,
  services,
  translate: t,
  logger,
  localeUtils,
  facebook,
  facebookUtils: {generateButtonTemplate},
} = require('borq');

const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

/**
 * Create an object for the withWhom section
 * repeat groups are an ODK server's way of handling questions in a loop
 * @param {object} conversation the current conversation
 * @return {object} whom someone is with
 */
function repeatAnyoneObject(conversation) {
  let withWhom;
  let withWhomRelationship;

  try {
    withWhom = conversation.responses.with_whom_name.text;
  } catch (TypeError) {
    withWhom = null;
  }

  try {
    withWhomRelationship = conversation.responses.with_whom_relationship.text;
  } catch (TypeError) {
    withWhomRelationship = null;
  }

  return {
    with_whom_name: withWhom,
    with_whom_relationship: withWhomRelationship,
  };
}

/**
 * Create an object for speaking with somone about their social concern
 * repeat groups are an ODK server's way of handling questions in a loop
 * @param {object} conversation the current conversation's object
 * @return {object} who someone spoke with about social concern
 */
function repeatObject(conversation) {
  const responses = conversation.responses;
  let spokeTo;
  let relationship;
  let what;
  let changeScale;
  let change;

  try {
    spokeTo = responses.social_concern_spoke_to_relationship.text;
  } catch (TypeError) {
    spokeTo = null;
  }

  try {
    relationship = responses.social_concern_confidant_name.text;
  } catch (TypeError) {
    relationship = null;
  }

  try {
    changeScale = conversation.responses.social_concern_change_scale.text;
  } catch (TypeError) {
    changeScale = null;
  }

  try {
    what = conversation.responses.social_concern_change_what.text;
  } catch (TypeError) {
    what = null;
  }
  try {
    change = conversation.responses.social_concern_change_better_worse.text;
  } catch (TypeError) {
    change = null;
  }

  return {
    social_concern_spoke_to_relationship: spokeTo,
    social_concern_confidant_name: relationship,
    social_concern_change: change,
    social_concern_change_scale: changeScale,
    social_concern_change_what: what,
  };
}

/**
 * Check if there is any element in array X that is in Y.
 * Is there an intersection between the two?
 * @param {array} X - intersector
 * @param {array} Y - intersectee
 * @return {bool} whether there's an intersection between X and Y
 */
function isAnyOfXinY(X, Y) {
  const f = Y.map((x) =>
    x
      .toLowerCase()
      .split('/')
      .join()
  );
  const g = X.toLowerCase().split('/');
  return f.some((l) => g.includes(l));
}

/**
 * Sets initial conversation state for repeats and button templates based on language.
 * @param {string} lang - The language in the ISO6392 standard
 * @param {object} convo - The active conversation object
 * @return {object}
 */
function initConversation(lang, convo) {
  const relationships = Object.keys(enTranslation.relationships).map(
    (relationship) => {
      return t(`${lang}:relationships.${relationship}`);
    }
  );
  const emotions = Object.keys(enTranslation.emotions);
  const nums10 = Array.from({length: 10}, (_, i) => i + 1);
  const nums5 = Array.from({length: 5}, (_, i) => i + 1);
  convo.responses.repeat = {
    spoken: [],
    with_whom: [],
  };

  const flattenedRelationships = relationships
    .map((v) => v.split('/'))
    .reduce((acc, cur) => acc.concat(cur), []);

  /**
   * A helper function to DRY creating yes and no button templates
   * @param {string} text The question text
   * @param {string} yesPayload the payload for yes
   * @param {string} noPayload the payload for no
   * @return {object} returns a JS object that is sent to FB to create a button
   */
  function generateYesNoButtonTemplate(text, [yesPayload, noPayload]) {
    return generateButtonTemplate(text, null, [
      {
        title: t(`${lang}:utils.yes`),
        payload: yesPayload,
      },
      {
        title: t(`${lang}:utils.no`),
        payload: noPayload,
      },
    ]);
  }
  return {
    relationships,
    flattenedRelationships,
    emotions,
    nums5,
    nums10,
    generateYesNoButtonTemplate,
  };
}

/**
 * Handles the conversation object after finishing a conversation
 * or in the event of an unexpected end to a conversation.
 * @param {object} convo the conversation object
 * @param {object} profile profile of the RapidPro contact
 * @param {string} lang ISO6391 language code
 * @param {string} submissionUUID UUID of the current Ona submission
 * @param {string} title - Thank you message
 */
function shareButton(convo, {name}, lang, submissionUUID, title) {
  convo.addMessage(
    {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title,
              subtitle: t(`${lang}:utils.shareWith`),
              buttons: [
                {
                  type: 'element_share',
                  share_contents: {
                    attachment: {
                      type: 'template',
                      payload: {
                        template_type: 'generic',
                        elements: [
                          {
                            title: t(`${lang}:utils.shareTitle`),
                            subtitle: t(`${lang}:utils.shareSubTitle`, {
                              name,
                            }),
                            buttons: [
                              {
                                type: 'web_url',
                                url: `http://m.me/BEATSglobal?ref=${submissionUUID}`,
                                title: t(`${lang}:utils.start`),
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    },
    'graceful ending'
  );
}

/**
 * What to do when a conversation ends
 * @param {object} bot - conversation bot
 * @param {object} message conversation message object
 * @param {object} convo the conversation object
 * @param {string} name name of RapidPro contact
 * @param {string} language user's language as a ISO6392 language code
 * @param {integer} timezone user timezone
 * @param {string} locale user locale
 * @param {string} submissionUUID UUID of the current Ona submission
 * @param {string} referringSurveyUUID UUID of the survey that lead the user to the bot
 * @param {string} idString ID of the ONA form to make a submission to
 */
function conversationEndActions(
  bot,
  message,
  convo,
  name,
  language,
  timezone,
  locale,
  submissionUUID,
  referringSurveyUUID,
  idString
) {
  const country = localeUtils.lookupCountry({timezone, locale})
    ? localeUtils.lookupCountry({timezone, locale})
    : locale;

  convo.on('end', (conversation) => {
    logger.log('info', {
      message: 'Conversation ended.',
      name,
      PSID: message.user,
      conversationStatus: conversation.status,
    });
    switch (conversation.status) {
      case 'completed':
        services.genAndPostSubmissionToOna(convo, {
          name,
          idString,
          country,
          referrer: referringSurveyUUID,
          uuid: submissionUUID,
        });
        break;

      case 'timeout':
        services.genAndPostSubmissionToOna(convo, {
          name,
          idString,
          country,
          referrer: referringSurveyUUID,
          uuid: submissionUUID,
        });

        bot.say({
          text: t(`${language}:utils.timeoutMessage`),
          channel: conversation.context.user,
        });
        break;

      case 'interrupted': // handled in individual conversations
        break;

      default:
        winston.log(
          'error',
          `Unhandled coversation end. Status ${conversation.status}`
        );
    }
  });
}

/**
 * Validate answers from quick replies from Facebook Messenger
 * @param {function} predicate - predicate callback function
 * @param {function} cb - callback function for the next thread/conversation
 * @param {string} opts - acceptable answers separated by commas
 * @param {string} lang - ISO6391 standard of the language in use
 * @return {cb} - callback for a conversation
 */
function validateAnswer(predicate, cb, opts, lang) {
  let hint;
  if (opts.length < 1 || opts == undefined) {
    hint = t(`${lang}:utils.rereadAndAnswer`);
  } else {
    const options = opts.join(',\n');
    hint = t(`${lang}:utils.tapAnswer`, {options});
  }
  return (res, conv) => {
    if (predicate(res.text)) {
      cb(res, conv);
    } else {
      conv.say(hint);
      conv.repeat();
      conv.next();
    }
  };
}

async function getContact(user) {
  const {body: {results: [rapidProContact]}} = await services.getUser({urn: `facebook:${user}`});
  return rapidProContact;
}

async function updateContact(user, language) {
  let res;
  try {
     res = await services.updateUser({urn: `facebook:${user}`}, {language});
  } catch (e) {
    // TODO: log this
  }
  return res.body;
}

function logConversationStart(message, rapidProContact) {
  logger.log('info', {
    message: 'Conversation started.',
    name: rapidProContact.name,
    PSID: message.user,
    conversation: 'Consent',
  });
}

async function createContact(user) {
  try {
    const profile = await facebook.getFacebookProfile(user);
    const {
      first_name: firstName,
      last_name: lastName,
      profile_pic: profilePic,
      locale,
      timezone,
      gender,
      is_payment_enabled: isPaymentEnabled,
    } = profile;
    const registrationDate = new Date();
    const region = localeUtils.regionByTimeZone(timezone);
    const {body: rapidProContact} = await services.createUser(
      `${firstName} ${lastName}`,
      localeUtils.pickLanguage(profile),
      [`facebook:${user}`],
      [config.rapidproGroups[region]],
      {
        registration_date: registrationDate,
        profile_pic: profilePic,
        locale,
        timezone,
        gender,
        is_payment_enabled: isPaymentEnabled,
      }
    );
    return rapidProContact;
  } catch (e) {
    // TODO: log this
    try { // maybe user already exists
      const contact = await getContact(user);
      return contact;
    } catch (e) {
      throw Error ('Failed to create contact');
    }
  }
}

function getRef(message) {
  let ref;
  try {
    ref = message.referral.ref;
  } catch (e) {
    ref = null;
  } // do nothing if no ref
  return ref;
}

module.exports = {
  validateAnswer,
  isAnyOfXinY,
  initConversation,
  shareButton,
  repeatAnyoneObject,
  conversationEndActions,
  repeatObject,
  getContact,
  getRef,
  updateContact,
  createContact,
  logConversationStart,
};
