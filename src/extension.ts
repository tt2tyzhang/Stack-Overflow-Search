//lots of insight and code on the terminal capture from https://github.com/mikekwright/vscode-terminal-capture

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const extractError = (text: string) => {
	const extracted = text.match(/\d+:\d+: error: .*/gi);
	return extracted;
};

const captureTerminal = () => {
	vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
		vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
			vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
				vscode.env.clipboard.readText().then((text)=>{
					console.log(extractError(text));
				});
			});
		});
	});
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "help-overflow" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('help-overflow.searchErrors', () => {
		captureTerminal();
	}));

	// context.subscriptions.push(vscode.commands.registerCommand('helpoverflow.onDidWriteTerminalData', () => {
	// 		(<any>vscode.window).onDidWriteTerminalData((e: any) => {
	// 			console.log(e);
	// 		});
	// }));
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('help-overflow.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HelpOverflow!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
