const raven = require('raven');
const winston = require('winston');
const fetch = require('node-fetch');
const uuidV4 = require('uuid/v4');

const Aggregate = require('./Aggregate.js');
const Config = require('../config/Config.js');

function setupSentry(sentryDSN, environment, loggingLevel) {
  raven.config(sentryDSN, {
    logger: loggingLevel,
    environment,
  }).install();

  if (Config.environment === 'production') {
    return raven;
  }
  return null;
}

const sentry = setupSentry(Config.sentryDSN, Config.environment, 'error');

function extractJsonFromResponse(response) {
  return response.json();
}

function getFacebookProfile(fbMessengerId) {
  const path = `https://graph.facebook.com/${Config.facebookApiVersion}/${fbMessengerId}` +
          '?fields=first_name,last_name,profile_pic,locale,timezone,gender' +
          ',is_payment_enabled,last_ad_referral' +
          `&access_token=${Config.facebookPageAccessToken}`;
  return fetch(path).then(extractJsonFromResponse);
}

function init(conversation) {
  const orgName = 'karma';
  const rapidproURL = 'https://rapidpro.ona.io/api/v2/contacts.json';
  const onaSubmissionEndpointURL = `https://api.ona.io/${orgName}/submission`;
  const convo = Aggregate(conversation);
  const messengerId = convo.userId;

  function postContactToRapidpro(payload) {
    const jsonPayload = JSON.stringify(payload);
    fetch(`${rapidproURL}?urn=facebook:${messengerId}`,
      { method: 'POST',
        body: jsonPayload,
        headers: {
          Authorization: `Token ${Config.rapidproApiToken}`,
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        if (response.status < 300) {
          // should we add these to access logs?
          winston.log('info', `${response.status} ${jsonPayload}`);
        } else {
          extractJsonFromResponse(response).then((jsonResponse) => {
            const jsonResponseString = JSON.stringify(jsonResponse);
            winston.log('error',
                        `{Status: ${response.status}}` +
                        ` {Payload: ${jsonPayload}}` +
                        ` {Response ${jsonResponseString}}`);
            if (Config.environment === 'production') {
              sentry.captureMessage('RapidPro contact update failed\n' +
                                    `{Status: ${response.status}}\n` +
                                    `{Payload: ${jsonPayload}}\n` +
                                    `{Response: ${jsonResponseString}}`);
            }
          });
        }
      });
  }

  function genRapidproContact({ first_name: firstName,
                                last_name: lastName,
                                profile_pic,
                                locale,
                                timezone,
                                gender,
                                is_payment_enabled }, groups) {
    const contact = {
      name: `${firstName} ${lastName}`,
      groups,
      fields: {
        messenger_id: messengerId,
        profile_pic,
        locale,
        timezone,
        gender,
        is_payment_enabled,
      },
    };

    return contact;
  }

  function genAndPostRapidproContact(groups) {
    getFacebookProfile(messengerId)
      .then((facebookProfile) => {
        const contact = genRapidproContact(facebookProfile, groups);
        postContactToRapidpro(contact);
      });
  }

  function postSubmissionToOna(payload) {
    const jsonPayload = JSON.stringify(payload);
    fetch(onaSubmissionEndpointURL,
      {
        method: 'POST',
        body: jsonPayload,
        headers: {
          Authorization: `Token ${Config.onadataApiToken}`,
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        if (response.status < 300) {
          winston.log('info', `{Status: ${response.status}} {Data ${jsonPayload}}`);
        } else {
          extractJsonFromResponse(response).then((jsonResponse) => {
            const jsonResponseString = JSON.stringify(jsonResponse);
            winston.log('error',
                        `{Status: ${response.status}}` +
                        ` {Payload: ${jsonPayload}}` +
                        ` {Response ${jsonResponseString}}`);
            if (Config.environment === 'production') {
              sentry.captureMessage('Ona submission failed\n' +
                                    `{Status: ${response.status}}\n` +
                                    `{Payload: ${jsonPayload}}\n` +
                                    `{Response ${jsonResponseString}}`);
            }
          });
        }
      });
  }

  function genOnaSubmission() {
    const submission = {};
    const uuid = uuidV4();
    submission.id = 'karma';
    const responses = conversation.responses;
    const names = Object.keys(responses);

    const subb = names.map((name) => {
      const kv = {};
      if (name === 'repeat') {
        kv.spoken = responses.repeat.spoken;
        kv.with_whom = responses.repeat.with_whom;
        return kv;
      }
      kv[name] = responses[name].text;
      return kv;
    });

    const sub = subb.reduce((x = {}, kv) => Object.assign(x, kv));
    submission.submission = sub;
    submission.submission.meta = { instanceID: `uuid:${uuid}` };
    return submission;
  }

  function genAndPostSubmissionToOna() {
    const submission = genOnaSubmission();
    getFacebookProfile(Config.facebookApiVersion, messengerId, Config.facebookPageAccessToken)
      .then(({ first_name: firstName, last_name: lastName }) => {
        submission.submission.first_name = firstName;
        submission.submission.last_name = lastName;
        submission.submission.messengerId = messengerId;
        postSubmissionToOna(submission);
      });
  }

  return {
    genOnaSubmission,
    genAndPostSubmissionToOna,
    genAndPostRapidproContact,
    getFacebookProfile,
    messengerId,
  };
}

module.exports = { init, getFacebookProfile, sentry };
