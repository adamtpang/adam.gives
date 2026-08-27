import { writeFileSync } from "node:fs";

const devtoolsUrl = process.env.DEVTOOLS_URL ?? "http://127.0.0.1:9223";
const pageUrl = process.env.PAGE_URL ?? "http://127.0.0.1:4173/";
const screenshotPath = process.env.SCREENSHOT_PATH;
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const target = await fetch(`${devtoolsUrl}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" })
  .then((response) => response.json());
if (!target.webSocketDebuggerUrl) throw new Error("No browser page target was available");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const events = [];

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  } else {
    events.push(message);
  }
});

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await Promise.all([
  send("Page.enable"),
  send("Runtime.enable"),
  send("Log.enable"),
  send("Network.enable")
]);
await send("Page.navigate", { url: pageUrl });

for (let attempt = 0; attempt < 50; attempt += 1) {
  if (await evaluate('document.readyState === "complete"')) break;
  await sleep(100);
}
await sleep(500);

const initial = await evaluate(`(() => ({
  title: document.title,
  h1: document.querySelectorAll("h1").length,
  fallbackPresent: Boolean(document.getElementById("staticFallback")),
  buttons: [...document.querySelectorAll("button")].map((button) => ({ text: button.textContent.trim(), type: button.type })),
  ctas: document.querySelectorAll("a.cta").length
}))()`);

const browserHashes = await evaluate(`(async () => {
  const hash = async (value) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return "sha256-" + btoa(String.fromCharCode(...new Uint8Array(digest)));
  };
  return {
    scripts: await Promise.all([...document.scripts].map((node) => hash(node.textContent))),
    styles: await Promise.all([...document.querySelectorAll("style")].map((node) => hash(node.textContent))),
    styleAttributes: await Promise.all([...document.querySelectorAll("[style]")].map((node) => hash(node.getAttribute("style"))))
  };
})()`);

if (process.env.HASH_ONLY === "1") {
  const hashErrors = events
    .filter((event) => event.method === "Runtime.exceptionThrown" || (event.method === "Log.entryAdded" && event.params.entry.level === "error"))
    .map((event) => event.method === "Runtime.exceptionThrown" ? event.params.exceptionDetails.text : event.params.entry.text);
  console.log(JSON.stringify({ initial, browserHashes, errors: hashErrors }, null, 2));
  socket.close();
  process.exit(hashErrors.length ? 1 : 0);
}

await evaluate("document.body.focus()");
const tabStops = [];
for (let index = 0; index < 12; index += 1) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  const focused = await evaluate(`(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName,
      text: (element.textContent || "").trim().slice(0, 80),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth
    };
  })()`);
  tabStops.push(focused);
  if (focused.tag === "BUTTON") break;
}

const buttonFocus = tabStops.find((stop) => stop.tag === "BUTTON");
if (buttonFocus) {
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "char", key: "Enter", code: "Enter", text: "\r", unmodifiedText: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await sleep(350);
}

const afterEnter = await evaluate(`(() => ({
  userMessages: [...document.querySelectorAll(".msg.me")].map((node) => node.textContent.trim()),
  buttonCount: document.querySelectorAll("button").length
}))()`);

if (screenshotPath) {
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
}

const errors = events
  .filter((event) => event.method === "Runtime.exceptionThrown" || (event.method === "Log.entryAdded" && event.params.entry.level === "error"))
  .map((event) => event.method === "Runtime.exceptionThrown" ? event.params.exceptionDetails.text : event.params.entry.text);

const report = { initial, browserHashes, tabStops, afterEnter, errors, screenshot: screenshotPath ?? null };
console.log(JSON.stringify(report, null, 2));

if (initial.h1 !== 1 || initial.fallbackPresent || initial.buttons.length !== 6) {
  throw new Error(`Unexpected initial DOM: ${JSON.stringify(initial)}`);
}
if (!buttonFocus || buttonFocus.outlineStyle === "none" || buttonFocus.outlineWidth === "0px") {
  throw new Error(`Keyboard focus ring missing: ${JSON.stringify(tabStops)}`);
}
if (afterEnter.userMessages.length !== 1) {
  throw new Error(`Enter did not activate the focused choice: ${JSON.stringify(afterEnter)}`);
}
if (errors.length) throw new Error(`Browser errors: ${JSON.stringify(errors)}`);
socket.close();
