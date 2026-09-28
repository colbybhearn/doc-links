import * as vscode from 'vscode';

/**
 * Matches `@Doc:relative/path.ext` (or `@Doc: relative/path.ext`, with a
 * single optional space after the colon) anywhere inside a line (works
 * inside any comment style since it doesn't care about the comment marker
 * itself). Captures the path and, optionally, trailing descriptive text.
 * Paths containing spaces must be wrapped in double quotes, e.g.
 * `@Doc:"my file.png" description`.
 */
const DOC_REF_RE = /@Doc: ?(?:"([^"]+)"|(\S+))(?:\s+(.*))?/i;

export interface DocRefMatch {
  /** Path as written in the source, relative to the docs folder. */
  refPath: string;
  /** Trailing human-readable description, if present. */
  description: string;
  /** Range of just the `@Doc:path` token (not the description). */
  range: vscode.Range;
}

export function findDocRefsInLine(line: string, lineNumber: number): DocRefMatch[] {
  const results: DocRefMatch[] = [];
  const re = new RegExp(DOC_REF_RE.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const refPath = m[1] ?? m[2];
    const description = (m[3] ?? '').trim();
    const tokenStart = m.index;
    const pathText = m[1] !== undefined ? `"${refPath}"` : refPath;
    // m[0] up through the matched path (before any trailing description) —
    // reconstruct its length directly so an optional space after the colon
    // (or none at all) is measured correctly rather than assumed.
    const tokenLength = m[0].indexOf(pathText, '@Doc:'.length) + pathText.length;
    const start = new vscode.Position(lineNumber, tokenStart);
    const end = new vscode.Position(lineNumber, tokenStart + tokenLength);
    results.push({ refPath, description, range: new vscode.Range(start, end) });
    // avoid infinite loop on zero-length matches
    if (m[0].length === 0) {
      re.lastIndex++;
    }
  }
  return results;
}

/** True if the ref path looks like a URL rather than a path into the docs folder. */
export function isUrlRef(refPath: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(refPath);
}

export function getDocsFolderUri(): vscode.Uri | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    return undefined;
  }
  const configured = vscode.workspace.getConfiguration('docLinks').get<string>('docsFolder', '.docs');
  return vscode.Uri.joinPath(folder.uri, configured);
}

export function resolveDocUri(refPath: string): vscode.Uri | undefined {
  if (isUrlRef(refPath)) {
    return vscode.Uri.parse(refPath);
  }
  const docsFolder = getDocsFolderUri();
  if (!docsFolder) {
    return undefined;
  }
  return vscode.Uri.joinPath(docsFolder, refPath);
}
