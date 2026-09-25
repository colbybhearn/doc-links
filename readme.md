# Doc Links

Reference images/documents stored in the repo's `.docs/` folder directly from code comments, and open them in a closeable popup panel next to your code.

## Why
I made this extension because I am constantly referencing technical drawings and schematics in order to work on very intricate 2d and 3d code. Without a reference diagram, maintenance is extremely time consuming and wasteful. ASCII art just cannot captue technical documentation clearly, so images are critical artifacts I need to keep organized. Now my images and .md files are in-line with the relevant code and in the repo, not just off in a folder or sketches on my desk.

## Syntax

Inside any comment, anywhere in a line:

```
@Doc:relative/path/inside/docs-folder.png optional human-readable description
```

Example:

```csharp
// @Doc:frame-elevation/eave-strut-geometry.png explains why eave struts are offset from the girt line
```

- The path is relative to the workspace's `.docs/` folder (configurable via `docLinks.docsFolder`).
- Subfolders are supported for organization, e.g. `@Doc:pdf/quote-spec-v2.pdf`.
- If the filename contains spaces, wrap the path in double quotes: `@Doc:"eave strut geometry.png" optional description`.
- Everything after the path on the line is treated as a free-text description for human readers; it's not parsed further.

### URLs

`@Doc:` also accepts a full URL instead of a path into `.docs/`:

```csharp
// @Doc:https://example.com/api-reference optional human-readable description
```

- Recognized by a leading scheme (e.g. `https://`, `http://`).
- By default it opens in VS Code's built-in Simple Browser tab beside your code; set `docLinks.openUrlsExternally` to `true` to open it in your system's default browser instead.

## Usage

- **Hover** over an `@Doc:...` reference to see a summary and an "Open" link.
- **Ctrl+Click** (Cmd+Click on macOS) the reference to open the document — a local file opens in a popup webview panel beside your code, a URL opens in a browser (see above).
- Run **Doc Links: Attach Image/Document and Insert Reference** from the Command Palette to pick a file from disk, copy it into `.docs/`, and insert the `@Doc:` snippet at your cursor.

## Supported preview types

- Images (png, jpg, jpeg, gif, svg, webp, bmp) render inline.
- PDFs render in an embedded viewer.
- Other file types show a fallback link.

## Development

```
npm install
npm run compile
```

Press F5 (with this folder open in VS Code) to launch an Extension Development Host with the extension loaded against the parent `ninja` workspace.
