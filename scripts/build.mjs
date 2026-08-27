import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "public");
const publicExtensions = new Set([".html", ".jpg", ".txt", ".xml"]);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const name of readdirSync(root)) {
  if (publicExtensions.has(extname(name))) cpSync(join(root, name), join(output, basename(name)));
}

for (const directory of ["assets", "shots"]) {
  cpSync(join(root, directory), join(output, directory), { recursive: true });
}

console.log(`Built static site in ${output}`);
