# Table of Contents

1.  [User interaction](#org4762af5)
    1.  [Consent](#org674eedc)
    2.  [Restarts](#orgf24101b)
    3.  [Help](#orgd9f4e78)
    4.  [Language change](#orgd2526a0)
2.  [Terms](#orga2cc7dd)
3.  [Schedules](#orgfadd6f3)



<a id="org4762af5"></a>

# User interaction

Consent is at the core of all interactions.


<a id="org674eedc"></a>

## Consent

Does not create a user unless they click yes on consent.

Is consented?

-   **true :** Give them a message telling them they'll be contacted later
-   **false:** say goodbye


<a id="orgf24101b"></a>

## Restarts

-   When in a survey
    -   restart that survey

-   When **outside** a survey 
    -   is consented?
        -   **true :** start second survey
        -   **false:** show consent and message them later


<a id="orgd9f4e78"></a>

## Help

-   When in a survey
    -   **Reject** because we expect answers

-   When **outside** a survey
    -   Show help text

1.  What does help text do?

    -   is consented?
        -   **true :** start second survey
        -   **false:** show consent


<a id="orgd2526a0"></a>

## Language change

Is consented?

-   **true :** show the consent conversation in the language of their choosing
-   **false:** change language and restart the current survey in the language of their choosing


<a id="orga2cc7dd"></a>

# Terms

-   **creating a user:** creating a contact in RapidPro
-   **user:** contact in RapidPro
-   **consent:** also informed consent. A conversation that presents the terms and a chance to opt out/in.
-   **survey:** a series of questions about **well-being**. There are 2 surveys.
-   **help message:** says what BEATs is and asks the user if they want to take a survey. Shown whenever we encounter something unexpected.
-   **trigger message:** a message after a trigger that **prompts** a user to take a survey.
-   **trigger:** an action that prompts the user to take a **survey**


<a id="orgfadd6f3"></a>

# Schedules

To be done manually

