import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const htmlFiles = readdirSync(new URL("..", import.meta.url)).filter((name) => name.endsWith(".html"));

function stripNonVisible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|middot|rarr|amp|quot|apos);/gi, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
}

function allMatches(value, expression) {
  return [...value.matchAll(expression)].map((match) => match[1]);
}

function cspHash(value) {
  return `sha256-${createHash("sha256").update(value, "utf8").digest("base64")}`;
}

test("homepage exposes complete metadata and one meaningful H1", () => {
  const html = read("index.html");
  assert.match(html, /<html\s+lang="en">/i);

  const titles = allMatches(html, /<title>([\s\S]*?)<\/title>/gi).map(stripNonVisible);
  assert.equal(titles.length, 1);
  assert.ok(titles[0].length >= 20 && titles[0].length <= 65, `title length was ${titles[0].length}`);

  const descriptions = allMatches(html, /<meta\s+name="description"\s+content="([^"]+)"\s*\/?>/gi);
  assert.equal(descriptions.length, 1);
  assert.ok(descriptions[0].length >= 70 && descriptions[0].length <= 170, `description length was ${descriptions[0].length}`);

  const canonicals = allMatches(html, /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/gi);
  assert.deepEqual(canonicals, ["https://adam.gives/"]);

  const headings = allMatches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map(stripNonVisible);
  assert.equal(headings.length, 1);
  assert.ok(headings[0].length > 0);
});

test("homepage is substantive and actionable without JavaScript", () => {
  const html = read("index.html");
  const visible = stripNonVisible(html);
  assert.ok(visible.length >= 700, `visible character count was ${visible.length}`);
  assert.ok(words(visible).length >= 250, `visible word count was ${words(visible).length}`);

  const paragraphs = allMatches(html, /<p\b[^>]*>([\s\S]*?)<\/p>/gi).map(stripNonVisible).filter(Boolean);
  const standalone = paragraphs.filter((paragraph) => words(paragraph).length >= 12);
  assert.ok(standalone.length / paragraphs.length >= 0.35, "fewer than 35% of paragraphs are self-contained");

  assert.match(html, /<a\s+class="cta"\s+href="https:\/\/buy\.stripe\.com\/[^"]+">Book a build sprint · \$750 deposit<\/a>/i);
});

test("homepage structured data identifies the real operator and page", () => {
  const html = read("index.html");
  const blocks = allMatches(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  assert.equal(blocks.length, 1);
  const data = JSON.parse(blocks[0]);
  const graph = data["@graph"];
  assert.ok(Array.isArray(graph));
  assert.ok(graph.some((node) => node["@type"] === "Organization" && node.name === "Anchor Marianas LLC"));
  assert.ok(graph.some((node) => node["@type"] === "WebSite"));
  assert.ok(graph.some((node) => node["@type"] === "WebPage" && node.url === "https://adam.gives/"));
});

test("all public HTML uses one H1 and a valid heading hierarchy", () => {
  for (const file of htmlFiles) {
    const html = read(file);
    const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
    assert.equal(levels.filter((level) => level === 1).length, 1, `${file} must contain one H1`);
    for (let index = 1; index < levels.length; index += 1) {
      assert.ok(levels[index] - levels[index - 1] <= 1, `${file} jumps from H${levels[index - 1]} to H${levels[index]}`);
    }
  }
});

test("About, Contact, and Privacy are substantial first-party pages linked from home", () => {
  const home = read("index.html");
  for (const route of ["about", "contact", "privacy"]) {
    assert.match(home, new RegExp(`href="/${route}"`));
    const page = read(`${route}.html`);
    assert.ok(words(stripNonVisible(page)).length >= 250, `${route}.html is under 250 visible words`);
    assert.match(page, new RegExp(`<link\\s+rel="canonical"\\s+href="https://adam\\.gives/${route}"`));
  }
});

test("robots, llms guidance, and sitemap expose crawler discovery", () => {
  const robots = read("robots.txt");
  for (const bot of ["GPTBot", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Google-Extended"]) {
    assert.match(robots, new RegExp(`User-agent: ${bot}\\s+Allow: /`, "i"));
  }
  assert.match(robots, /Sitemap: https:\/\/adam\.gives\/sitemap\.xml/i);

  const llms = read("llms.txt");
  assert.ok(words(llms).length >= 150);
  for (const route of ["about", "contact", "privacy", "terms"]) assert.match(llms, new RegExp(`https://adam\\.gives/${route}`));

  const sitemap = read("sitemap.xml");
  for (const route of ["", "menu", "studio", "playbook", "about", "contact", "privacy", "terms"]) {
    assert.match(sitemap, new RegExp(`<loc>https://adam\\.gives/${route}</loc>`));
  }
});

test("all local links resolve and images have accessible alternatives", () => {
  for (const file of htmlFiles) {
    const html = read(file).replace(/<!--[\s\S]*?-->/g, "");
    for (const target of allMatches(html, /\s(?:href|src)="([^"]+)"/gi)) {
      if (/^(?:https?:|mailto:|data:|#)/i.test(target)) continue;
      const clean = target.split(/[?#]/)[0];
      if (!clean) continue;
      const relative = clean.startsWith("/") ? clean.slice(1) : clean;
      const candidates = relative === "" ? ["index.html"] : [relative, `${relative}.html`, `${relative}/index.html`];
      assert.ok(candidates.some((candidate) => existsSync(new URL(`../${candidate}`, import.meta.url))), `${file} has missing local target ${target}`);
    }

    for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
      assert.match(image[1], /\salt="[^"]+"/i, `${file} has an image without non-empty alt text`);
    }

    for (const anchor of html.matchAll(/<a\b([^>]*)>/gi)) {
      if (/\starget="_blank"/i.test(anchor[1])) assert.match(anchor[1], /\srel="[^"]*noopener[^"]*"/i, `${file} has target=_blank without noopener`);
    }
  }
});

test("Vercel config sets restrictive security and MIME headers with complete CSP hashes", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.deepEqual(config.rewrites, [{ source: "/", destination: "/index.html" }]);
  const global = config.headers.find((entry) => entry.source === "/(.*)");
  assert.ok(global);
  const headers = Object.fromEntries(global.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(headers["x-frame-options"], "DENY");
  assert.ok(headers["strict-transport-security"].includes("includeSubDomains"));

  const csp = headers["content-security-policy"];
  assert.ok(csp);
  assert.doesNotMatch(csp, /(?:^|\s)\*(?:\s|;|$)/);
  assert.doesNotMatch(csp, /'unsafe-inline'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);

  for (const file of htmlFiles) {
    const html = read(file);
    for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/\bsrc="/i.test(script[1])) assert.ok(csp.includes(cspHash(script[2])), `${file} has an unhashed inline script`);
    }
    for (const block of allMatches(html, /<style\b[^>]*>([\s\S]*?)<\/style>/gi)) assert.ok(csp.includes(cspHash(block)), `${file} has an unhashed inline style block`);
    for (const attribute of allMatches(html, /\sstyle="([^"]*)"/gi)) assert.ok(csp.includes(cspHash(attribute)), `${file} has an unhashed style attribute`);
  }

  const root = config.headers.find((entry) => entry.source === "/");
  const rootHeaders = Object.fromEntries(root.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(rootHeaders["content-type"], "text/html; charset=utf-8");
});
