// Every node is deterministic: no model call, so this can never fail to answer,
// costs nothing to run, and every path lands on a real price or a real link.
const LINKS = {
  powerHour:     "https://buy.stripe.com/4gM14ndjk68B13Wd8RaMU1G",
  sprintDeposit: "https://buy.stripe.com/bJe6oH6UW68BaEwgl3aMU0p",
  continuation:  "https://buy.stripe.com/00w7sL7Z0gNf2808SBaMU1d",
  summonFounding:"https://buy.stripe.com/6oUaEX2EG2Wp9Asgl3aMU1g",
  playbook:      "https://buy.stripe.com/fZu5kDbbc2WpdQIc4NaMU0J",
  bindingGoal:   "https://buy.stripe.com/9B69ATgvw68B9As0m5aMU0D",
  call:          "https://cal.com/adamtpang",
  email:         "mailto:adamtpang@gmail.com"
};

const TREE = {
  root: {
    reply: "<p>Hey, I'm Adam. I build things fast and I only sell what I can actually deliver.</p><p>What brings you here?</p>",
    chips: ["build","stuck","earn","spend","hire","who"]
  },

  build: {
    say: "I need something built",
    reply: "<p>Good, that is the main thing I do. How big is it?</p>",
    chips: ["build_small","build_thing","build_ongoing"]
  },
  build_small: {
    say: "Small, I'm just stuck",
    reply: "<p><strong>Power hour, <span class='price'>$199</span>.</strong> One live call, we build on your actual problem together, and you keep everything we make. Booked within the week, done in an hour.</p><p>If the hour ships nothing you can point at, it is free.</p>",
    ctas: [["Book the hour · $199",LINKS.powerHour],["Talk it through first",LINKS.call]],
    chips: ["build_thing","back"]
  },
  build_thing: {
    say: "One real thing, shipped",
    reply: "<p><strong>Build sprint, <span class='price'>$1,500</span>.</strong> The one thing you have wanted built, shipped working in about 7 days, live at a URL you own. You own the code, the repo, and the deploy.</p><p>Scoped the same day you ask. A <span class='price'>$750</span> deposit books the slot, the rest is due on delivery, and if I miss the scope we agreed you do not pay the rest.</p>",
    ctas: [["Book a sprint · $750 deposit",LINKS.sprintDeposit],["Ask me first",LINKS.email]],
    chips: ["build_ongoing","back"]
  },
  build_ongoing: {
    say: "It needs to stay alive after",
    reply: "<p><strong>Continuation, <span class='price'>$750/mo</span>.</strong> The thing we shipped stays alive and keeps improving: fixes, updates, and one new improvement a month, without you managing anyone.</p><p>Starts the day your sprint ships. Cancel any time.</p>",
    ctas: [["Start continuation · $750/mo",LINKS.continuation]],
    chips: ["build_thing","back"]
  },

  stuck: {
    say: "I don't know what to work on",
    reply: "<p>That is the expensive kind of stuck. Is it the company, or is it you?</p>",
    chips: ["stuck_company","stuck_life"]
  },
  stuck_company: {
    say: "The company",
    reply: "<p><strong>Summon.</strong> Your company gets an AI org: eight department heads, a ranked task board, and a loop that names the single constraint holding everything else back. You stay the board, and nothing ships without you.</p><p><span class='price'>$500</span> once to set it up, then <span class='price'>$99/mo</span> locked for life. Cancel any time.</p>",
    ctas: [["Set up Summon",LINKS.summonFounding],["Talk it through first",LINKS.call]],
    chips: ["stuck_life","back"]
  },
  stuck_life: {
    say: "Honestly, me",
    reply: "<p><strong>The binding goal, <span class='price'>$29</span>.</strong> We write the one goal that actually binds your next year, then the single next move, so you stop optimizing things that do not matter.</p><p>If you want the free version first, moneymeta ranks every way to make money by the real data.</p>",
    ctas: [["Find the binding goal · $29",LINKS.bindingGoal],["Free: the money board","https://moneymeta.fun"]],
    chips: ["earn","back"]
  },

  earn: {
    say: "I want to make more money",
    reply: "<p>Start free. <strong>moneymeta.fun</strong> ranks every way to make money S to D from public BLS data, with two lenses: what you can start today with no capital, and what has the highest ceiling.</p><p>Only 2 of 90 paths make S tier once you weight barrier to entry. That is the useful part.</p>",
    ctas: [["Open the board (free)","https://moneymeta.fun"],["The weekly report","https://moneymeta.fun/report"]],
    chips: ["earn_faster","spend","back"]
  },
  earn_faster: {
    say: "Faster than that",
    reply: "<p>Then it is a service, not a product. The fastest money is selling a skill you already have to someone who already knows you.</p><p>The <strong>founder playbook, <span class='price'>$29</span></strong>, is how I do that, written down. Or book the hour and we find your version live.</p>",
    ctas: [["Get the playbook · $29",LINKS.playbook],["Book the hour",LINKS.call]],
    chips: ["build_thing","back"]
  },

  spend: {
    say: "I want to spend less",
    reply: "<p><strong>deathmoney.fyi</strong>, free. Upload a statement, it reads your real burn and tells you the date your debt hits zero at your current pace, plus the one line to cut to pull that date closer.</p><p>I built it while digging out of $13k in card debt. It is the tool I needed.</p>",
    ctas: [["Find your number (free)","https://deathmoney.fyi"]],
    chips: ["earn","back"]
  },

  hire: {
    say: "Something about hiring",
    reply: "<p>Two sides of the same market. Are you hiring, or looking?</p>",
    chips: ["hire_company","hire_me"]
  },
  hire_company: {
    say: "I'm hiring",
    reply: "<p><strong>darktalent.tech</strong> scores people on demonstrated public output instead of resumes, so you read five real signals instead of five hundred PDFs.</p>",
    ctas: [["See darktalent","https://darktalent.tech"]],
    chips: ["hire_me","back"]
  },
  hire_me: {
    say: "I'm looking for work",
    reply: "<p><strong>skill.supply</strong>, free and staying free. It writes the job description you should be hired into, then scores real live openings against it. No signup, and the report lives in the link so you own it.</p>",
    ctas: [["Run your report (free)","https://skill.supply"]],
    chips: ["hire_company","back"]
  },

  who: {
    say: "Who are you?",
    reply: "<p>Adam Pangelinan. From Guam, currently in Malaysia. I ship a lot: dozens of live products, mostly built solo with AI.</p><p>Straight with you: those products have earned <span class='price'>$147</span> total, from 2 real customers. I am very good at building and I have been bad at asking. This page is me fixing the second part.</p><p>So everything here has a real price and a real date, and nothing claims to be bigger than it is.</p>",
    ctas: [["My site","https://adampang.com"],["The plain menu","/menu.html"]],
    chips: ["build","stuck","back"]
  },

  back: {
    say: "Show me the other options",
    reply: "<p>Sure. What do you need?</p>",
    chips: ["build","stuck","earn","spend","hire","who"]
  }
};

const thread = document.getElementById("thread");
// The static menu above is real fallback content for crawlers and no-JS
// visitors (raw HTML has no other way to see the offers, since the chat
// below is rendered entirely by this script). Once JS runs, clear it and
// hand off to the normal interactive thread so nothing renders twice.
thread.innerHTML = "";

function el(tag, cls, html){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function scrollDown(){
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
}

function renderNode(key){
  const node = TREE[key];
  if (!node) return;

  const bubble = el("div", "msg them", node.reply);

  if (node.ctas){
    const row = el("div", "chips");
    row.classList.add("cta-row");
    node.ctas.forEach(([label, href], i) => {
      const a = el("a", i === 0 ? "cta" : "cta ghost", label);
      a.href = href;
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      row.appendChild(a);
    });
    bubble.appendChild(row);
  }
  thread.appendChild(bubble);

  if (node.chips && node.chips.length){
    const row = el("div", "chips");
    node.chips.forEach(k => {
      const child = TREE[k];
      if (!child) return;
      const b = el("button", "chip", child.say || k);
      b.type = "button";
      b.addEventListener("click", () => {
        row.remove();
        thread.appendChild(el("div", "msg me", child.say || k));
        setTimeout(() => renderNode(k), 160);
        scrollDown();
      });
      row.appendChild(b);
    });
    thread.appendChild(row);
  }
  scrollDown();
}

renderNode("root");
