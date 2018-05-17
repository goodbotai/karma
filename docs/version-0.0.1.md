
# Version 0.0.1

1.  [User interaction](#org14b0929)
    1.  [Consent](#org6c95a14)
    2.  [Sharing](#orgd5d5dce)
    3.  [Restarts](#org73d84c5)
    4.  [Help](#org8dd870d)
    5.  [Language change](#org74d0be7)
    6.  [Stop daily messaging](#org89b057a)
2.  [Terms](#org0cf46f2)
3.  [Schedules](#org4c9e324)



<a id="org14b0929"></a>

# User interaction

Consent is at the core of all interactions.


<a id="org6c95a14"></a>

## Consent

Does not create a user unless they click yes on consent.

Is consented?

-   **true :** Give them a message telling them they'll be contacted later
-   **false:** say goodbye


<a id="orgd5d5dce"></a>

## Sharing

Sharing leads to a conversation with BEATs.
Does a conversation exist?

-   Shows get started. Accepts to get started?
    -   **true :** show consent
    -   **false:** removes conversation with BEATs in messenger
-   is consented?
    -   **true :** starts second survey
    -   **false:** show consent page


<a id="org73d84c5"></a>

## Restarts

-   When in a survey
    -   restart that survey

-   When **outside** a survey 
    -   is consented?
        -   **true :** start second survey
        -   **false:** show consent and message them later


<a id="org8dd870d"></a>

## Help

-   When in a survey
    -   **Reject** because we expect answers

-   When **outside** a survey
    -   Show help text

1.  What does help text do?

    -   is consented?
        -   **true :** start second survey
        -   **false:** show consent


<a id="org74d0be7"></a>

## Language change

Is consented?

-   **true :** show the consent conversation in the language of their choosing
-   **false:** change language and restart the current survey in the language of their choosing


<a id="org89b057a"></a>

## Stop daily messaging

Move user to an unsubscribe group
> Should we have a delete?


<a id="org0cf46f2"></a>

# Terms

-   **creating a user:** creating a contact in RapidPro
-   **user:** contact in RapidPro
-   **consent:** also informed consent. A conversation that presents the terms and a chance to opt out/in.
-   **survey:** a series of questions about **well-being**. There are 2 surveys.
-   **help message:** says what BEATs is and asks the user if they want to take a survey. Shown whenever we encounter something unexpected.
-   **trigger message:** a message after a trigger that **prompts** a user to take a survey.
-   **trigger:** an action that prompts the user to take a **survey**


<a id="org4c9e324"></a>

# Schedules

To be done manually

