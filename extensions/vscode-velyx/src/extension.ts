import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  console.log('VELYX VS Code Extension activated!');

  // Register Hover Information Provider for .vx files
  const hoverProvider = vscode.languages.registerHoverProvider('velyx', {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      const word  = document.getText(range);

      if (word === 'state') {
        return new vscode.Hover(
          new vscode.MarkdownString('**VELYX Signal State**\n\nDeclares a fine-grained reactive state variable compiled into `@velyx/core` signals.')
        );
      }
      if (word.startsWith('vx-')) {
        return new vscode.Hover(
          new vscode.MarkdownString(`**VELYX Compiler Directive (\`${word}\`)**\n\nBinds DOM events or dynamic attributes statically at compile-time without Virtual DOM overhead.`)
        );
      }
      return undefined;
    }
  });

  context.subscriptions.push(hoverProvider);
}

export function deactivate(): void {}
