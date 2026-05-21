import { cp, readdir, readFile, writeFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { minify } from "terser";
import JavaScriptObfuscator from "javascript-obfuscator";
import chalk from "chalk";

const OBFUSCATE = true;
const OBFUSCATE_HTML = true;

const SRC_DIR = path.join(process.cwd(), "static");
const DIST_DIR = path.join(process.cwd(), "dist");
const JS_DIR = path.join(DIST_DIR, "assets", "js");
const UV_DIR = path.join(DIST_DIR, "assets", "ultraviolet");
const DYNAMIC_DIR = path.join(DIST_DIR, "assets", "dynamic");

const UV_PREFIX = "ultraviolet.";
const DYNAMIC_PREFIX = "dynamic.";

const KEEP_IN_PLACE = new Set();

const SKIP_OBFUSCATE = new Set(["scramjet.all.js", "scramjet.sync.js"]);

const OLD_DYNAMIC_PREFIX = "/assets/dynamic/";
const OLD_UV_PREFIX = "/assets/ultraviolet/";

const OLD_UV_SCOPE = "/uv/";
const OLD_SCRAMJET_SCOPE = "/uv/scramjet/";
const OLD_DYNAMIC_SCOPE = "/uv/dynamic/";

const WORDS = [
  "api",
  "lib",
  "src",
  "net",
  "sys",
  "io",
  "pkg",
  "app",
  "mod",
  "ext",
  "math",
  "calc",
  "units",
  "matrix",
  "vector",
  "scalar",
  "ratio",
  "delta",
  "sigma",
  "alpha",
  "beta",
  "gamma",
  "omega",
  "phi",
  "theta",
  "core",
  "util",
  "data",
  "base",
  "node",
  "tree",
  "heap",
  "stack",
  "queue",
  "graph",
  "hash",
  "map",
  "set",
  "list",
  "ring",
  "chain",
  "parse",
  "fmt",
  "log",
  "proc",
  "exec",
  "init",
  "boot",
  "load",
  "sync",
  "async",
  "fetch",
  "emit",
  "bind",
  "wrap",
  "pool",
  "fork",
  "dictionary",
  "mapping",
  "resolver",
  "adapter",
  "encoder",
  "decoder",
  "scheduler",
  "dispatcher",
  "observer",
  "registry",
  "factory",
  "builder",
  "transform",
  "pipeline",
  "middleware",
  "handler",
  "router",
  "broker",
  "storage",
  "cache",
  "buffer",
  "stream",
  "channel",
  "socket",
  "bridge",
  "monitor",
  "profiler",
  "tracer",
  "validator",
  "sanitizer",
  "1",
  "2",
  "3",
  "v1",
  "v2",
  "v3",
  "that",
  "was",
  "my",
  "part",
  "of",
  "the",
  "deal",
  ",",
  "honest",
  "we",
  "got",
  "so",
  "familiar",
  "spending",
  "each",
  "day",
  "of",
  "the",
  "year",
  "white",
  "ferrari",
  "(oh)",
  "good",
  "times",
];

const FILENAMES = [
  "x",
  "y",
  "z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "1",
  "2",
  "3",
  "10",
  "11",
  "100",
  "mod",
  "lib",
  "api",
  "run",
  "cli",
  "app",
  "env",
  "cfg",
  "index",
  "main",
  "core",
  "init",
  "loader",
  "worker",
  "runtime",
  "parser",
  "formatter",
  "handler",
  "manager",
  "client",
  "server",
  "config",
  "schema",
  "mapper",
  "adapter",
  "resolver",
  "encoder",
  "decoder",
  "sync",
  "fetch",
  "stream",
  "buffer",
  "queue",
  "cache",
  "router",
  "dispatcher",
  "emitter",
  "observer",
  "builder",
  "factory",
  "transform",
  "pipeline",
  "registry",
  "validator",
  "scheduler",
  "monitor",
  "tracer",
  "bridge",
  "channel",
  "storage",
  "profiler",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSegment() {
  if (Math.random() < 0.1) return `${randomItem(WORDS)}-${randomItem(WORDS)}`;
  return randomItem(WORDS);
}

function randomWord() {
  return randomItem(WORDS);
}

function randomDir() {
  const depth = randomInt(1, 2);
  return Array.from({ length: depth }, randomSegment).join("/");
}

function randomFilename() {
  if (Math.random() < 0.1) return `${randomItem(FILENAMES)}-${randomItem(FILENAMES)}`;
  return randomItem(FILENAMES);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRenameMap(content, renameMap, protectedPrefixes) {
  let result = content;
  for (const [original, newPublicPath] of renameMap) {
    const q = `['"\`]`;
    const pattern = new RegExp(`(${q})([^'"\`]*${escapeRegex(original)})(${q})`, "g");
    result = result.replace(pattern, (_m, open, inner, close) => {
      if (protectedPrefixes.some(p => inner.includes(p))) return `${open}${inner}${close}`;
      return `${open}${newPublicPath}${close}`;
    });
  }
  return result;
}

function replaceAll(content, oldStr, newStr) {
  return content.split(oldStr).join(newStr);
}

async function runObfuscator(source) {
  const minified = await minify(source, {
    compress: { drop_console: false, passes: 2 },
    mangle: true,
    format: { comments: false },
  });
  if (!minified.code) throw new Error("Terser returned empty output");

  const obfuscated = JavaScriptObfuscator.obfuscate(minified.code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,
    selfDefending: false,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  });
  return obfuscated.getObfuscatedCode();
}

function shouldProcessInlineScript(attrs) {
  if (/\bsrc\s*=/i.test(attrs)) return false;

  const typeMatch = attrs.match(/\btype\s*=\s*(["']?)([^"'\s>]+)\1/i);
  if (!typeMatch) return true;

  const type = typeMatch[2].toLowerCase();
  return ["text/javascript", "application/javascript", "module"].includes(type);
}

async function obfuscateInlineScripts(html) {
  const scripts = [];
  let index = 0;

  const protectedHtml = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, source) => {
    const token = `___HTML_SCRIPT_${index++}___`;
    scripts.push({ token, match, attrs, source });
    return token;
  });

  const processedScripts = await Promise.all(
    scripts.map(async script => {
      if (!script.source.trim() || !shouldProcessInlineScript(script.attrs)) return [script.token, script.match];

      try {
        const obfuscated = await runObfuscator(script.source);
        return [script.token, `<script${script.attrs}>${obfuscated}</script>`];
      } catch (err) {
        console.warn(chalk.yellow(`  ! inline script skipped: ${err.message}`));
        return [script.token, script.match];
      }
    }),
  );

  let output = protectedHtml;
  for (const [token, script] of processedScripts) output = output.replace(token, script);
  return output;
}

function minifyHtml(html) {
  const blocks = [];
  let index = 0;

  const protectBlock = block => {
    const token = `___HTML_BLOCK_${index++}___`;
    blocks.push([token, block]);
    return token;
  };

  let output = html
    .replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, protectBlock)
    .replace(/<!--(?!\[if\b)[\s\S]*?-->/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s+\/>/g, "/>")
    .trim();

  for (const [token, block] of blocks) output = output.replace(token, block);
  return output;
}

function encodeHtmlText(text) {
  return text.replace(/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);|./gis, match => {
    if (match.startsWith("&") && match.endsWith(";")) return match;
    return `&#${match.codePointAt(0)};`;
  });
}

function obfuscateTextNodes(html) {
  return html.replace(/>([^<>]+)</g, (_match, text) => {
    if (!text.trim()) return `>${text}<`;
    return `>${encodeHtmlText(text)}<`;
  });
}

function obfuscateAttributeValues(html) {
  const valueAttrs = "alt|aria-label|class|content|crossorigin|href|id|method|name|onclick|onchange|onkeyup|placeholder|rel|src|style|title|type|value";
  const attrPattern = new RegExp(`\\s(${valueAttrs})=(["'])(.*?)\\2`, "gis");

  return html.replace(/<([a-z][\w:-]*)([^<>]*)>/gi, (tag, name, attrs) => {
    if (/^style$/i.test(name)) return tag;

    const encodedAttrs = attrs.replace(attrPattern, (_match, attrName, quote, value) => {
      if (!value) return ` ${attrName}=${quote}${value}${quote}`;
      return ` ${attrName}=${quote}${encodeHtmlText(value)}${quote}`;
    });

    return `<${name}${encodedAttrs}>`;
  });
}

function obfuscateHtmlMarkup(html) {
  const blocks = [];
  let index = 0;

  const protectBlock = block => {
    const token = `<html-obfuscation-block data-index="${index++}"></html-obfuscation-block>`;
    blocks.push([token, block]);
    return token;
  };

  let output = html.replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, protectBlock);
  output = obfuscateAttributeValues(output);
  output = obfuscateTextNodes(output);

  for (const [token, block] of blocks) output = output.replace(token, block);
  output = obfuscateAttributeValues(output);
  return output;
}

async function obfuscateHtml(html) {
  return obfuscateHtmlMarkup(minifyHtml(await obfuscateInlineScripts(html)));
}

async function getJsFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await getJsFiles(full)));
    else if (entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

async function getHtmlFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await getHtmlFiles(full)));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

async function updateServerRoutes(uvScope, scramjetScope, dynamicScope) {
  const indexPath = path.join(process.cwd(), "index.js");
  try {
    let content = await readFile(indexPath, "utf8");
    content = replaceAll(content, OLD_UV_SCOPE, uvScope);
    content = replaceAll(content, OLD_SCRAMJET_SCOPE, scramjetScope);
    content = replaceAll(content, OLD_DYNAMIC_SCOPE, dynamicScope);
    await writeFile(indexPath, content, "utf8");
    console.log(chalk.green("  + index.js (scope routes updated)"));
  } catch {}
}

async function build() {
  console.log("Cleaning dist/...");
  await rm(DIST_DIR, { recursive: true, force: true });

  console.log("Copying static/ -> dist/...");
  await cp(SRC_DIR, DIST_DIR, { recursive: true });

  console.log(OBFUSCATE ? chalk.yellow("Obfuscation: ON") : chalk.yellow("Obfuscation: OFF (rename + rewrite only)"));

  const uvBase = randomWord();
  const scramjetSub = randomWord();
  const dynamicSub = randomWord();

  const NEW_UV_SCOPE = `/${uvBase}/`;
  const NEW_SCRAMJET_SCOPE = `/${uvBase}/${scramjetSub}/`;
  const NEW_DYNAMIC_SCOPE = `/${uvBase}/${dynamicSub}/`;

  console.log(`\nScope paths:`);
  console.log(`  ${OLD_UV_SCOPE} -> ${NEW_UV_SCOPE}`);
  console.log(`  ${OLD_SCRAMJET_SCOPE} -> ${NEW_SCRAMJET_SCOPE}`);
  console.log(`  ${OLD_DYNAMIC_SCOPE} -> ${NEW_DYNAMIC_SCOPE}`);

  let jsPublicDir, dynPublicDir;
  do {
    jsPublicDir = randomDir();
    dynPublicDir = randomDir();
  } while (jsPublicDir === dynPublicDir);

  const jsDirFull = path.join(DIST_DIR, jsPublicDir);
  const dynDirFull = path.join(DIST_DIR, dynPublicDir);
  await mkdir(jsDirFull, { recursive: true });
  await mkdir(dynDirFull, { recursive: true });

  const NEW_DYNAMIC_FILE_PREFIX = `/${dynPublicDir}/`;
  const NEW_UV_FILE_PREFIX = `/${jsPublicDir}/`;

  const PROTECTED = ["/bm/", "/ep/", "/bare/", "/wisp/", "/assets/scramjet/", NEW_UV_SCOPE, NEW_SCRAMJET_SCOPE, NEW_DYNAMIC_SCOPE];

  const usedPaths = new Set();

  function nextOutputPath(basePublicDir, baseDirFull) {
    const existingSegments = new Set(basePublicDir.split("/").filter(Boolean));
    let publicPath, fullPath;
    do {
      const filename = `${randomFilename()}.js`;
      if (Math.random() < 0.05) {
        let subDir;
        do {
          subDir = randomWord();
        } while (existingSegments.has(subDir));
        publicPath = `/${basePublicDir}/${subDir}/${filename}`;
        fullPath = path.join(baseDirFull, subDir, filename);
      } else {
        publicPath = `/${basePublicDir}/${filename}`;
        fullPath = path.join(baseDirFull, filename);
      }
    } while (usedPaths.has(publicPath));
    usedPaths.add(publicPath);
    return { publicPath, fullPath };
  }

  const jsRenameMap = new Map();
  const dynRenameMap = new Map();
  const plan = new Map();

  for (const filePath of await getJsFiles(JS_DIR)) {
    const basename = path.basename(filePath);
    const { publicPath: newPublicPath, fullPath: newFullPath } = nextOutputPath(jsPublicDir, jsDirFull);
    plan.set(filePath, { basename, newPublicPath, newFullPath, inPlace: false, group: "js" });
    jsRenameMap.set(basename, newPublicPath);
  }

  for (const filePath of await getJsFiles(UV_DIR)) {
    const basename = path.basename(filePath);
    const { publicPath: newPublicPath, fullPath: newFullPath } = nextOutputPath(jsPublicDir, jsDirFull);
    plan.set(filePath, { basename, newPublicPath, newFullPath, inPlace: false, group: "uv" });
    jsRenameMap.set(basename, newPublicPath);
  }

  const ROOT_JS = ["sw.js"];
  for (const name of ROOT_JS) {
    const filePath = path.join(DIST_DIR, name);
    let newName;
    do {
      newName = `${randomFilename()}.js`;
    } while (usedPaths.has(`/${newName}`));
    usedPaths.add(`/${newName}`);
    const newPublicPath = `/${newName}`;
    const newFullPath = path.join(DIST_DIR, newName);
    plan.set(filePath, { basename: name, newPublicPath, newFullPath, inPlace: false, group: "uv" });
    jsRenameMap.set(name, newPublicPath);
  }

  for (const filePath of await getJsFiles(DYNAMIC_DIR)) {
    const basename = path.basename(filePath);

    if (basename.startsWith(DYNAMIC_PREFIX)) {
      const { publicPath: newPublicPath, fullPath: newFullPath } = nextOutputPath(dynPublicDir, dynDirFull);
      plan.set(filePath, { basename, newPublicPath, newFullPath, inPlace: false, group: "dynamic" });
      dynRenameMap.set(basename, newPublicPath);
    } else {
      const rel = path.relative(DIST_DIR, filePath).replace(/\\/g, "/");
      plan.set(filePath, { basename, newPublicPath: `/${rel}`, newFullPath: filePath, inPlace: true, group: "dynamic" });
    }
  }

  console.log(`\nJS/UV output:   /${jsPublicDir}`);
  console.log(`Dynamic output: /${dynPublicDir}\n`);

  let passed = 0;
  let failed = 0;

  await Promise.all(
    [...plan.entries()].map(async ([filePath, { basename, newPublicPath, newFullPath, inPlace, group }]) => {
      try {
        let output = await readFile(filePath, "utf8");

        output = replaceAll(output, OLD_SCRAMJET_SCOPE, NEW_SCRAMJET_SCOPE);
        output = replaceAll(output, OLD_DYNAMIC_SCOPE, NEW_DYNAMIC_SCOPE);
        output = replaceAll(output, OLD_UV_SCOPE, NEW_UV_SCOPE);

        if (group === "js" || group === "uv") {
          output = replaceAll(output, OLD_UV_PREFIX, NEW_UV_FILE_PREFIX);
          output = applyRenameMap(output, jsRenameMap, PROTECTED);
          output = replaceAll(output, OLD_DYNAMIC_PREFIX, NEW_DYNAMIC_FILE_PREFIX);
          output = applyRenameMap(output, dynRenameMap, PROTECTED);
        }

        if (group === "dynamic") {
          output = replaceAll(output, OLD_DYNAMIC_PREFIX, NEW_DYNAMIC_FILE_PREFIX);
          for (const [orig, newPath] of dynRenameMap) {
            const q = `['"\`]`;
            const pat = new RegExp(`(${q})${escapeRegex(orig)}(${q})`, "g");
            output = output.replace(pat, `$1${newPath}$2`);
          }
          output = applyRenameMap(output, dynRenameMap, PROTECTED);
        }

        const shouldObfuscate = OBFUSCATE && !SKIP_OBFUSCATE.has(basename);
        if (shouldObfuscate) output = await runObfuscator(output);

        await mkdir(path.dirname(newFullPath), { recursive: true });
        await writeFile(newFullPath, output, "utf8");
        if (!inPlace) await rm(filePath);

        const tag = shouldObfuscate ? "(obfuscated)" : SKIP_OBFUSCATE.has(basename) ? "(skip-obfuscate)" : inPlace ? "(in place)" : "(renamed)";
        console.log(chalk.green(`  + ${basename} -> ${newPublicPath} ${tag}`));
        passed++;
      } catch (err) {
        console.error(chalk.red(`  x ${basename}: ${err.message}`));
        failed++;
      }
    }),
  );

  console.log(`\n${passed} processed${failed ? `, ${failed} failed` : ""}`);

  for (const dir of [JS_DIR, UV_DIR, DYNAMIC_DIR]) {
    await rm(dir, { recursive: true, force: true });
  }

  const allRenames = new Map([...jsRenameMap, ...dynRenameMap]);
  const htmlFiles = await getHtmlFiles(DIST_DIR);
  console.log(`\nUpdating ${htmlFiles.length} HTML files${OBFUSCATE_HTML ? " + obfuscating" : ""}...\n`);

  await Promise.all(
    htmlFiles.map(async htmlPath => {
      let html = await readFile(htmlPath, "utf8");
      let changed = false;

      for (const [oldScope, newScope] of [
        [OLD_SCRAMJET_SCOPE, NEW_SCRAMJET_SCOPE],
        [OLD_DYNAMIC_SCOPE, NEW_DYNAMIC_SCOPE],
        [OLD_UV_SCOPE, NEW_UV_SCOPE],
      ]) {
        const updated = replaceAll(html, oldScope, newScope);
        if (updated !== html) {
          html = updated;
          changed = true;
        }
      }

      for (const [original, newPublicPath] of allRenames) {
        const pattern = new RegExp(`((?:src|href)=["'])[^"']*${escapeRegex(original)}(["'])`, "g");
        const updated = html.replace(pattern, `$1${newPublicPath}$2`);
        if (updated !== html) {
          html = updated;
          changed = true;
        }
      }

      if (OBFUSCATE_HTML) {
        const obfuscated = await obfuscateHtml(html);
        if (obfuscated !== html) {
          html = obfuscated;
          changed = true;
        }
      }

      if (changed) {
        await writeFile(htmlPath, html, "utf8");
        console.log(chalk.green(`  + ${path.relative(DIST_DIR, htmlPath)}${OBFUSCATE_HTML ? " (html-obfuscated)" : ""}`));
      } else {
        console.log(chalk.gray(`  - ${path.relative(DIST_DIR, htmlPath)} (no changes)`));
      }
    }),
  );

  const allJs = await getJsFiles(DIST_DIR);
  const otherJs = allJs.filter(f => !f.startsWith(jsDirFull) && !f.startsWith(dynDirFull) && !f.startsWith(JS_DIR) && !f.startsWith(UV_DIR) && !f.startsWith(DYNAMIC_DIR));

  if (otherJs.length) {
    console.log(`\nUpdating ${otherJs.length} other JS files...\n`);
    await Promise.all(
      otherJs.map(async jsPath => {
        const content = await readFile(jsPath, "utf8");
        let updated = content;
        updated = replaceAll(updated, OLD_SCRAMJET_SCOPE, NEW_SCRAMJET_SCOPE);
        updated = replaceAll(updated, OLD_DYNAMIC_SCOPE, NEW_DYNAMIC_SCOPE);
        updated = replaceAll(updated, OLD_UV_SCOPE, NEW_UV_SCOPE);
        updated = replaceAll(updated, OLD_UV_PREFIX, NEW_UV_FILE_PREFIX);
        updated = replaceAll(updated, OLD_DYNAMIC_PREFIX, NEW_DYNAMIC_FILE_PREFIX);
        updated = applyRenameMap(updated, allRenames, PROTECTED);
        if (updated !== content) {
          await writeFile(jsPath, updated, "utf8");
          console.log(chalk.green(`  + ${path.relative(DIST_DIR, jsPath)}`));
        }
      }),
    );
  }

  console.log("\nUpdating server routes...\n");
  await updateServerRoutes(NEW_UV_SCOPE, NEW_SCRAMJET_SCOPE, NEW_DYNAMIC_SCOPE);

  console.log(chalk.green("\nBuild complete -> dist/"));
  console.log(chalk.blue(`\nNew scope: ${NEW_UV_SCOPE}  scramjet: ${NEW_SCRAMJET_SCOPE}  dynamic: ${NEW_DYNAMIC_SCOPE}`));
}

build().catch(err => {
  console.error(chalk.red("\nBuild failed:"), err);
  process.exit(1);
});
