## Commits and Pull Requests

### Commit Standards

First, the 7 rules of [writing](http://chris.beams.io/posts/git-commit/) [great](https://github.com/erlang/otp/wiki/Writing-good-commit-messages) [commit](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) [messages](https://github.com/torvalds/linux/pull/17#issuecomment-5659933):

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

### Pull Requests (PRs)

Atomic commits and pull requests are advised meaning have do one thing per
commit and solve a single larger goal per pull request.
This is at the developer's discretion.
Just try not to do too much in one commit or pull request.

Everyone should open pull requests early and aggresively to get others looking
at your work and get feedback. This leads to two types of pull requests:

1. Pull requests that can be merged
2. Pull requests that can not (and should not) be merged

For both types, the title should succinctly describe the issue it is closing and
the solution chosen.
If it is the second type, and can not be merged, the title of the pull request
needs to have a "do not merge" (DNM) prefix, written as `[DO NOT MERGE]` or
`[DNM]`, for example: `[DO NOT MERGE] 1154 browser support for ie10 plus`.

For either type, the description should:

* reference any issues the PR is closing, or is going to close when finished
* describe the solution to the issue and why this was chosen
* mention any idiosyncrasies or trade-offs of this solution

## Navigativing Issues and Milestones

### Prioritization
Prioritization is determined by two factors:

1. Milestone: issues in more current [milestones](https://github.com/onaio/karma/milestones) have higher priority
2. The [`High Priority`](https://github.com/onaio/karma/labels/High%20Priority) label: issues with this label have higher priority than other issues without this label in the same milestone

NB: There is a third factor that affects prioritization: specific directions
communicated by a [Project Manager](https://onaio.slack.com/messages/karma/).
This communication should be immediately translated into assigning a milestone
and appropriate labels.

### Creating Issues
The [issues](https://github.com/onaio/karma/issues) list tracks all the
outstanding tasks.

* All discussion about an issue should take place (or be transferred to) comments in the issue
* Details, plans, and questions on implementation should be put in comments

#### Checklist for creating great issues

The better defined, more detailed, and clearer your issue is the faster we can
provide feedback and close it.

* [ ] The title should be a brief summary describing the problem or feature and including *what*, *where*
  * e.g. for an error: "Number of records for filtered data view on project page is incorrect"
  * e.g. for a feature: "Can the import csv functionality be designed such that it notifies one on errors in the csv file"
* The description should provide details on exactly what must be done to close the issue
  * [ ] Add [labels](https://github.com/onaio/karma/labels)! These describe what part of the site this issue relates to. If you are not sure whether a label is appropriate, add it and we'll sort it later.
  * [ ] For features, start with a story based description using this template: "As a _____ I want to ____." This describes who this is being built for and what the change is accomplish for that user. For errors, rehash the *what* and *where*, if known add *why* and *how*
  * [ ] Add what steps can be taken to reproduce the problem (for an error) or describe what is to be added or changed (for a feature)
    * Include screenshots with notes, URLs, references for credentials, and bullet pointed steps linking everything together
  * [ ] Add more notes:
    * What must happen to close the issue?
    * Was this working in the past, was there anything related that you've noticed change?
    * Is this linked to any other issues, either features or errors?
    * Detail a list of possible approaches to resolve it

#### Sizing Issues
All issues should have a size label of [`Small (≤1)`](https://github.com/onaio/karma/labels/SIZE%20-%20Small%20%28%E2%89%A41%29), [`Medium (2-3)`](https://github.com/onaio/karma/labels/SIZE%20-%20Medium%20%282-3%29), or [`Large (4-5)`](https://github.com/onaio/karma/labels/SIZE%20-%20Large%20%284-5%29)
  * If you think an issues is the wrong size, change the label and make a comment
  * If the issue is taking longer than the size the label says, change the label and make a comment
  * If you need help sizing an issue, [ask](https://onaio.slack.com/messages/karma/) someone

#### Blockers
If an issues depends on a another open issue, feedback from a stakeholder, or discussion with the tech team it is blocked.
* Add the [`Blocked`](https://github.com/onaio/karma/labels/Blocked) label and make a comment
  * If it is blocked by another issues reference that issue in your comment
* If all blockers are removed, e.g. you close an issue that was a blocking another issue, remove the [`Blocked`](https://github.com/onaio/karma/labels/Blocked) label and make a comment

#### Errors and Deploy Blockers
* Reports of and found errors ([bugs are errors](https://www.cs.utexas.edu/~EWD/transcriptions/EWD10xx/EWD1036.html)) should get the [`Error`](https://github.com/onaio/karma/labels/Error) label.
* Critical errors and any regressions (things that used to work but are now broken) need to be fixed before a deploy, these get the [`Blocks Deploy`](https://github.com/onaio/karma/labels/Blocks%20Deploy) label.

#### `PAID - *` Issues
Some issues are specifically requested by clients, whom requested what is track with the `PAID - *` labels, e.g. [`PAID - Transtec`](https://github.com/onaio/karma/labels/PAID%20-%20Transtec).

### Milestones and Releases
Milestones are numeric and the "current" milestone (the one being worked on) has the lowest number, e.g. if you see milestones `0.45`, `0.44`, and `0.43`, `0.43` is the current milestone.

* Milestones start on Tuesday and end Monday (after the weekend), this is the milestone's week.
* The current milestone contains work expected to be completed in the current week.
* Later milestones prioritize upcoming work, but it is work that may take longer than a week.

#### When to change an issue's milestone
* If you run out of work in the current milestone pull up an issue from the next milestone, based upon [prioritization](https://github.com/onaio/karma/wiki/How-tasks-are-organized-and-prioritized#prioritization), and make a comment
* If you realize you cannot complete your assigned issues in the current milestone bump an issue down, based upon [prioritization](https://github.com/onaio/karma/wiki/How-tasks-are-organized-and-prioritized#prioritization), and make a comment
* If you think there is an error in the prioritization, e.g. dependencies/blockers, production errors, user request, make a comment and talk to a [Project Manager](https://onaio.slack.com/messages/karma/)

## References
* [Expectations as a Distributed Team](https://github.com/onaio/ona/blob/master/tech/readme.md#expectations-as-a-distributed-team)
* [Commit and Pull Request](https://github.com/onaio/ona/blob/master/tech/readme.md#commits-and-pull-requests) guidlines
* [Navigating and Creating Issues](https://github.com/onaio/ona/blob/master/tech/readme.md#navigativing-issues-and-milestones)
