const fetch = require('node-fetch');
const Aggregate = require('./Aggregate.js');
const facebook_api_version = "v2.6";
const fb_access_token= process.env.page_token;
const ona_api_token = process.env.ona_token;
const rapidpro_token = process.env.rapidpro_token;

function Services(conversation) {
  if (conversation.status === 'completed') {

    const convo = Aggregate(conversation);
    const messenger_id = convo.user_id;
    const rapidpro_url = 'https://rapidpro.ona.io/api/v2/contacts.json';
    const ona_submission_endpoint_url = 'https://api.ona.io/api/v1/submissions';

    function extract_json_from_response(response) {
      return response.json();
    }

    function get_facebook_profile() {
      let path = 'https://graph.facebook.com/'
          + facebook_api_version + '/' + messenger_id +
          '?fields=first_name,last_name,profile_pic,locale,timezone,gender,is_payment_enabled,last_ad_referral' +
          '&access_token=' + fb_access_token;
      return fetch(path).then(extract_json_from_response);
    }

    function post_contact_to_rapidpro(payload) {
      fetch(rapidpro_url,
            {method: 'POST',
             body:   JSON.stringify(payload),
             headers: {Authorization:  "Token " + rapidpro_token,
                       "Content-Type": "application/json"}})
        .then((response) => {
          if (response.status < 300) {
            console.log("Successfully added contact.");
            console.log(response.status);
          } else {
            console.log("Failed to add a contact.");
            console.log(response.status);
            console.log(response.statusText);
            extract_json_from_response(response).then((json_response) => {
              console.log(json_response);
            });
          }
        });
    }

    function gen_rapidpro_contact({first_name,
                                   last_name,
                                   profile_pic,
                                   locale,
                                   timezone,
                                   gender,
                                   is_payment_enabled}) {
      let contact = {};
      contact.name = first_name + ' ' + last_name;
      contact.urns = ["facebook:" + messenger_id];
      contact.fields = {profile_pic: profile_pic,
                        locale: locale,
                        timezone: timezone,
                        gender: gender,
                        is_payment_enabled: is_payment_enabled
                       };
      return contact;
    }

    function gen_and_post_rapidpro_contact() {
      get_facebook_profile().then((facebook_profile) => {
        let contact = gen_rapidpro_contact(facebook_profile);
        post_contact_to_rapidpro(contact);
      });
    }

    function post_submission_to_ona(payload) {
      fetch(ona_submission_endpoint_url,
            {method:  'POST',
             body:    JSON.stringify(payload),
             headers: {Authorization:  "Token " + ona_api_token,
                       "Content-Type": "application/json"}})
        .then((response) => {
          if (response.status < 300) {
            console.log("Successfully made a submission.");
            console.log(response.status);
          } else {
            console.log("Failed to make the submission.");
            console.log(response.status);
            console.log(response.statusText);
            extract_json_from_response(response).then((json_response) => {
              console.log(json_response);
            });
          }
        });
    }

    function gen_ona_submission() {
      let submission = {};
      submission.id = "karma";
      submission.submission = {};
      return submission;
    }

    function gen_and_post_submission_to_ona() {
      let submission = gen_ona_submission();
      post_submission_to_ona(submission);
    }

    return {
      gen_and_post_rapidpro_contact: gen_and_post_rapidpro_contact,
      post_contact_to_rapidpro: post_contact_to_rapidpro,
      get_facebook_profile: get_facebook_profile,
      post_submission_to_ona: post_submission_to_ona
    };
  }
}

module.exports = Services;
