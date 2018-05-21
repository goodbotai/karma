# QA

What to test for before release.  
If numbered the sequence of events **does** matters if not numbered sequence of events does **not** matter.

## User creation
 1. Delete user in RapidPro
 1. Delete conversation on messenger
 1. Search for BEATs click get started
 1. Accept consent 
   * Was user created? User should be created

## Bot sharing
 1. user 1 take a survey and share it with a user 2
 2. user 2 should delete whatever conversation they have with BEATs currently
 3. delete user 2 from rapidpro
 4. user 2 accepts bot clicks get started and consents
 5. user 2 does a survey to the end
 6. after the survey is done check ona. 
   - Does the submission from user 2 contain the referrer survey UUID? It **should**


## Consent
 1. Delete user in RapidPro
 2. Delete conversation on messenger
 3. Click "Get Started"
   - Reject consent
    * Did it create a contact in RapidPro? It should **not**
   - Accept consent
    * Did it create a contact in RapidPro? It **should**

## User interaction
 - Restart a different points
 - Send "hi" at different points
 - Try to change language at different points
 

## Survey
 - Timed out survey (wait over 20 minutes before answering a question)
  * Did the results get sent to Ona? They should
 - Successfully ended survey.
  *  Did the results get sent to Ona? They should
