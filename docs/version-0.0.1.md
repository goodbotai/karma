# Version 0.0.1

1.  [User interaction](#org7f06b27)
    1.  [Consent](#orge10428d)
    2.  [Sharing](#org55c34a7)
    3.  [Restarts](#org4b0edf4)
    4.  [Help](#org1b1fe7b)
    5.  [Language change](#org96b8349)
    6.  [Stop daily messaging](#org65072b3)
2.  [Terms](#org802b1d7)
3.  [Schedules](#org7aac279)



<a id="org7f06b27"></a>

## User interaction

Consent is at the core of all interactions.


<a id="orge10428d"></a>

### Consent

Does not create a user unless they click yes on consent.

Is consented?

-   **true :** Give them a message telling them they'll be contacted later
-   **false:** say goodbye


<a id="org55c34a7"></a>

### Sharing

Sharing leads to a conversation with BEATs.
Does a conversation exist?

-   Shows get started. Accepts to get started?
    -   **true :** show consent
    -   **false:** removes conversation with BEATs in messenger
-   is consented?
    -   **true :** starts second survey
    -   **false:** show consent page


<a id="org4b0edf4"></a>

### Restarts

-   When in a survey
    -   restart that survey

-   When **outside** a survey 
    -   is consented?
        -   **true :** start second survey
        -   **false:** show consent and message them later


<a id="org1b1fe7b"></a>

### Help

-   When in a survey
    -   **Reject** because we expect answers

-   When **outside** a survey
    -   Show help text

-   Help text prompt
    -   **no:** show thank you message
    -   **yes:** is consented?  
        - **true :** start second survey
        - **false:** show consent


<a id="org96b8349"></a>

### Language change

Is consented?

-   **true :** show the consent conversation in the language of their choosing
-   **false:** change language and restart the current survey in the language of their choosing


<a id="org65072b3"></a>

### Stop daily messaging

Move user to an unsubscribe group
> Should we have a delete?


<a id="org802b1d7"></a>

## Terms

-   **creating a user:** creating a contact in RapidPro
-   **user:** contact in RapidPro
-   **consent:** also informed consent. A conversation that presents the terms and a chance to opt out/in.
-   **survey:** a series of questions about **well-being**. There are 2 surveys.
-   **help message:** says what BEATs is and asks the user if they want to take a survey. Shown whenever we encounter something unexpected.
-   **trigger message:** a message after a trigger that **prompts** a user to take a survey.
-   **trigger:** an action that prompts the user to take a **survey**


<a id="org7aac279"></a>

## Schedules

To be done manually
