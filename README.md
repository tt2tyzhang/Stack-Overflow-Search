## Inspiration
I remember when I first started developing (and right now as well), a large part was spent on trying to resolve various errors in the code, along with a lot of information not learned in school or books. StackOverflow is an excellent resource in doing that. Although just relying on StackOverflow without thoroughly understanding what's happening may lead to problems, I believe for newer developers it is an (near-)essential resource to save frustration and keep their interest invested. So, I desired to build a tool to make it easier for newer developers to aggregate search queries / questions.

## What it does
A command is added such that, after running the code, any errors that occur are parsed / cleaned into relevant search keywords. These search criterion will then be used to query the StackExchange API, which then displays all questions (not only one question and answer) that are relevant on a compact and interactive interface.

## How I built it
The extension command when run will:
-Grab error messages from the terminal, while detecting programming language (vs Diagnostics, more on this later)
-Runs a regular expression to pattern match (and ensures only the latest compilation is considered)
-Extracts the matching patterns from the regex and filters out some characters / patterns which make the search hard to find data (i.e. code from the standard library's source, especially with templating)
-Separates them (space or special character delimited) into an array of strings
-Takes the first k strings and concatenates them as search terms. Experimenting on k but later on thinking to have an algorithm for it
-Queries StackExchange REST API, and retrieves all questions and answers
-Constructs an interactive webview with the dynamic response data through generation of static HTML and inlined javascript

## Challenges I ran into
Retrieving error messages:
Initially thought to read the terminal output / or listen to it, but that provided to be difficult. Also considered using Diagnostics (would be best in hindsight). Reason it was implemented through reading the terminal output was for flexibility for detecting custom error patterns, possibly even some non-compile time ones. Only later on realized the difficulties and issues that would occur with it. For retrieving the terminal output, unfortunately the proper API call (onDidWriteTerminalData) is only a Proposed API so will be only compatible with Insider only. Current workaround is utilizing a temporary clipboard.

Search query:
There were a lot of uncommon search / question terms / characters which resulted in poor search quality. In the end decided to filter them out, along with splitting the search queries and only taking the first k words. More words = more accuracy but less or no results, less words = lots of results but low accuracy. For now it's hardcoded, but believe if have more time can develop an algorithm to find the optimal return point (along with taking throttling API calls into account)

Fetching from the StackExchange API:
Initially, I was thinking of just using web crawling to grab all the HTML then loading it in a WebView. However, this will fetch much more than necessary and isn't the proper way to do it, and will encounter various Captcha issues as well. Another consideration for this challenge was using an iframe workaround. However, it isn't very reliable and may encounter compatibility issues. Thus, I decided to learn Stack Exchange's REST API and make full use of it.

UI:
There were issues creating an interactive WebView with dynamic data. There are many excellent and clean ways to do it, but in the end due to limited time, made a hacky pseudo-javascript generator, and just passed the html with the generated inline javascript to the webview.

## Accomplishments that I'm proud of
Learning about the various API calls
Functioning product
Got a working minimum viable product out before the deadline

## What I learned
StackExchange API
VSCode API
TypeScript basics

## What's next for Stack-Overflow-Search
What I consider in order of priority:
-If more people are interested, cleaning up / modularizing the code. Maybe try generating a react app for the webview
-Consider using Diagnostics instead
-More accurate search. Need to define an algorithm / metric for search accuracy, was first considering binary search / multiple API calls throttled to a depth, but too many may cause slowdown. Considering multiple async calls starting at different pivot positions (see comments for TODO)
-Other engines (google search, etc) implementation
-Can consider using translation APIs (though have to research the accuracy first)