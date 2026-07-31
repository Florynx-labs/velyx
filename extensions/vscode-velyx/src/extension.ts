import * as vscode from 'vscode';

const velyxKeywords = [
  { label: 'state', detail: 'VELYX Signal State', documentation: 'Declares a fine-grained reactive state variable compiled into `@velyx/core` signals.' },
  { label: 'prop', detail: 'VELYX Component Prop', documentation: 'Declares a component property.' },
  { label: 'computed', detail: 'VELYX Computed State', documentation: 'Declares a derived reactive state.' },
  { label: 'watch', detail: 'VELYX Watcher', documentation: 'Watches a state for side-effects.' },
  { label: 'provide', detail: 'VELYX Dependency Injection', documentation: 'Provides a value to all descendants.' },
  { label: 'inject', detail: 'VELYX Dependency Injection', documentation: 'Injects a value from an ancestor.' },
  { label: 'onMount', detail: 'VELYX Lifecycle', documentation: 'Runs a callback after the component mounts.' },
  { label: 'onDestroy', detail: 'VELYX Lifecycle', documentation: 'Runs a callback before the component is destroyed.' },
  { label: 'batch', detail: 'VELYX Reactive Batching', documentation: 'Batches multiple state updates into a single render.' },
  { label: 'effect', detail: 'VELYX Reactive Effect', documentation: 'Runs a side effect that automatically tracks state dependencies.' },
  { label: 'component', detail: 'VELYX Component Registration', documentation: 'Registers a child component.' }
];

const velyxDirectives = [
  'vx-click', 'vx-input', 'vx-change', 'vx-submit', 'vx-model',
  'vx-if', 'vx-for', 'vx-show', 'vx-transition', 'vx-visible',
  'vx-idle', 'vx-hover', 'vx-media', 'vx-interaction'
];

export function activate(context: vscode.ExtensionContext): void {
  console.log('VELYX VS Code Extension activated!');

  // Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider('velyx', {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
      const range = document.getWordRangeAtPosition(position, /vx-[a-zA-Z0-9-:]+(\.[a-zA-Z0-9-]+)*|[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (!range) return undefined;
      const word = document.getText(range);

      const keyword = velyxKeywords.find(kw => kw.label === word);
      if (keyword) {
        return new vscode.Hover(
          new vscode.MarkdownString(`**${keyword.detail}**\n\n${keyword.documentation}`)
        );
      }
      
      if (word.startsWith('vx-')) {
        const baseDirective = word.split('.')[0];
        if (velyxDirectives.includes(baseDirective)) {
          return new vscode.Hover(
            new vscode.MarkdownString(`**VELYX Compiler Directive (\`${baseDirective}\`)**\n\nBinds DOM events or dynamic attributes statically at compile-time without Virtual DOM overhead.`)
          );
        }
      }
      
      return undefined;
    }
  });

  // Completion Provider
  const completionProvider = vscode.languages.registerCompletionItemProvider('velyx', {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[]> {
      const linePrefix = document.lineAt(position).text.substr(0, position.character);
      
      const items: vscode.CompletionItem[] = [];
      
      // Keywords completion
      for (const kw of velyxKeywords) {
        const item = new vscode.CompletionItem(kw.label, vscode.CompletionItemKind.Keyword);
        item.detail = kw.detail;
        item.documentation = new vscode.MarkdownString(kw.documentation);
        items.push(item);
      }
      
      // Directives completion inside HTML tags
      if (linePrefix.includes('<') && !linePrefix.includes('>')) {
        for (const dir of velyxDirectives) {
          const item = new vscode.CompletionItem(dir, vscode.CompletionItemKind.Property);
          item.detail = 'VELYX Directive';
          item.insertText = new vscode.SnippetString(`${dir}="$1"`);
          items.push(item);
        }
      }
      
      return items;
    }
  });

  context.subscriptions.push(hoverProvider, completionProvider);
}

export function deactivate(): void {}
