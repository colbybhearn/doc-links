import * as vscode from 'vscode';
import { DocHoverProvider, DocLinkProvider } from './providers';
import { showDocPanel, showUrlPanel } from './docPanel';
import { attachDocCommand } from './attachDoc';

export function activate(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = { scheme: 'file' };

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new DocHoverProvider()),
    vscode.languages.registerDocumentLinkProvider(selector, new DocLinkProvider()),
    vscode.commands.registerCommand('docLinks.openDoc', async (uriString: string, refPath: string, isUrl?: boolean) => {
      const uri = vscode.Uri.parse(uriString);
      if (isUrl) {
        await openUrlRef(uri, refPath);
        return;
      }
      await showDocPanel(context, uri, refPath);
    }),
    vscode.commands.registerCommand('docLinks.attachDoc', attachDocCommand)
  );
}

async function openUrlRef(uri: vscode.Uri, title: string): Promise<void> {
  const useExternal = vscode.workspace.getConfiguration('docLinks').get<boolean>('openUrlsExternally', false);
  if (!useExternal) {
    // Host the URL in our own webview panel (Beside), rather than the
    // built-in Simple Browser — its viewColumn option is not reliably
    // honored on desktop VS Code, so it always opens filling the active group.
    await showUrlPanel(uri, title);
    return;
  }
  await vscode.env.openExternal(uri);
}

export function deactivate(): void {}
