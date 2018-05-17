# Version 0.0.1

1.  [User interaction](#orgeb44274)
    1.  [Consent](#org1c6339e)
    2.  [Sharing](#org180bd2c)
    3.  [Restarts](#org2a2db36)
    4.  [Help](#orgd570036)
    5.  [Language change](#org2e57697)
    6.  [Stop daily messaging](#orgdde6c10)
2.  [Terms](#orgc776027)
3.  [Surveys](#org3f44bae)
4.  [Schedules](#org2c93128)



<a id="orgeb44274"></a>

# User interaction

Consent is at the core of all interactions.


<a id="org1c6339e"></a>

## Consent

Does not create a user unless they click yes on consent.

Is consented?

-   **true :** Create a user and them they'll be contacted later
-   **false:** say goodbye

> TODO: Where to save referring survey UUID?


<a id="org180bd2c"></a>

## Sharing

Sharing leads to a conversation with BEATs.
Does a conversation exist?

-   Shows get started. Accepts to get started?
    -   **true :** show consent
    -   **false:** removes conversation with BEATs in messenger
-   is consented?
    -   **true :** starts second survey
    -   **false:** show consent page


<a id="org2a2db36"></a>

## Restarts

-   When in a survey
    -   restart that survey

-   When **outside** a survey 
    -   is consented?
        -   **true :** start second survey
        -   **false:** show consent and message them later


<a id="orgd570036"></a>

## Help

-   When in a survey
    -   **Reject** because we expect answers

-   When **outside** a survey
    -   Show help text

-   Help text prompt
    -   **no:** show thank you message
    -   **yes:** -   is consented?
            -   **true :** start second survey
            -   **false:** show consent


<a id="org2e57697"></a>

## Language change

Is consented?

-   **true :** show the consent conversation in the language of their choosing
-   **false:** change language and restart the current survey in the language of their choosing


<a id="orgdde6c10"></a>

## Stop daily messaging

Move user to an unsubscribe group
> Should we have a delete?


<a id="orgc776027"></a>

# Terms

-   **creating a user:** creating a contact in RapidPro
-   **user:** contact in RapidPro
-   **consent:** also informed consent. A conversation that presents the terms and a chance to opt out/in.
-   **survey:** a series of questions about **well-being**. There are 2 surveys.
-   **help message:** says what BEATs is and asks the user if they want to take a survey. Shown whenever we encounter something unexpected.
-   **trigger message:** a message after a trigger that **prompts** a user to take a survey.
-   **trigger:** an action that prompts the user to take a **survey**


<a id="org3f44bae"></a>

# Surveys

There are two surveys:

1.  Survey 1
2.  Survey 2

To get to a survey you need to go through

1.  A trigger
2.  A restart
3.  Help message


<a id="org2c93128"></a>

# Schedules

To be done manually

