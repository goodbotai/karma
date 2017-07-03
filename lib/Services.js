const fetch = require('node-fetch');
const Aggregate = require('./Aggregate.js');

const facebookApiVersion = 'v2.6';
const facebookPageAccessToken = process.env.page_token;
const onaApiToken = process.env.ona_token;
const rapidproToken = process.env.rapidpro_token;
const uuidV4 = require('uuid/v4');

function Services(conversation) {
  const convo = Aggregate(conversation);
  const messengerId = convo.userId;
  const rapidproURL = 'https://rapidpro.ona.io/api/v2/contacts.json';
  const orgName = 'karma';
  const onaSubmissionEndpointURL = `https://api.ona.io/${orgName}/submission`;

  function extractJsonFromResponse(response) {
    return response.json();
  }

  function getFacebookProfile(apiVersion, fbMessengerId, pageAccessToken) {
    const path = `https://graph.facebook.com/${apiVersion}/${fbMessengerId}` +
          '?fields=first_name,last_name,profile_pic,locale,timezone,gender' +
          ',is_payment_enabled,last_ad_referral' +
          `&access_token=${pageAccessToken}`;
    return fetch(path).then(extractJsonFromResponse);
  }

  function postContactToRapidpro(payload) {
    fetch(`${rapidproURL}?urn=facebook:${messengerId}`,
      { method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Token ${rapidproToken}`,
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        if (response.status < 300) {
          console.log('Successfully added contact.');
          console.log(response.status);
        } else {
          console.log('Failed to add a contact.');
          console.log(response.status);
          console.log(response.statusText);
          extractJsonFromResponse(response).then((jsonResponse) => {
            console.log(jsonResponse);
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
                                is_payment_enabled }) {
    const contact = {
      name: `${firstName} ${lastName}`,
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

  function genAndPostRapidproContact() {
    getFacebookProfile(facebookApiVersion, messengerId, facebookPageAccessToken)
      .then((facebookProfile) => {
        const contact = genRapidproContact(facebookProfile);
        postContactToRapidpro(contact);
      });
  }

  function postSubmissionToOna(payload) {
    fetch(onaSubmissionEndpointURL,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Token ${onaApiToken}`,
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        if (response.status < 300) {
          console.log('Successfully made a submission.');
          console.log(response.status);
        } else {
          console.log('Failed to make the submission.');
          console.log(response.status);
          console.log(response.statusText);
          extractJsonFromResponse(response).then((jsonResponse) => {
            console.log(jsonResponse);
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
      if (name === 'repeat') {
        const answer = responses[name].spoken;
        const kv = {};
        kv.spoken = answer;
        return kv;
      }
      const answer = responses[name].text;
      const kv = {};
      kv[name] = answer;
      return kv;
    });
    const sub = subb.reduce((x = {}, kv) => Object.assign(x, kv));
    submission.submission = sub;
    submission.submission.meta = { instanceID: `uuid:${uuid}` };
    return submission;
  }

  function genAndPostSubmissionToOna() {
    const submission = genOnaSubmission();
    getFacebookProfile(facebookApiVersion, messengerId, facebookPageAccessToken)
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

module.exports = Services;
