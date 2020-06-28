"use strict";

import { ExtensionContext } from "vscode";

// Terrible hacks... this is a hackathon but this is beyond the level of a hack or spaghetti code I think
// If have more time maybe try using react and of course clean and modularize the code a ton
const generateHTML = (searchResults: any) => {
    const headWebViewHTML = `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
		<title>Search Results</title>
	</head>
	<body>`;
    let bodyWebViewHTML = `<div class="btn-group-vertical" style="width:100%">`;
    for (let i = 0; i < searchResults.length; ++i) {
        let questionWebViewHTML = ``;
        const question = searchResults[i];
        questionWebViewHTML += `<button type="button" class="collapsible btn btn-primary">`;
        questionWebViewHTML += `<a class="link badge badge-secondary">` + `Copy link` + `</a>`;
        questionWebViewHTML += `<span class="badge badge-light">` + (question.score > 0 ? `+` : ``) + question.score + `</span>`;
        questionWebViewHTML += `<span class="h5"> ` + question.title + `</span>`;
        questionWebViewHTML += `</button>`;
        questionWebViewHTML += `<div class="question-container card style="width:100%"">`;
        questionWebViewHTML += `<div class="question-body">` + question.body + `</div>`;
        questionWebViewHTML += `<ul class="list-group list-group-flush">`;
        for (let answer_i = 0; answer_i < question.answers.length; ++answer_i) {
            const answer = question.answers[answer_i];
            questionWebViewHTML += `<li class="answer-body list-group-item style="width:100%"">`;
            questionWebViewHTML += `<span class="badge badge-dark">` + (answer.score > 0 ? `+` : ``) + answer.score + `</span>`;
            questionWebViewHTML += `<span class="badge badge-success">` + (answer.is_accepted ? `(A)` : ``) + `</span>`;
            questionWebViewHTML += `<span>` + answer.body + `</span>`;
            questionWebViewHTML += `</li>`;
        }
        questionWebViewHTML += `</ul>`;
        questionWebViewHTML += `</div>`;
        bodyWebViewHTML += questionWebViewHTML;
    }
    bodyWebViewHTML += `</div"><script>`;
    bodyWebViewHTML += `
	const collapsibles = document.getElementsByClassName("collapsible");
	for (const collapsible of collapsibles) {
		collapsible.nextElementSibling.style.display = "none";
		collapsible.addEventListener("click", function() {
			this.classList.toggle("active");
			const content = this.nextElementSibling;
			if (content.style.display === "block") {
				content.style.display = "none";
			} else {
				content.style.display = "block";
			}
		});
    }
    const urls = [];
    `;
    for (let i = 0; i < searchResults.length; ++i) {
        bodyWebViewHTML += `urls.push("` + encodeURI(searchResults[i].link) + `");`;
    }
    bodyWebViewHTML += `
    const links = document.getElementsByClassName("link");
    for (let i = 0; i < links.length; ++i) {
        links[i].title = urls[i];
		links[i].addEventListener("click", function() {
            links[i].innerHTML = "Copied!";
            setTimeout(() => {
                links[i].innerHTML = "Copy link";
            }, 1000);
            const temp = document.createElement("textarea");
            document.body.appendChild(temp);
            temp.textContent = urls[i];
            temp.select();
            document.execCommand("copy");
            document.body.removeChild(temp);
		});
    }
    `;
    bodyWebViewHTML += `</script>`;
    const tailWebViewHTML = `</body>
	</html>`;
    return headWebViewHTML + bodyWebViewHTML + tailWebViewHTML;
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const axios = require('axios').default;
const stackExchangeApiFilter = '!oDlfh44kUJHN*(cixdVUxCLwm9Oi20nZPfuEPDb.EKy';
const extractErrors = (text: string, lang: string) => {
	if (lang === "cpp") {
        const lastExecution: number = text.lastIndexOf("Executing task");
        text = text.substr(lastExecution);
        return text.match(/\d+:\d+: error: .*/gi);
    } else if (lang === "typescript") {
        const lastExecution: number = text.lastIndexOf("tsc");
        text = text.substr(lastExecution);
        return text.match(/:\d+:\d+ - error .*/gi);
    } else if (lang === "python") {
        const lastExecution: number = text.lastIndexOf("python.exe");
        text = text.substr(lastExecution);
        return text.match(/\n[a-zA-Z]*Error.*/gi);
    }
    return null;
};

const toStackOverflowTag = (lang: string) => {
	if (lang === 'cpp') {
		return 'c++';
	} else if (lang === "typescript") {
        return lang;
    } else if (lang === "python") {
        return lang;
    }
	return '';
};

const cleanErrorString = (orig: string) => {
    const words = [];
    let curIdx = orig.indexOf('error');
    let curWord = "";
    while (curIdx < orig.length) {
        if ((orig[curIdx] >= 'a' && orig[curIdx] <= 'z') || (orig[curIdx] >= 'A' && orig[curIdx] <= 'Z') || orig[curIdx] === '_' || orig[curIdx] === ';') {
            curWord += orig[curIdx];
        }
        else if (curWord.length > 0) {
            words.push(curWord);
            curWord = "";
        }
        ++curIdx;
    }
    return words;
};

const concatWords = (words: string[], limit: number) => {
    let concatWord = words[0];
    for (let idx = 1; idx < limit; ++idx) {
        concatWord += "+" + encodeURIComponent(words[idx]);
    }
    return concatWord;
};

// TODO
// Need some metric to determine accuracy. more stringent / higher word limit = higher accuracy but less / no results, and vice versa
// Thinking of doing binary search until hit a max query amount or narrowed it to a good range / relevance. need to be careful about api calls
// For speed though maybe can chain a few async calls/searchs at a time issue is will be more unneccessary calls
// (i.e. maybe async calls of minLimit + 1/3 * (maxWordLimit - minWordLimit) async, minLimit + 2/3 * (maxWordLimit - minWordLimit) async), then process
// Will be less on fetch requests but will be more wasteful of api calls
const fetchAndFilterSearchResults = (errorWords: string[], currentPanel: any, lang: string, minWordLimit: number, maxWordLimit: number) => {

};

const fetchSearchResults = (errorWords: string[], currentPanel: any, lang: string, wordLimit: number, context: ExtensionContext) => {
    const searchQuery = concatWords(errorWords, wordLimit);
	const url = 'https://api.stackexchange.com/2.2/search/advanced?'
		+ 'order=desc'
		+ '&sort=relevance'
		+ '&q=' + searchQuery
		+ '&tagged=' + encodeURIComponent(toStackOverflowTag(lang))
		+ '&answers=1'
		+ '&filter=' + stackExchangeApiFilter
		+ '&site=stackoverflow';
    axios({
        method: 'get',
        url: url,
        responseType: 'json'
    }).then((response: any) => {
        if (response.status === 200) {
            getOrCreatePanel(currentPanel, context).webview.html = generateHTML(response.data.items);
        }
        else {
            console.log(response.status);
        }
    });
};

// Should've used Diagnostics. This may be a bit more flexible when I first considered it (using terminal then flexible pattern matching),
// to possibly later on even try to help with runtime or perhaps even logic errors (or if it's possible to have some sort of optional listener)
// but the numerous possible issues that may arise is almost certainly not worth it
const captureTerminal = (currentPanel: any, context: ExtensionContext) => {
    vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
        vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
                vscode.env.clipboard.readText().then((text: string) => {
					const lang = vscode.window.activeTextEditor.document.languageId;
                    const errors = extractErrors(text, lang);
                    if (errors !== null) {
                        const firstErrorWords = cleanErrorString(errors[0]);
                        fetchSearchResults(firstErrorWords, currentPanel, lang, Math.min(firstErrorWords.length, 8), context);
                    }
                });
            });
        });
    });
};

const getOrCreatePanel = (currentPanel: any, context: ExtensionContext) => {
    if (!currentPanel) {
        currentPanel = vscode.window.createWebviewPanel('searchResults',
        'Search Results',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
        );
        currentPanel.onDidDispose(() => {}, null, context.subscriptions);
    }
    return currentPanel;
};

function activate(context: ExtensionContext) {
    let currentPanel: any = undefined;
    console.log('Congratulations, your extension "help-overflow" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand('help-overflow.searchErrors', () => {
        captureTerminal(currentPanel, context);
    }));
    // Proposed API, insider only:
    // context.subscriptions.push(vscode.commands.registerCommand('helpoverflow.onDidWriteTerminalData', () => {
    // 		(<any>vscode.window).onDidWriteTerminalData((e: any) => {
    // 			console.log(e);
    // 		});
    // }));
}

exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;