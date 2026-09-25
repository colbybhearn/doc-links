import * as vscode from 'vscode';
import { findDocRefsInLine, resolveDocUri, isUrlRef } from './docRef';

export class DocHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const line = document.lineAt(position.line).text;
    const refs = findDocRefsInLine(line, position.line);
    const match = refs.find((r) => r.range.contains(position));
    if (!match) {
      return undefined;
    }

    const docUri = resolveDocUri(match.refPath);
    const isUrl = isUrlRef(match.refPath);
    const commandUri = docUri
      ? vscode.Uri.parse(
          `command:docLinks.openDoc?${encodeURIComponent(JSON.stringify([docUri.toString(), match.refPath, isUrl]))}`
        )
      : undefined;

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    if (commandUri) {
      md.appendMarkdown(`[$(link-external) Open "${match.refPath}"](${commandUri})`);
      if (match.description) {
        md.appendMarkdown(`\n\n${match.description}`);
      }
      md.appendMarkdown(`\n\n*Ctrl+Click the reference to open.*`);
      md.supportThemeIcons = true;
    } else {
      md.appendMarkdown('No workspace folder open — cannot resolve doc reference.');
    }

    return new vscode.Hover(md, match.range);
  }
}

export class DocLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text;
      const refs = findDocRefsInLine(line, i);
      for (const ref of refs) {
        const docUri = resolveDocUri(ref.refPath);
        if (!docUri) {
          continue;
        }
        const isUrl = isUrlRef(ref.refPath);
        const target = vscode.Uri.parse(
          `command:docLinks.openDoc?${encodeURIComponent(JSON.stringify([docUri.toString(), ref.refPath, isUrl]))}`
        );
        const link = new vscode.DocumentLink(ref.range, target);
        link.tooltip = `Open "${ref.refPath}"${ref.description ? ` — ${ref.description}` : ''}`;
        links.push(link);
      }
    }
    return links;
  }
}
