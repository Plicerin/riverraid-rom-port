// River Raid — content-hashed single-bundle build script.
//
// WHY THIS EXISTS
// ---------------
// A `?v=N` cache-buster on the index.html <script> tag only busts that
// single URL. Child ESM imports (e.g. main.js -> ./river.js) do NOT
// inherit the parent's query string, so the browser can keep serving stale
// cached children across rebuilds.
//
// The fix is two-pronged:
//   1. Bundle src/main.js into a single content-hashed ESM file under
//      dist/. The browser makes ONE fetch (no child imports), so the
//      cache-bust propagation problem cannot exist.
//   2. To safely rewrite index.html's <script> tag across rebuilds
//      WITHOUT over-matching and accidentally deleting unrelated
//      content, we use explicit bounded HTML-comment markers around
//      the bundle's <script> tag.
//
//      The previous version's regex was:
//
//          /<!--\s*[\s\S]*?\s*-->\s*<script\s+type="module"\s+src="..."><\/script>/i
//
//      Because the regex engine extends [\s\S]*? non-greedily until the
//      closing --> + <script> can match, this anchored on the FIRST
//      HTML comment in the file (the favicon-404 silencer comment)
//      and matched all the way down to the script tag, eating every
//      byte in between (CSS, </head>, <body>, <canvas>, HUD).
//
//      The new pattern uses literal `<!-- BUNDLE-SCRIPT-START -->` ...
//      `<!-- BUNDLE-SCRIPT-END -->` anchors that BOUND the match.
//      Regardless of other comments in the file, the <script> tag
//      inside the markers is exactly what gets replaced.
//
// USAGE
// -----
//     npm install          # one time, downloads esbuild
//     npm run build        # produces dist/main-<hash>.js and atomically
//                          # rewrites the marker block in index.html.
//
// The bundle hash is deterministic: re-running with no src/ changes
// produces the same hash, so unchanged bundles stay in long-term
// browser caches. Any source edit invalidates the cache automatically.

import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';

const MARKER_START = '<!-- BUNDLE-SCRIPT-START -->';
const MARKER_END   = '<!-- BUNDLE-SCRIPT-END -->';

// Clean any prior build so old hashed files don't accumulate across
// releases (browsers won't ask for them again, but they pile up on disk).
rmSync('dist', { recursive: true, force: true });

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'esm',          // keep ESM (cheap, browser-native)
  minify: true,           // strip comments + whitespace from bundle output
  target: 'es2020',       // modern evergreen baseline (avoids ESnext risk)
  entryNames: '[name]-[hash]',
  outdir: 'dist',
  write: true,
  metafile: true,         // exposes the hashed output filename
  logLevel: 'info',
});

// Pull the single hashed main bundle out of the metafile. Defensive
// filter for `.js` so any future sourcemap / chunk emission doesn't
// silently double our output count.
const outFiles = Object.keys(result.metafile.outputs).filter((k) => k.endsWith('.js'));
if (outFiles.length !== 1) {
  throw new Error(
    `expected exactly one .js bundle, got ${outFiles.length}: ${outFiles.join(', ')}`
  );
}
const bundlePath = outFiles[0];

let html = await readFile('index.html', 'utf8');

// Defensive: capture original length BEFORE mutation so we can detect
// catastrophic rewrites (like the bug this entire scheme replaces).
const origLen = html.length;

// Anchor escape so a future literal like `<!-- BUNDLE-SCRIPT-START -->`
// containing regex metachars would still match correctly. (Today the
// markers are pure ASCII, so this is belt-and-suspenders.)
const markerReSrc = `${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`;
const taggedBlockRe = new RegExp(markerReSrc);

// Both rebuild cases the codebase might arrive in:
//   - freshly restored from ?v=2 era, where the script tag is
//     `<script type="module" src="src/main.js?v=2"></script>`
//   - already rewritten by an earlier, manual edit, where the script
//     tag is `<script type="module" src="dist/main-XXXX.js"></script>`
const untaggedScriptRe = /<script\s+type="module"\s+src="(?:src\/main\.js\?[^"]*|dist\/main-[A-Za-z0-9_-]+\.js)"\s*><\/script>/i;

// Legacy "?v=N cache-buster" comment that lived immediately above the
// pre-bundle script tag. We strip it ONCE on the first build so future
// readers don't see stale documentation; subsequent builds won't match
// (the script tag is now inside MARKER_START/END).
//
// ANCHOR STRATEGY: the comment ALWAYS starts with `?v=N` (e.g. `?v=2`).
// We anchor the regex on that literal prefix. After the prefix, a SINGLE
// `[\s\S]*?` extends non-greedily until the first `-->` immediately
// followed by `<script`. Because the legacy comment is short and
// self-contained, the non-greedy match terminates inside the SAME
// comment, never spanning to a different comment earlier in the file.
// (Compare to the catastrophic over-match bug that ate the entire body
// — there, TWO non-greedy segments together with a `(?:\?v=|cache-buster)`
// alternative widened the match until it reached `<script>` somewhere
// much later in the file.)
const legacyCacheBusterCommentRe = /<!--\s*\?v=\d+[\s\S]*?-->\s*(?=<script)/i;

const newBlock =
  `${MARKER_START}\n` +
  `<!-- Served from ${bundlePath} (content-hashed single bundle,\n` +
  `     generated by build.mjs). Run \`npm run build\` after editing\n` +
  `     src/; the content hash invalidates browser caches automatically. -->\n` +
  `<script type="module" src="${bundlePath}"></script>\n` +
  `${MARKER_END}`;

let replaced = false;

if (taggedBlockRe.test(html)) {
  // Rebuild path: replace the existing marker block in place (idempotent).
  html = html.replace(taggedBlockRe, newBlock);
  replaced = true;
} else if (untaggedScriptRe.test(html)) {
  // First-build path: strip any legacy ?v= comment immediately above
  // the script tag, then replace the script tag with the marker block.
  html = html.replace(legacyCacheBusterCommentRe, '');
  html = html.replace(untaggedScriptRe, newBlock);
  replaced = true;
}

if (!replaced) {
  throw new Error(
    'index.html did not contain a recognizable bundle <script> tag ' +
    '(neither a marker-tagged block nor a legacy/src-or-dist <script>). ' +
    'Did someone edit it manually? Restore a <script type="module" src="src/main.js?v=N"> ' +
    '+ <!-- BUNDLE-SCRIPT-START --> + <!-- BUNDLE-SCRIPT-END --> pair.'
  );
}

// Defensive size sanity check: a rewrite must NOT catastrophically
// shrink index.html. If it did (e.g. due to a future bug rewinding to
// the over-greedy regex), abort loud rather than silently serving a
// broken page to the user.
if (html.length < origLen * 0.5) {
  throw new Error(
    `build.mjs rewrote index.html and shrank it from ${origLen} to ` +
    `${html.length} bytes (>50% loss) — likely an over-greedy regex ` +
    `match. Aborting before writing. The original is preserved.`
  );
}

await writeFile('index.html', html, 'utf8');

console.log(`built: ${bundlePath}`);
console.log(`index.html -> <script src="${bundlePath}">`);

// ── Helper ───────────────────────────────────────────────────────────
function escapeRegExp(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
