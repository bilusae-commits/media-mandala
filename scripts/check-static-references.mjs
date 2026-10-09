import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", ".next", "dist", "build"]);
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:html?|css)$/i.test(entry.name)) sourceFiles.push(full);
  }
}
walk(root);
const exists = (relative) => {
  const candidate = path.resolve(root, relative);
  return candidate.startsWith(root + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
};
const failures = [];
let checked = 0;
function checkReference(file, reference, kind) {
  let ref = String(reference || "").trim();
  if (!ref || ref === "#" || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref) ||
      ref.startsWith("#") || ref.startsWith("?") || ref.startsWith("var(") || ref === "none" ||
      ref.includes("${") || ref.includes("{{") || ref.includes("}}")) return;
  ref = ref.split("#", 1)[0].split("?", 1)[0].trim();
  if (!ref || ref.startsWith("data:") || ref.startsWith("blob:")) return;
  try { ref = decodeURIComponent(ref); } catch {}
  if (ref.startsWith("/")) {
    failures.push({ file: path.relative(root, file), kind, ref, reason: "root-relative URL bypasses the GitHub Pages project base path" });
    return;
  }
  const relativeFile = path.relative(root, file).split(path.sep).join("/");
  const dir = path.posix.dirname(relativeFile);
  const joined = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, ref));
  if (joined === ".." || joined.startsWith("../")) {
    failures.push({ file: relativeFile, kind, ref, reason: "path escapes repository root" });
    return;
  }
  const candidates = [joined, joined.endsWith("/") ? joined + "index.html" : path.posix.join(joined, "index.html")];
  checked++;
  if (!candidates.some(exists)) failures.push({ file: relativeFile, kind, ref, reason: "target file does not exist in repository" });
}
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (file.endsWith(".html") || file.endsWith(".htm")) {
    for (const match of content.matchAll(/\b(?:href|src|poster|action)=["']([^"']+)["']/gi)) {
      checkReference(file, match[1], match[0].split("=")[0].trim());
    }
  }
  const styleSources = file.endsWith(".css")
    ? [content]
    : [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
  for (const styleSource of styleSources) {
    for (const match of styleSource.matchAll(/url\(\s*(?:"([^"]*)"|\'([^\']*)\'|([^)]*))\s*\)/gi)) {
      checkReference(file, match[1] ?? match[2] ?? match[3], "css-url");
    }
  }
}
console.log(`Static reference audit: ${checked} local references checked across ${sourceFiles.length} HTML/CSS files.`);
if (failures.length) {
  console.error(`Found ${failures.length} broken or unsafe local references:`);
  for (const item of failures) console.error(`- ${item.file}: ${item.kind}="${item.ref}" — ${item.reason}`);
  process.exitCode = 1;
} else {
  console.log("All checked local references resolve to repository files.");
}
