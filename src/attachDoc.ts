import * as vscode from 'vscode';
import * as path from 'path';
import { getDocsFolderUri } from './docRef';

export async function attachDocCommand(): Promise<void> {
  const docsFolder = getDocsFolderUri();
  if (!docsFolder) {
    vscode.window.showErrorMessage('Doc Links: open a workspace folder first.');
    return;
  }

  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Attach to docs folder',
    filters: {
      Images: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'],
      Documents: ['pdf', 'txt', 'md'],
      'All files': ['*']
    }
  });
  if (!picked || picked.length === 0) {
    return;
  }
  const source = picked[0];
  const fileName = path.basename(source.fsPath);

  const subPath = await vscode.window.showInputBox({
    prompt: 'Relative path within the docs folder (edit to organize into subfolders)',
    value: fileName,
    validateInput: (v) => (v.trim().length === 0 ? 'Path cannot be empty' : undefined)
  });
  if (!subPath) {
    return;
  }

  const destUri = vscode.Uri.joinPath(docsFolder, subPath);
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(destUri, '..'));

  const bytes = await vscode.workspace.fs.readFile(source);
  await vscode.workspace.fs.writeFile(destUri, bytes);

  const description = await vscode.window.showInputBox({
    prompt: 'Optional description to include after the reference'
  });

  const normalizedPath = subPath.replace(/\\/g, '/');
  const pathToken = /\s/.test(normalizedPath) ? `"${normalizedPath}"` : normalizedPath;
  const snippet = `@Doc:${pathToken}${description ? ` ${description}` : ''}`;
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    await editor.edit((builder) => {
      builder.insert(editor.selection.active, snippet);
    });
  } else {
    await vscode.env.clipboard.writeText(snippet);
    vscode.window.showInformationMessage('Doc Links: reference copied to clipboard (no active editor to insert into).');
  }
}
