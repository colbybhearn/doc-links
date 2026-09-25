import * as vscode from 'vscode';
import { DocHoverProvider, DocLinkProvider } from './providers';
import { showDocPanel } from './docPanel';
import { attachDocCommand } from './attachDoc';

export function activate(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = { scheme: 'file' };

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new DocHoverProvider()),
    vscode.languages.registerDocumentLinkProvider(selector, new DocLinkProvider()),
    vscode.commands.registerCommand('docLinks.openDoc', async (uriString: string, refPath: string, isUrl?: boolean) => {
      const uri = vscode.Uri.parse(uriString);
      if (isUrl) {
        await openUrlRef(uri);
        return;
      }
      await showDocPanel(context, uri, refPath);
    }),
    vscode.commands.registerCommand('docLinks.attachDoc', attachDocCommand)
  );
}

async function openUrlRef(uri: vscode.Uri): Promise<void> {
  const useExternal = vscode.workspace.getConfiguration('docLinks').get<boolean>('openUrlsExternally', false);
  if (!useExternal) {
    try {
      // Built-in "Simple Browser" extension opens the URL inside a VS Code tab.
      await vscode.commands.executeCommand('simpleBrowser.show', uri.toString());
      return;
    } catch {
      // Simple Browser unavailable — fall through to the OS default browser.
    }
  }
  await vscode.env.openExternal(uri);
}

export function deactivate(): void {}
