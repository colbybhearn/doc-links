import * as vscode from 'vscode';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp']);
const PDF_EXTENSIONS = new Set(['.pdf']);

let currentPanel: vscode.WebviewPanel | undefined;

function extOf(uri: vscode.Uri): string {
  const idx = uri.path.lastIndexOf('.');
  return idx === -1 ? '' : uri.path.slice(idx).toLowerCase();
}

export async function showDocPanel(context: vscode.ExtensionContext, docUri: vscode.Uri, title: string): Promise<void> {
  try {
    await vscode.workspace.fs.stat(docUri);
  } catch {
    const choice = await vscode.window.showWarningMessage(
      `Referenced document not found: ${vscode.workspace.asRelativePath(docUri)}`,
      'Attach a file now'
    );
    if (choice === 'Attach a file now') {
      await vscode.commands.executeCommand('docLinks.attachDoc');
    }
    return;
  }

  if (currentPanel) {
    currentPanel.dispose();
  }

  const panel = vscode.window.createWebviewPanel(
    'docLinksPreview',
    title,
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
    {
      enableScripts: false,
      localResourceRoots: [vscode.Uri.joinPath(docUri, '..')]
    }
  );
  currentPanel = panel;
  panel.onDidDispose(() => {
    if (currentPanel === panel) {
      currentPanel = undefined;
    }
  });

  const webviewUri = panel.webview.asWebviewUri(docUri);
  const ext = extOf(docUri);

  panel.webview.html = renderHtml(webviewUri, ext, title);
}

/**
 * Shows a @Doc: URL reference in our own webview panel, embedded in an
 * iframe, always opened Beside — unlike the built-in Simple Browser, whose
 * viewColumn option is not reliably honored on desktop VS Code.
 */
export async function showUrlPanel(uri: vscode.Uri, title: string): Promise<void> {
  if (currentPanel) {
    currentPanel.dispose();
  }

  const panel = vscode.window.createWebviewPanel(
    'docLinksPreview',
    title,
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
    {
      // The framed page needs to run its own JS — VS Code's webview host
      // appears to gate the embedded iframe's script capability on this
      // flag too, not just our own page's inline CSP.
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  currentPanel = panel;
  panel.onDidDispose(() => {
    if (currentPanel === panel) {
      currentPanel = undefined;
    }
  });

  panel.webview.html = renderUrlHtml(uri, title);
}

function renderUrlHtml(uri: vscode.Uri, title: string): string {
  const escapedTitle = escapeHtml(title);
  const url = uri.toString(true);
  const escapedUrl = escapeHtml(url);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${escapeHtml(uri.scheme)}://*; style-src 'unsafe-inline';">
<style>
  html, body { height: 100%; margin: 0; background: var(--vscode-editor-background); }
  body { display: flex; flex-direction: column; }
  .toolbar { padding: 6px 10px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
  .toolbar a { color: var(--vscode-textLink-foreground); }
  iframe { flex: 1; width: 100%; border: 0; background: white; }
  .note { padding: 8px 10px; font-family: var(--vscode-font-family); color: var(--vscode-descriptionForeground); font-size: 11px; }
</style>
</head>
<body>
  <div class="toolbar">${escapedTitle} — <a href="${escapedUrl}">open externally</a></div>
  <iframe src="${escapedUrl}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-pointer-lock allow-orientation-lock"></iframe>
  <div class="note">If the page appears blank, it may refuse to be embedded — use "open externally" above.</div>
</body>
</html>`;
}

function renderHtml(webviewUri: vscode.Uri, ext: string, title: string): string {
  const escapedTitle = escapeHtml(title);
  if (IMAGE_EXTENSIONS.has(ext)) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body { height: 100%; margin: 0; background: var(--vscode-editor-background); }
  body { display: flex; flex-direction: column; }
  .toolbar { padding: 6px 10px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); border-bottom: 1px solid var(--vscode-panel-border); }
  .imgwrap { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 12px; }
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
</style>
</head>
<body>
  <div class="toolbar">${escapedTitle}</div>
  <div class="imgwrap"><img src="${webviewUri}" alt="${escapedTitle}"></div>
</body>
</html>`;
  }

  if (PDF_EXTENSIONS.has(ext)) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body, iframe { height: 100%; width: 100%; margin: 0; border: 0; }
</style>
</head>
<body>
  <iframe src="${webviewUri}"></iframe>
</body>
</html>`;
  }

  // Fallback: offer a link to open with the OS default handler.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px; }
</style>
</head>
<body>
  <p>Preview isn't available for this file type inline.</p>
  <p><a href="${webviewUri}">${escapedTitle}</a></p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
