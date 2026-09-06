# Zero to 10X — Playlist Plan

**Series:** Flagship Curriculum (Tier 1)
**Primary Pillar:** Workflow — "How do you manage AI agents on complex projects?"
**Crossover Pillars:** Future (Z1, Z40), Delivery (Z19–Z26, Z39)
**Episodes:** 40
**Target Length:** 15–25 min per episode
**Status:** Planning

---

## Positioning

The most common reaction to AI-assisted development is some version of "I wish I'd had this when I was learning." This curriculum is that wish, delivered. Forty episodes that take someone with zero coding experience to a proficient AI developer — not by teaching them to type every character, but by teaching them the judgment layer that AI still can't replace.

Professor Messer built the most-watched IT certification training on the internet by treating a structured curriculum as a public good. Free. Comprehensive. Sequenced. Exam-coded. This playlist applies the same model to AI-era software development. Sequential. Free on YouTube. Every episode builds on the last.

The thesis: becoming a "developer" used to mean learning to type code that runs. It now means learning to direct AI agents, review their output critically, and supply the judgment that context windows can't hold. That's a different skillset. It's teachable. It's what this curriculum teaches.

### Target Audience

- Complete beginners who want to "learn to code" in 2026 and don't know where to start
- Career changers who tried a traditional bootcamp, found it outdated, and bounced
- Self-taught developers who built things with AI but feel the gaps — "I can ship but I don't always understand why it works"
- Junior developers who want the judgment layer that separates "uses AI" from "proficient with AI"
- Engineering managers who want to understand what "proficient AI developer" actually means on their team

### What This Playlist Is NOT

- Not a traditional bootcamp ("here's how to write a for loop from scratch, 40 times over")
- Not an AI hype course ("prompts that will 10x your output!")
- Not a cert-exam cram course — no single exam, no artificial gatekeeping
- Not a replacement for experience — this gets you to proficient, not senior. Seniority is years, not episodes.

---

## Playlist Arc

| Act | Episodes | Purpose |
|-----|----------|---------|
| 1: Orientation | Z1–Z5 | What coding is. What AI changed. Mental models. Environment setup. |
| 2: The Tools | Z6–Z10 | Terminal, editor, git, browser devtools, AI coding tools. The professional environment. |
| 3: The Fundamentals | Z11–Z18 | Core programming concepts learned with AI as partner and critical review as discipline. |
| 4: Your First App | Z19–Z26 | End-to-end web app: frontend, backend, database, deploy. Real code shipped. |
| 5: The Judgment Layer | Z27–Z34 | Human-level skills AI can't provide. **This is where Agent Team Tactics T8 points.** |
| 6: The 10X Moment | Z35–Z40 | Shipping as a professional. Managing AI agents. The Travis Gautier Pipeline as graduation project. |

---

## Episode Plans

### ACT 1: ORIENTATION

---

### Z1 — "Why This Curriculum Exists"

**Runtime target:** 15–18 min
**Pillar:** Future
**Search intent:** "learn to code 2026," "AI developer curriculum," "how to become a developer with AI," "is it too late to learn programming"

**GATEWAY EPISODE — the curriculum's top-of-funnel. Designed to reach complete beginners via YouTube search.**

**Prerequisites:** None. This is the entry point.

**Learning objectives (by end of episode):**
- Understand why "zero to proficient" is a realistic goal in 2026
- Know exactly what the curriculum covers and what it doesn't
- Be able to decide whether to continue or look elsewhere

#### Thesis
Becoming a developer used to mean a four-year CS degree or a $15,000 bootcamp. Neither promised a job and neither covered what developers actually do in 2026. This curriculum is the free, comprehensive, judgment-focused alternative. It's not faster — it's different.

#### Outline
1. **The state of the landscape** (2–3 min) — What changed in the last three years: AI can now produce working code from natural language prompts; the bottleneck shifted from "can you type code" to "can you direct, review, and judge it." Show screen recordings of AI producing a real feature in minutes.
2. **Why this curriculum is free** (2 min) — The Professor Messer model: free comprehensive training as a public good. No paywall on learning. Monetization (if any) comes from adjacent services, not gatekept fundamentals.
3. **What you'll be able to do at Z40** (3–4 min) — Concrete outcomes: build and deploy a web app from scratch, review AI-generated code critically, debug state-shaped bugs, make architecture decisions, work professionally as a developer who uses AI rather than fears it.
4. **What this won't teach you** (2–3 min) — Honest limits: this won't make you a senior engineer (that's years), won't make you a specialist (that's focus), won't guarantee a job (that's market). This is the foundation, not the finish.
5. **The curriculum map** (3 min) — Walk through the 6 acts. What each one does. How they build on each other. Point at Act 5 specifically: "this is the part most courses skip."
6. **How to use this curriculum** (2 min) — Sequential is the intended order. Skipping is allowed but costly. Pair episodes with practice. Use the companion repo. The community discussion happens in [venue TBD].
7. **Close** (60s) — "Forty episodes from here. Free forever. I'm going to teach you to be a developer in 2026 — what that actually means, not what the bootcamp marketing says it means."

#### Key visuals
- Curriculum roadmap graphic (all 40 episodes on one map)
- Comparison: traditional bootcamp pricing vs free YouTube
- Screen recording: AI producing working code from a prompt (hook moment)
- Act 5 highlighted on the map — "the part that matters most"

#### Source materials
- The full curriculum plan (this document)
- Bootcamp pricing data (CourseReport, 2026 figures)
- AI coding adoption surveys (Stack Overflow Developer Survey, 2026)

#### Shorts potential
- "Zero coding experience to proficient AI developer. 40 episodes. Free forever. Starts today."
- "Bootcamps cost $15,000. This curriculum costs zero. Professor Messer proved free works. This is the same model."
- "Most courses teach you to type code. This one teaches you to direct AI and review what it produces. Different skillset."

---

### Z2 — "What Code Actually Is"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "what is code," "programming for beginners," "what is programming," "how does a computer work"

**Prerequisites:** None.

**Learning objectives:**
- Explain what code is in one sentence to a non-technical person
- Understand what a computer actually does when it runs a program
- Recognize that programming languages are just instruction formats

#### Thesis
Code is instructions. A computer is a machine that follows instructions very fast and very literally. A programmer writes instructions a computer can follow. Everything else is detail on top of that foundation.

#### Outline
1. **The kitchen recipe analogy** (2 min) — A recipe is instructions for a human. Code is instructions for a computer. Same idea, different audience. Show a recipe and a tiny program side by side.
2. **What a computer actually does** (3–4 min) — The core loop: read an instruction, execute it, move to the next. That's the whole trick. "Fast + literal" is the machine's only superpower.
3. **Why we don't write binary** (2–3 min) — The layering: binary → assembly → high-level languages → frameworks → AI. Each layer makes it easier to express intent. AI is the newest layer.
4. **A 5-line program walkthrough** (3–4 min) — Show a tiny JavaScript program. Read it line by line. Run it. "That's programming. Everything else is bigger versions of this."
5. **What makes a good programmer** (2–3 min) — Not typing speed. Not memorization. Clear thinking, careful reading, honest testing. These predate AI. They survive AI.
6. **Close** (60s) — "Next episode: what AI changed about all of this."

#### Key visuals
- Recipe-vs-code split screen
- The read-execute-next loop animated
- Layering diagram (binary → assembly → JS → React → AI)
- Live terminal: running a 5-line JS program

#### Source materials
- A simple JavaScript snippet (print Fibonacci, etc.) — create and link
- The layering diagram as a downloadable asset

#### Shorts potential
- "Code is a recipe for a machine that follows instructions very fast and very literally. That's the whole trick."
- "What makes a good programmer isn't typing speed. It's clear thinking and careful reading. Those skills predate AI."

---

### Z3 — "What AI Changed"

**Runtime target:** 15–18 min
**Pillar:** Future
**Search intent:** "AI programming 2026," "is AI replacing programmers," "how has AI changed coding," "AI pair programming"

**Prerequisites:** Z2.

**Learning objectives:**
- Articulate what changed about development after 2022
- Distinguish "AI replaces developers" hype from "AI changes what developers do"
- Understand why the skillset shifted rather than shrank

#### Thesis
Before 2022, writing software meant typing every character. After 2022, it increasingly means directing an AI agent that types for you, then reviewing what it produced. The skillset shifted. It didn't shrink. New skills arrived (prompting, reviewing AI output, judgment at scale). Old skills stayed (systems thinking, debugging, architecture). The combined skillset is larger than before.

#### Outline
1. **Quick history** (2 min) — Punchcards → keyboards → IDEs → autocomplete → Copilot → Claude/ChatGPT coding → Claude Code agents. Each step made expressing intent easier.
2. **The shift, named** (3 min) — "Code author" → "code director." You're not typing every character. You're specifying what you want, reviewing what the AI produced, and correcting course. Like working with a very fast junior.
3. **What AI does well** (3 min) — Enumeration, pattern matching, boilerplate, documentation drafts, test skeletons, working from clear examples. Show real examples.
4. **What AI does badly** (3–4 min) — Judgment calls, novel patterns, state-shaped debugging, scope discipline, business-domain context. Preview Act 5. "This is why Act 5 exists."
5. **The new skillset map** (2 min) — Old skills that stayed: systems thinking, debugging, architecture, code reading. New skills: prompting, AI output review, context management, delegation at scale.
6. **Why this is good news for learners** (2 min) — The old moat (type fast, memorize syntax) is gone. The new moat (judgment, critical reading, system thinking) is learnable. This curriculum teaches the new moat directly.
7. **Close** (60s) — "The job didn't go away. It changed. And the new job is more teachable than the old one."

#### Key visuals
- Timeline: punchcards → AI agents
- Author-vs-director diagram
- What AI does well / does badly two-column graphic
- The new skillset map

#### Source materials
- Historical images of programming environments (fair use)
- Real AI output examples showing strengths and weaknesses

#### Shorts potential
- "AI didn't replace programmers. It changed what programmers do. The skillset shifted from 'type fast' to 'direct and judge.'"
- "The old moat was memorizing syntax. The new moat is judgment. Judgment is more teachable than memorization."
- "Autocomplete made typing easier. AI agents made the whole job different."

---

### Z4 — "The Mental Models You Need"

**Runtime target:** 18–20 min
**Pillar:** Workflow
**Search intent:** "computational thinking," "how programmers think," "systems thinking for beginners," "programming mental models"

**Prerequisites:** Z2, Z3.

**Learning objectives:**
- Apply decomposition, abstraction, and pattern recognition to a non-code problem
- Recognize state-over-time as a core programming mental model
- Begin building the habit of thinking before typing (or prompting)

#### Thesis
Two mental models do most of the work in programming: **computational thinking** (decomposition, abstraction, pattern recognition) and **systems thinking** (cause, effect, state over time). Build these early and they transfer to every language, every framework, every AI tool, forever.

#### Outline
1. **Why mental models matter** (90s) — The difference between "I can get AI to produce working code" and "I understand what's happening." The second one is what lets you catch bugs, evolve systems, and make architecture calls.
2. **Computational thinking, part 1: decomposition** (3 min) — Break a big problem into smaller ones. Demo with a non-code problem (e.g., planning a birthday party). Same move in code: big feature → smaller features → individual functions.
3. **Computational thinking, part 2: abstraction** (3 min) — What's the simplest version of this that still works? Hide the details until you need them. Functions, components, modules — all abstractions.
4. **Computational thinking, part 3: pattern recognition** (3 min) — "Have I seen something like this before?" Noticing that a problem is structurally the same as one you already solved. AI is pattern recognition at scale — you need to recognize patterns to review its output.
5. **Systems thinking: state over time** (4 min) — A program isn't a snapshot. It's state that changes over time in response to events. Demo with a simple state diagram. This is the mental model that makes debugging possible.
6. **Applying the models** (2–3 min) — Take a real problem (e.g., "build a todo list app") and walk through decomposition → abstraction → pattern → state. Show how the mental model produces a plan before any code.
7. **Close** (60s) — "These two mental models are the foundation. If Z40 seems far, every episode between here and there is using these."

#### Key visuals
- Non-code decomposition example (party planning tree)
- State diagram for a simple app (e.g., traffic light)
- Pattern recognition side-by-side (two problems, same structure)
- Mental model poster graphic (downloadable)

#### Source materials
- Classic computational thinking references (Jeannette Wing, 2006 — brief citation)
- Systems thinking examples from non-software domains

#### Shorts potential
- "Two mental models do most of the work in programming. Decomposition: break big into small. State: how things change over time. That's most of it."
- "Before you type or prompt, decompose. Every developer skill downstream depends on this one."

---

### Z5 — "Your Learning Environment"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "set up a developer environment," "VS Code installation," "GitHub setup," "beginner developer setup 2026"

**Prerequisites:** Z1–Z4.

**Learning objectives:**
- Have a working developer machine: editor, terminal, accounts, tools
- Successfully make a first git commit to a remote repository
- Invoke an AI coding tool for the first time

#### Thesis
Environment matters. A working setup is the prerequisite for everything else. By the end of this episode you have: VS Code installed, a GitHub account, access to Claude or another AI coding tool, a Vercel account, and a first commit in a real repository. Nothing exotic, all free.

#### Outline
1. **Why setup now** (90s) — Installing things is boring but foundational. If you skip this, every future episode gets harder. Do it once, never touch it again.
2. **VS Code install + first open** (3–4 min) — Download, install, walk through the first launch. The file explorer, the editor panel, the terminal panel, the extensions panel. What not to customize yet.
3. **GitHub account + first repo** (3 min) — Sign up, verify email, create a first repository named `zero-to-10x-learning`. Public, with a README. Click through it, explain what you're looking at.
4. **AI coding tool setup** (4 min) — Claude account, download Claude Code or equivalent. Why this one for this curriculum. How to invoke it. The first hello-world prompt.
5. **Vercel account** (2 min) — Sign up with GitHub auth. Link to the learning repo. Not deploying yet — just connected.
6. **Terminal + git first commit** (4 min) — Clone the repo. Add a note to the README. Commit. Push. See it on GitHub. "You just used git. It's not that bad."
7. **First AI prompt** (3 min) — Open Claude Code in the repo. Ask it to add a simple HTML file. Watch it produce the file. Don't review it yet — just feel what it's like.
8. **Close** (60s) — "You have a developer setup. Every episode from here uses it. Don't break it. Move on."

#### Key visuals
- Live installation screen recording for VS Code, Claude Code
- GitHub signup walkthrough
- Terminal + VS Code integrated terminal side-by-side
- First commit appearing on GitHub (the dopamine moment)

#### Source materials
- Links to all tools in video description
- Troubleshooting reference doc (create and link)

#### Shorts potential
- "Setting up a developer machine takes 20 minutes and is free. Here's exactly what you need in 2026."
- "VS Code, GitHub, Claude, Vercel. Four accounts. All free. That's your developer environment."

---

### ACT 2: THE TOOLS

---

### Z6 — "The Terminal — Your Most Important Window"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "terminal for beginners," "command line basics," "bash tutorial," "why developers use the terminal"

**Prerequisites:** Z5.

**Learning objectives:**
- Navigate the filesystem with cd, ls, pwd
- Create, move, copy, and delete files and folders from the terminal
- Explain why developers prefer terminal to GUI for many tasks

#### Thesis
The GUI is convenient for casual users. The terminal is where real work happens — faster, scriptable, and the interface every deployment/CI system speaks. You don't need to love it. You need to be fluent enough that it isn't scary.

#### Outline
1. **GUI vs terminal** (2 min) — Why the terminal wins: speed, scripting, remote access, reproducibility. Show the same task (rename 100 files) in both.
2. **Navigation** (3–4 min) — `pwd`, `cd`, `ls`, `ls -la`. The filesystem as a tree. Absolute vs relative paths. Hidden files. Demo: navigate the learning repo from Z5.
3. **File operations** (4 min) — `mkdir`, `touch`, `cp`, `mv`, `rm`. The danger of `rm -rf`. The difference between moving and copying. Demo: organize files in the learning repo.
4. **Reading files** (2–3 min) — `cat`, `less`, `head`, `tail`. When to use each. Demo: read the README, pipe into `less`.
5. **Pipes and redirection** (3 min) — `|`, `>`, `>>`, `<`. The Unix philosophy: small tools, composed. Demo: count lines in a file with `cat file | wc -l`.
6. **Running programs** (2 min) — `node`, `npm`, `git`. What "being on your PATH" means. How to tell if something is installed.
7. **Terminal in VS Code** (90s) — The integrated terminal. Why it matters. Split terminals, multiple tabs.
8. **Close** (60s) — "You don't need to memorize every command. You need to know that the terminal exists and isn't magic. Reference lookups are fine."

#### Key visuals
- Terminal recording: rename 100 files (GUI impossible, terminal in 5 seconds)
- Filesystem tree diagram
- `ls -la` output explained (permissions, dates, sizes)
- Pipe composition examples

#### Source materials
- Terminal cheat sheet (create and link)
- `bash` vs `zsh` vs `fish` brief comparison (Mac default is zsh in 2026)

#### Shorts potential
- "The terminal looks scary. It's five commands you use 90% of the time. Memorize those five."
- "GUI vs terminal: rename 100 files. GUI impossible. Terminal: 5 seconds."
- "`rm -rf` is the delete button with no undo. Respect it, don't fear it."

---

### Z7 — "Your Code Editor — VS Code Fundamentals"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "VS Code tutorial," "VS Code keyboard shortcuts," "VS Code for beginners," "how to use VS Code efficiently"

**Prerequisites:** Z5, Z6.

**Learning objectives:**
- Navigate a codebase using VS Code's file explorer, search, and command palette
- Use split panes and the integrated terminal for real work
- Install and configure essential extensions

#### Thesis
Your editor is your cockpit. Learning it well pays back every day for the rest of your career. Four hours invested in VS Code fluency saves hundreds of hours over the next decade. This episode is that four hours, compressed.

#### Outline
1. **Why the editor matters** (90s) — The compounding returns of editor fluency. The productivity gap between "I know VS Code" and "I type like a beginner every day" is enormous.
2. **File explorer + tabs** (2–3 min) — Open folders, navigate files, the difference between the explorer tree and the open-tabs row. Pinning tabs. Closing everything at once.
3. **The command palette** (4 min) — Cmd/Ctrl+Shift+P. The most important shortcut. Everything VS Code does is in here. Demo: rename symbol, format document, change language mode.
4. **Search** (3 min) — Cmd/Ctrl+F for current file, Cmd/Ctrl+Shift+F for project-wide. Regex search. Replace. Search-and-replace across a whole codebase.
5. **Split panes** (2 min) — Vertical split, horizontal split. Working with two files side-by-side. Why this matters for reviewing AI output against existing code.
6. **Integrated terminal** (2 min) — Cmd/Ctrl+` to open. Multiple terminals. Splitting. When to use integrated vs external.
7. **Essential extensions** (3 min) — Prettier, ESLint, GitLens, the Tailwind extension. What each does. Why you don't need 40 extensions in week one.
8. **Settings sync** (2 min) — Once you customize, sync to GitHub. Never set up a new machine from scratch again.
9. **Close** (60s) — "You'll keep learning VS Code for years. This is the 80% that matters from day one."

#### Key visuals
- Command palette demo (the "everything is here" moment)
- Project-wide search with regex
- Split-pane review (AI output left, existing code right)
- Before/after customization

#### Source materials
- VS Code shortcut cheat sheet (create and link)
- Recommended extensions list

#### Shorts potential
- "Four hours invested in VS Code fluency. Saves hundreds of hours over a decade. Best ROI in development."
- "Cmd+Shift+P opens the command palette. Everything VS Code does lives there. That's the shortcut to learn first."

---

### Z8 — "Git — Save Points for Your Code"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "git for beginners," "git tutorial 2026," "how to use git," "git vs github explained"

**Prerequisites:** Z5, Z6.

**Learning objectives:**
- Initialize, commit, push, and pull a git repository from the command line
- Create, switch, and merge branches
- Recover from the most common mistakes (wrong commit, wrong branch)

#### Thesis
Git is version control. It's also something more: it's the accountability layer for AI-generated code. Every commit is a checkpoint. Every diff is a review opportunity. Every branch is a safe place to experiment. Learn git now and every future episode gets easier — and every AI collaboration gets safer.

#### Outline
1. **Why git** (90s) — Save points for code. The "my laptop died" insurance. The collaboration tool. The rollback button. The reason AI-generated code doesn't terrify you.
2. **git vs GitHub** (2 min) — Git is the version control software. GitHub is a website that hosts git repositories. They're not the same thing. Clear up the confusion now.
3. **Init, add, commit** (4 min) — The three-step loop. `git init`, `git add .`, `git commit -m "message"`. Demo in the learning repo. What each command actually does. The staging area concept.
4. **Commit messages** (2 min) — Why they matter. What a good one looks like. Present tense, short, descriptive. Show good and bad examples.
5. **Push, pull, clone** (3 min) — Talking to the remote. `git push` to send. `git pull` to receive. `git clone` to copy. Demo: push a commit, see it on GitHub.
6. **Branches** (4 min) — Why branches: safe experiments. `git branch`, `git checkout -b`, `git merge`. Demo: make a branch for a feature, commit to it, merge to main.
7. **The undo menu** (3 min) — Common mistakes: wrong commit (`git reset --soft HEAD~1`), wrong branch (`git stash` + `git checkout`), wrong file (`git restore`). Never `rm -rf`. Always `git`.
8. **git and AI** (2 min) — Why commit often when working with AI: every commit is a checkpoint you can roll back to when AI proposes something weird. Show a real example.
9. **Close** (60s) — "You'll use git every day for the rest of your career. These commands cover 90% of daily work. The other 10% you google when you need it."

#### Key visuals
- Staging area diagram (working dir → staging → commit)
- Branch tree diagram (branches and merges)
- Terminal recording: full cycle (init → commit → push → branch → merge)
- Common mistake recovery flowchart

#### Source materials
- git cheat sheet (create and link)
- The Pro Git book (free online) — link for reference

#### Shorts potential
- "Git is save points for your code. Every commit is a checkpoint. Every branch is a safe place to experiment. Learn these commands once."
- "Commit often when working with AI. Every commit is a rollback point if the AI goes weird."

---

### Z9 — "The Browser — More Than Just Viewing"

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Search intent:** "Chrome DevTools tutorial," "browser developer tools," "how to debug a website," "inspect element for beginners"

**Prerequisites:** Z5–Z8.

**Learning objectives:**
- Open and navigate Chrome DevTools
- Inspect HTML elements, read computed CSS, and modify both live
- Read network requests and console output to diagnose issues

#### Thesis
Chrome DevTools is the most underused superpower in web development. It's a live debugger, network inspector, performance profiler, and styling sandbox — all free, all one shortcut away. Every web developer should be fluent. Most aren't.

#### Outline
1. **Opening DevTools** (90s) — F12 or Cmd/Ctrl+Opt+I. The tabs: Elements, Console, Network, Sources, Application, Performance. Which ones you'll use weekly vs yearly.
2. **The Elements tab** (3–4 min) — Inspect any element on any page. See its HTML. See its computed CSS. Modify both live — changes don't persist but they reveal what's possible. Demo on a real website.
3. **The Console tab** (3 min) — See what JavaScript logged. See errors. Run JavaScript against the current page. Demo: `console.log`, running an expression, reading an error stack trace.
4. **The Network tab** (3–4 min) — Every request the page makes, in order, with timing. Status codes. Request/response headers and bodies. Demo: load a page, identify the slow request.
5. **Mobile simulation** (2 min) — Device emulation. Touch events. Why "but it works on my laptop" is never an acceptable answer.
6. **The secret: DevTools on your own code** (2 min) — The real power is using DevTools on the app you just built. Your console.logs. Your fetch requests. Your CSS. Demo on the learning repo's first HTML file.
7. **Close** (60s) — "DevTools is free. It's always there. Most developers use 10% of it. Get comfortable in the Elements, Console, and Network tabs and you're ahead of most."

#### Key visuals
- DevTools tab overview (screenshot annotated)
- Live element inspection: change a CSS color, watch it update
- Network tab during page load (waterfall)
- Mobile device simulation

#### Source materials
- Chrome DevTools official docs (link)
- A sample page with intentional bugs (create and link)

#### Shorts potential
- "Chrome DevTools is free. It's already installed. Most developers use 10% of it. Learn the Elements, Console, and Network tabs — you're ahead of most."
- "Every web bug can be debugged in DevTools. Inspect, check the console, read the network. That's the loop."

---

### Z10 — "AI Coding Tools — Claude Code, Cursor, Copilot"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "Claude Code tutorial," "Cursor vs Copilot," "AI coding tools 2026," "which AI coding tool to use"

**Prerequisites:** Z5–Z9.

**Learning objectives:**
- Name the major AI coding tools in 2026 and when each fits
- Invoke Claude Code to make a real code change in the learning repo
- Articulate why the curriculum is tool-agnostic in principle but Claude Code in practice

#### Thesis
The AI coding tool landscape in 2026 is large and moves fast. The principles in this curriculum work across all of them. The demos use Claude Code because that's the tool the channel uses. If you prefer Cursor, Copilot, Codex, or Aider, almost everything transfers.

#### Outline
1. **The landscape** (3 min) — Claude Code (Anthropic), Cursor (the fork of VS Code), GitHub Copilot (the autocomplete-plus incumbent), Codex (OpenAI's offering), Aider (open-source terminal tool). What each one does differently. Brief demo of each.
2. **Why Claude Code for this curriculum** (2 min) — Agent-based model, integrates with skills/YAML/pipeline content, used by the channel, free tier suitable for learning. "Not a sponsorship. Just the one I use."
3. **The three interaction modes** (3–4 min) — Chat (back-and-forth), edit (point at a file and say change X), agent (autonomous multi-step). When each one is right. Demo each in the learning repo.
4. **Your first real AI change** (4 min) — Open the learning repo. Ask Claude Code to add a simple landing page with a heading and three paragraphs. Watch it produce the files. Run it. "That's the loop."
5. **What to do when it goes wrong** (2–3 min) — AI produces something weird. You correct it: be more specific, provide more context, give an example, reset and try again. Demo a correction flow.
6. **Tool portability** (2 min) — The prompting principles, the review checklist (T2 preview), the context management practices — all transfer across tools. Don't get locked into tool-specific workflows.
7. **Close** (60s) — "Every episode from here assumes you can invoke an AI coding tool. The specifics are yours to pick. The principles are universal."

#### Key visuals
- Tool comparison table (Claude Code, Cursor, Copilot, Codex, Aider)
- Live terminal: Claude Code making a first code change
- The three interaction modes diagram
- Correction flow (weird output → better prompt → fixed output)

#### Source materials
- Official docs for each tool
- The learning repo with the first AI-generated landing page (commit and link)

#### Shorts potential
- "Five AI coding tools to know in 2026. I use Claude Code. Pick whichever. Principles transfer."
- "When AI produces something weird: more context, clearer example, or reset and retry. Don't argue with it."

---

### ACT 3: THE FUNDAMENTALS

---

### Z11 — "Variables and Data Types"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "JavaScript variables," "JavaScript data types," "const vs let," "programming variables for beginners"

**Prerequisites:** Z1–Z10.

**Learning objectives:**
- Declare and use variables (`const`, `let`) correctly
- Identify the core JavaScript data types and their gotchas
- Review AI-generated variable code for common mistakes

#### Thesis
Variables are named storage for values. Data types define what kinds of values they hold. The concepts are simple. The mistakes are common and specific. This is where we establish the "AI demonstrates, you critically review" pattern that every fundamentals episode uses.

#### Outline
1. **What a variable is** (2 min) — Named storage. `const userName = "Alice"`. Assign once, reference many times. Show in terminal with `node`.
2. **const vs let (and never var)** (3 min) — `const` for values that don't get reassigned. `let` for ones that do. `var` is legacy, avoid. Why `const` by default reduces bugs.
3. **The primitive types** (4–5 min) — string, number, boolean, null, undefined, symbol, bigint. Demo each. The null/undefined confusion. Why `NaN !== NaN` (the JavaScript joke).
4. **AI demonstrates, you review** (4 min) — Prompt: "Show me 10 examples of variable declarations covering all the primitive types." AI produces. Walk through. Flag anything wrong. Correct.
5. **Type coercion gotchas** (3 min) — `"5" + 3 === "53"` vs `"5" - 3 === 2`. `==` vs `===`. Why `===` always. Real bugs caused by loose equality.
6. **Naming variables well** (2 min) — Descriptive, not abbreviated. `userEmailAddress` not `ue`. AI names well by default — don't argue with its good names.
7. **Exercise** (2 min) — Ask AI to write 5 variable declarations with intentional bugs. You find them. Or: write your own, have AI review.
8. **Close** (60s) — "Variables and types are the atoms of programming. Every future episode builds on them."

#### Key visuals
- Variable declaration syntax breakdown
- Primitive types table with examples
- Type coercion "gotcha" examples on screen
- Live AI review: spotting bugs in generated code

#### Source materials
- MDN variables page (link)
- Example buggy code snippets (create and link)

#### Shorts potential
- "`const` by default. `let` when you have to reassign. `var` never. Three rules, 90% of JS variables covered."
- "`\"5\" + 3 === \"53\"`. `\"5\" - 3 === 2`. Always use `===`. JavaScript is quirky; you can route around it."

---

### Z12 — "Functions — Reusable Actions"

**Runtime target:** 20–22 min
**Pillar:** Workflow
**Search intent:** "JavaScript functions," "arrow functions vs regular," "pure functions explained," "function parameters and return values"

**Prerequisites:** Z11.

**Learning objectives:**
- Write, call, and compose functions with parameters and return values
- Distinguish pure functions from side effects
- Review AI-generated functions for clarity and correctness

#### Thesis
Functions are the most important unit of code. They wrap behavior, name it, and make it reusable. Learn to write them well, read them well, and compose them well — and most of your future code becomes clearer.

#### Outline
1. **What a function is** (2 min) — Named, reusable behavior. Input → transformation → output. Demo: write a `greet(name)` function, call it three times.
2. **Parameters and return values** (3–4 min) — Named inputs. Returning a value. Not returning (side effect). The difference between using the return and not.
3. **Arrow functions vs regular** (2–3 min) — Syntax differences. When each fits. The `this` rabbit hole — and why it almost never matters at this level.
4. **Pure vs side effects** (4 min) — Pure: same input, same output, no external changes. Side effect: logs, network, mutation. Why pure is easier to test, easier to review.
5. **Composition** (3 min) — Small functions that combine. `doubleAndIncrement = x => increment(double(x))`. Demo with a real example (string manipulation chain).
6. **AI demo + review** (3 min) — Prompt: "Write three functions that transform a user object in different ways." Review for purity, naming, return value clarity.
7. **Exercise** (2 min) — You write a function. AI reviews. Or: AI writes, you review.
8. **Close** (60s) — "Functions are where code becomes readable or unreadable. Most of the review work in AI code is function-level."

#### Key visuals
- Function as input → transformation → output diagram
- Arrow vs regular syntax comparison
- Pure vs side-effect side-by-side
- Composition chain visualization

#### Source materials
- MDN functions page
- Example function sets (pure, impure, well-named, badly-named)

#### Shorts potential
- "Functions are the atoms of readable code. Small, named, reusable. Most of AI code review happens at the function level."
- "Pure functions: same input, same output, no surprises. The easiest code to test, review, and trust."

---

### Z13 — "Control Flow — If, Loops, Logic"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "JavaScript if else," "JavaScript loops," "boolean logic programming," "control flow tutorial"

**Prerequisites:** Z11, Z12.

**Learning objectives:**
- Use `if`/`else`, ternary, and `switch` appropriately
- Write `for` and `while` loops and choose correctly between them
- Identify edge cases that naive control flow misses

#### Thesis
Your program is a decision tree. Control flow is how that tree gets made. AI writes correct-looking control flow for the happy path effortlessly — and silently drops edge cases at the branches. Review is where you catch the drops.

#### Outline
1. **The branching model** (90s) — Every program is a tree of decisions. Control flow expresses those branches.
2. **if / else / else if** (3 min) — Syntax. When to use. Why deeply nested ifs are a code smell.
3. **Ternary** (2 min) — Compact syntax for assignment decisions. When it helps, when it hurts readability.
4. **switch** (2–3 min) — The many-branch decision. When `switch` is clearer than chained `if`s. The `break` and `fallthrough` pitfalls.
5. **for and while loops** (3–4 min) — `for` when you know the count. `while` when you're waiting for a condition. `for...of` for arrays. `for...in` for object keys (rarely, and careful).
6. **Boolean logic** (3 min) — `&&`, `||`, `!`. Short-circuit evaluation. Why `user && user.name` works as a guard. Truthy and falsy — the JavaScript list.
7. **Edge case demo** (3 min) — AI produces a function that filters users. Works on the happy path. Fails on empty arrays, null values, duplicates. Show the failure. Fix it.
8. **Close** (60s) — "Control flow is where bugs live. Read every branch. Ask what happens at the edges. AI won't ask — you have to."

#### Key visuals
- Decision tree graphic
- Loop type comparison table
- Truthy/falsy reference table
- Edge case demo: happy path working, edges breaking

#### Source materials
- MDN control flow page
- Truthy/falsy reference sheet (create and link)

#### Shorts potential
- "Your program is a decision tree. Every branch is a place bugs hide. AI writes the happy path; you find the edges."
- "Truthy and falsy in JavaScript: `0`, `\"\"`, `null`, `undefined`, `NaN`, `false`. Everything else is truthy. Know this list."

---

### Z14 — "Data Structures — Arrays and Objects"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "JavaScript arrays and objects," "array methods tutorial," "map filter reduce explained," "data structures for beginners"

**Prerequisites:** Z11–Z13.

**Learning objectives:**
- Create and manipulate arrays and objects
- Use `map`, `filter`, `reduce`, and `find` appropriately
- Choose the right structure for the right data shape

#### Thesis
Arrays and objects are the two workhorse data structures of modern JavaScript. Arrays for ordered lists. Objects for named properties. Knowing when to use which — and which array methods to reach for — is what separates "I can code" from "I can read anyone's code."

#### Outline
1. **Arrays: ordered lists** (3 min) — Creation, access, length. `push`, `pop`, `shift`, `unshift`. Indexed access.
2. **Array iteration** (4 min) — `forEach` (side effects), `map` (transform), `filter` (select), `find` (first match), `reduce` (collapse). Demo each.
3. **Objects: named properties** (3 min) — Creation, access (dot vs bracket), adding/removing keys. Object as a map.
4. **When array vs when object** (2 min) — List of things without names → array. Things with distinct names/IDs → object (or array of objects). Examples.
5. **Iterating objects** (2–3 min) — `Object.keys`, `Object.values`, `Object.entries`. Why objects aren't ordered (historically) but reliable for most cases.
6. **Common AI mistakes** (3 min) — Using `forEach` when `map` was right. Mutating the original when they should return new. Not handling empty arrays. Demo each with real AI output.
7. **The spread and destructuring tour** (2 min) — `...arr`, `{ a, b } = obj`, `[x, ...rest] = arr`. The modern syntax that makes data manipulation pleasant.
8. **Close** (60s) — "You'll manipulate arrays and objects in every future episode. These six methods — `map`, `filter`, `find`, `reduce`, `some`, `every` — cover most of it."

#### Key visuals
- Array vs object visual comparison
- Iteration method cheat sheet (map/filter/reduce/find/some/every)
- Spread and destructuring syntax examples
- Common AI mistake demo

#### Source materials
- MDN Array methods page
- Data structure decision flowchart (create and link)

#### Shorts potential
- "Six array methods cover most of JavaScript data work. Map, filter, find, reduce, some, every. Memorize those six."
- "`forEach` is for side effects. `map` is for transformation. Using the wrong one is a common AI mistake."

---

### Z15 — "Reading Code Like a Detective"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "how to read code," "code reading skills," "understand unfamiliar code," "rubber duck debugging"

**Prerequisites:** Z11–Z14.

**Learning objectives:**
- Read unfamiliar code systematically instead of guessing
- Trace execution line-by-line in your head
- Produce an accurate mental model of what code does before running it

#### Thesis
Reading code is more valuable than writing code in an AI era. The best senior engineers don't write more code than juniors — they read more of it, more accurately, more critically. This is the most underrated skill in software. It's teachable. Here's the method.

#### Outline
1. **Why reading > writing** (2 min) — AI writes a lot of code. Someone has to read it. That someone is you. The ratio of reading-to-writing is increasing, not decreasing.
2. **The line-by-line method** (4 min) — Start at the top. Read each line. State out loud what it does. If you can't, stop and figure it out. Don't skim. Demo on unfamiliar code.
3. **The mental execution trace** (4 min) — Pick a function. Pick inputs. Walk through it step by step, tracking variable values as you go. What's the output? Verify by running. Demo.
4. **Rubber duck debugging** (3 min) — Explain the code to a rubber duck (or a pet, or a whiteboard). If you can't explain a line, that's the line you don't understand. The act of explaining surfaces gaps.
5. **Finding the contract** (3 min) — Every function has an implicit contract: inputs expected, outputs produced, side effects caused. Read for the contract before reading for the implementation.
6. **Reading AI output specifically** (3 min) — The four AI failure modes (from T2): hallucinated APIs, silent edge drops, pattern drift, confident wrongness. Read with those in mind. Demo on real AI code.
7. **Exercise** (3 min) — Open an unfamiliar repo (e.g., a Party Masters file from the real project). Read one function using all the methods. Produce a one-paragraph summary.
8. **Close** (60s) — "Reading is a skill. It compounds. Every hour spent reading unfamiliar code makes every future hour faster."

#### Key visuals
- Mental execution trace example (function + inputs + step-by-step variable tracking)
- Rubber duck illustration (literally)
- Function contract diagram (inputs/outputs/side effects)
- Real AI code read-through

#### Source materials
- Sample unfamiliar code files (create and link — use Party Masters code excerpts with permission)
- Rubber duck debugging Wikipedia page

#### Shorts potential
- "The best senior engineers don't write more code than juniors. They read more of it, more accurately. That's the AI-era advantage."
- "Explain every line to a rubber duck. The lines you can't explain are the lines you don't understand. That's the whole method."

---

### Z16 — "Debugging Your First Bug"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "how to debug JavaScript," "debugging for beginners," "console.log tutorial," "JavaScript errors explained"

**Prerequisites:** Z11–Z15.

**Learning objectives:**
- Read an error message and extract actionable information
- Use `console.log` and breakpoints to locate bugs
- Describe a bug to AI in a way that produces a useful response

#### Thesis
Debugging is not a talent. It's a method. Read the error, form a hypothesis, test the hypothesis, repeat. AI helps you — but only if you describe the bug precisely. Vague descriptions produce vague fixes.

#### Outline
1. **Every bug has a story** (90s) — A bug is a mismatch between what you expected and what happened. Your job is to find where the mismatch lives.
2. **Reading an error message** (3 min) — Error type. Message. Stack trace. Line number. Demo with a real TypeError, ReferenceError, SyntaxError.
3. **console.log — your best friend** (3 min) — Log values, log types, log objects. When to log. Where to log. When to remove logs. Demo: track a value through a function chain.
4. **VS Code breakpoints** (3 min) — Click in the gutter. Run in debug mode. Step through. Inspect values. Demo.
5. **Forming hypotheses** (3 min) — Bug report → hypothesis → test → result. The scientific method applied to code. Demo: a bug with three possible causes, testing each.
6. **Describing bugs to AI** (3 min) — What you did, what you expected, what happened, what you tried. Full context. Minimal reproduction. Demo: the difference between "this doesn't work" and a well-described bug.
7. **When AI helps vs when you're on your own** (2 min) — AI is great for syntax errors and common patterns. AI struggles with environment-shaped bugs, race conditions, and subtle logic errors. Preview Z29.
8. **Close** (60s) — "Debugging is a method, not a talent. You'll debug every day for the rest of your career. Build the habit now."

#### Key visuals
- Error message anatomy (type, message, stack, line)
- Live debugging: breakpoints, step-through, inspect
- Hypothesis table (cause → test → result)
- Good vs bad bug description for AI

#### Source materials
- Sample buggy code (create and link)
- Bug description template (create and link)

#### Shorts potential
- "Debugging is a method, not a talent. Read the error, hypothesize, test, repeat. Everyone can learn this."
- "\"It doesn't work\" isn't a bug report. \"I did X, expected Y, got Z, tried A and B\" is. AI responds to the second."

---

### Z17 — "HTML — Structure"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "HTML for beginners," "semantic HTML," "HTML accessibility basics," "learn HTML 2026"

**Prerequisites:** Z11–Z16.

**Learning objectives:**
- Write well-structured HTML using semantic tags
- Explain why semantic HTML matters for accessibility and SEO
- Review AI-generated HTML for semantic and accessibility issues

#### Thesis
HTML is the skeleton of the web. Semantic HTML is the difference between a div-soup page that nobody can navigate and a structured document that screen readers, search engines, and humans all understand. AI produces HTML prolifically — learn to review it for semantic quality.

#### Outline
1. **What HTML is** (90s) — Structured text. Tags. Attributes. Content between tags. Demo: a minimal valid HTML page.
2. **Document structure** (2–3 min) — `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`. What goes where. Why the structure exists.
3. **Semantic tags vs div-soup** (4 min) — `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`. What each means. Why AI often defaults to `<div>` everywhere and how to prompt for better.
4. **Headings** (2 min) — `<h1>` through `<h6>`. One `<h1>` per page. Nesting by meaning, not by visual size.
5. **Links and images** (2 min) — `<a href>` with meaningful text, not "click here." `<img>` with `alt` text. AI usually produces `alt=""` — that's rarely right.
6. **Accessibility basics** (3–4 min) — Semantic tags help screen readers. Alt text is required. Form labels. Focus order. Demo: run a page through an accessibility checker.
7. **AI HTML review** (2–3 min) — Prompt AI to produce a landing page. Review the HTML for semantics, accessibility, and structure. Catch the typical drift (too many divs, missing alt, wrong heading levels).
8. **Close** (60s) — "Good HTML is easy to learn and easy to get wrong. AI gets it wrong by default. Review it."

#### Key visuals
- Semantic tag anatomy (header/nav/main/footer on a real page)
- Div-soup vs semantic side-by-side
- Accessibility checker running on AI-generated HTML
- The full semantic reference card

#### Source materials
- MDN HTML reference
- A semantic HTML reference card (create and link)
- Web Content Accessibility Guidelines (WCAG) quick reference

#### Shorts potential
- "AI defaults to divs. Real HTML uses `<header>`, `<nav>`, `<main>`, `<article>`. Screen readers depend on the difference."
- "`alt=\"\"` is almost never right. Either describe the image meaningfully or explain why it's decorative."

---

### Z18 — "CSS — Presentation"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "CSS for beginners," "flexbox tutorial," "CSS grid explained," "Tailwind vs CSS"

**Prerequisites:** Z17.

**Learning objectives:**
- Style HTML with CSS selectors, the box model, and layout
- Build basic layouts using flexbox and grid
- Decide between Tailwind utility classes and vanilla CSS for different contexts

#### Thesis
CSS is the styling layer of the web. The rules are simple (selector + property + value), the system is deep (specificity, cascade, layout). You don't need to master every property. You need fluency in the box model, flexbox, and grid — and pattern recognition for the rest.

#### Outline
1. **The CSS mental model** (2 min) — Three things: what to select, what to change, what to change it to. Demo: change the color of an h1 in the learning repo.
2. **Selectors** (3 min) — Element, class, ID, descendant, combinators. When to use which. Why class is the right default.
3. **The box model** (3–4 min) — Content, padding, border, margin. The most important diagram in CSS. Every element is a box. Demo with DevTools.
4. **Flexbox** (4 min) — One-dimensional layout. Main axis, cross axis, justify-content, align-items. Demo: a real flex row with spacing.
5. **Grid** (3–4 min) — Two-dimensional layout. Grid-template-columns. gap. Named areas. Demo: a real page layout with grid.
6. **Tailwind vs vanilla** (3 min) — Tailwind is utility classes in your HTML. Vanilla CSS is classes in a separate file. Why this curriculum uses Tailwind for most examples. When vanilla is still right.
7. **AI CSS review** (2 min) — AI produces Tailwind prolifically. Watch for: unnecessarily deep nesting, inconsistent spacing scales, too many breakpoints. Demo a quick review.
8. **Close** (60s) — "CSS is easy to learn superficially and deep to learn well. Box model + flexbox + grid covers 90% of real work."

#### Key visuals
- Box model diagram (content / padding / border / margin)
- Flexbox axis diagram
- Grid layout visualization
- Tailwind vs vanilla CSS side-by-side

#### Source materials
- MDN CSS reference
- Flexbox Froggy / Grid Garden (free games for practice) — link
- Tailwind docs

#### Shorts potential
- "Box model + flexbox + grid. Three things. 90% of CSS layout. Memorize these before anything else."
- "Tailwind is 90% of my styling in 2026. Vanilla CSS for the 10% that needs custom. Pick your default and own it."

---

### ACT 4: YOUR FIRST APP

---

### Z19 — "JavaScript in the Browser"

**Runtime target:** 20–22 min
**Pillar:** Delivery
**Search intent:** "DOM manipulation JavaScript," "addEventListener tutorial," "fetch API beginner," "JavaScript interactive page"

**Prerequisites:** Z11–Z18.

**Learning objectives:**
- Select and modify DOM elements with JavaScript
- Handle user events (click, input, submit)
- Fetch data from a URL and display it

#### Thesis
JavaScript in the browser is how web pages become applications. Three concepts do most of the work: selecting elements (DOM), responding to events, and fetching data. This episode gets you fluent in all three.

#### Outline
1. **What "JavaScript in the browser" means** (90s) — HTML is structure, CSS is style, JavaScript is behavior. Together: a web app.
2. **The DOM** (3 min) — Document Object Model. Every HTML element is a JavaScript object you can read and modify. `document.querySelector`, `document.querySelectorAll`. Demo.
3. **Modifying the DOM** (3 min) — `element.textContent`, `element.innerHTML`, `element.classList.add/remove`. Demo: toggle a class, change text dynamically.
4. **Events** (4 min) — `element.addEventListener('click', handler)`. Common events: click, input, submit, change. Event objects. `preventDefault`. Demo: a button that counts clicks.
5. **fetch and async** (4 min) — `fetch(url)` returns a promise. `async/await` for readability. Error handling. Demo: fetch a public API, display the result.
6. **A mini-app** (3–4 min) — Combine everything: a page with a button that fetches and displays data. From scratch. AI writes it; you walk through it.
7. **Close** (60s) — "Everything from React forward is built on top of these three concepts. Get fluent here — React gets much easier later."

#### Key visuals
- HTML/CSS/JS as three layers of a web page
- DOM as a tree matching the HTML
- Event listener flow diagram
- Mini-app running live

#### Source materials
- MDN DOM reference
- A public API to fetch from (e.g., jsonplaceholder.typicode.com)
- The mini-app source code (commit and link)

#### Shorts potential
- "Three concepts power every web app: DOM, events, fetch. Learn these three; React and the rest make sense."
- "`addEventListener` is the hinge of interactivity. Click, input, submit — everything interactive goes through an event."

---

### Z20 — "React — Components Are Just Functions"

**Runtime target:** 20–22 min
**Pillar:** Delivery
**Search intent:** "React for beginners 2026," "what is a React component," "JSX explained," "React vs vanilla JavaScript"

**Prerequisites:** Z19.

**Learning objectives:**
- Write a simple React component and render it
- Explain JSX and why it looks like HTML
- Understand the mental model: component = function that returns UI

#### Thesis
React's whole trick is: a component is a function that returns something that looks like HTML. That's it. Everything else — state, effects, context — is detail on top. Get this one concept right and the rest follows.

#### Outline
1. **Why React won** (2 min) — Component-based UIs. Rich ecosystem. Next.js made it the default. "You're learning it because it's what most jobs use."
2. **The component as a function** (3 min) — `function Hello() { return <h1>Hello</h1> }`. That's a component. Not magic. A function.
3. **JSX — HTML in JavaScript** (3 min) — The syntax that makes React feel like HTML. It compiles to `React.createElement` calls. Why it looks weird at first and stops looking weird after 20 minutes.
4. **Rendering** (2–3 min) — `ReactDOM.render` or, in Next.js, just exporting the component. How React puts your function output into the page.
5. **Props** (3 min) — Arguments to components. `<Hello name="Alice" />`. Read inside the component as a `props` object. Demo: a reusable card component.
6. **Composing components** (3 min) — Components use other components. A page is components all the way down. Demo: a page made of a Header, a Main, and a Footer component.
7. **Your first Next.js page** (3 min) — Use the travisgautier project or a fresh Next.js app. Create a new page. Add a component. See it render.
8. **Close** (60s) — "Components are functions. Functions return UI. That's the whole mental model. State comes next."

#### Key visuals
- Component as function, input (props) → output (UI)
- JSX compilation (JSX → createElement calls)
- Component tree diagram (page made of nested components)
- Live Next.js page being built

#### Source materials
- React official docs (link to the newest tutorial)
- Next.js docs
- Fresh Next.js starter repo (create and link)

#### Shorts potential
- "A React component is a function that returns UI. That's the whole trick. The rest is detail."
- "JSX looks weird for 20 minutes. Then it looks obvious forever. Push through the first 20."

---

### Z21 — "State and Props"

**Runtime target:** 20–25 min
**Pillar:** Delivery
**Search intent:** "React useState," "React state vs props," "controlled components React," "React state management beginners"

**Prerequisites:** Z20.

**Learning objectives:**
- Use `useState` to manage component state
- Pass props from parent to child components
- Decide where state should live in a component tree

#### Thesis
State is what changes. Props are what's passed. That distinction — and the question "where should this state live?" — answers 80% of React architecture questions. Get it right and React feels easy. Get it wrong and every feature fights you.

#### Outline
1. **State: what changes** (3 min) — `const [count, setCount] = useState(0)`. Read `count`, update with `setCount`. React re-renders when state changes. Demo: a counter.
2. **Props: what's passed** (3 min) — Callbacks flow down, data flows down, events bubble up. The one-way data flow. Demo: parent owns state, child receives it via props, child triggers parent update via callback.
3. **Controlled components** (4 min) — Inputs whose value comes from state. `<input value={x} onChange={(e) => setX(e.target.value)} />`. The React way to handle forms. Demo.
4. **Lifting state up** (3–4 min) — When two siblings need the same state, move it to the parent. The most common React architecture move. Demo with a two-input form.
5. **When state should NOT live in React** (2 min) — Derived state (compute from props/state). Server state (use a library). URL state (use router). Don't useState everything.
6. **Common mistakes** (3 min) — Mutating state directly instead of replacing. Stale closures in effects. Demo each with AI code examples.
7. **Exercise** (2 min) — Build a small two-component app with lifted state. Walk through.
8. **Close** (60s) — "State and props are the heartbeat of every React app. Every feature you'll build from here uses them. Get fluent."

#### Key visuals
- State vs props visual (what changes vs what's passed)
- One-way data flow diagram (data down, events up)
- Lifting state up animation
- Common mistakes annotated

#### Source materials
- React official state tutorial (link)
- Sample controlled-components repo
- "Thinking in React" official guide (link)

#### Shorts potential
- "State is what changes. Props is what's passed. Two words, 80% of React architecture."
- "When two components need the same state, lift it up. Most common React move. Do it without hesitating."

---

### Z22 — "Forms, Events, and User Input"

**Runtime target:** 18–22 min
**Pillar:** Delivery
**Search intent:** "React forms tutorial," "React form validation," "handling form submission React," "react-hook-form beginner"

**Prerequisites:** Z21.

**Learning objectives:**
- Build a controlled form in React with multiple inputs
- Validate input and handle submission
- Write tests for form behavior

#### Thesis
Forms are where apps meet users. Every app has them. Getting forms right — validation, submission, error states, accessibility — is a specific skill. AI handles the happy path easily and drops every edge case. You're the edge-case layer.

#### Outline
1. **The form from scratch** (3–4 min) — `<form>`, `<input>`, `<button type="submit">`. `onSubmit` with `preventDefault`. Demo: a login form that logs values.
2. **Controlled inputs** (3 min) — Each input is a piece of state. `value` and `onChange` on every input. Demo with three fields.
3. **Validation** (4 min) — Required fields, format checks (email regex), length constraints. Show errors inline. Demo: email validation with real-time feedback.
4. **Submission** (3 min) — Loading state, success state, error state. The four states every form has: idle, submitting, success, error. Demo.
5. **react-hook-form** (2 min) — Why most React apps use a form library. What it removes (boilerplate). What you still do (validation logic, UX decisions).
6. **Writing tests for forms** (3 min) — Testing library basics. `render`, `userEvent.type`, `userEvent.click`. Testing that submission calls the right handler. Demo.
7. **Close** (60s) — "Forms are where real apps live or die. Build one per week until they're boring."

#### Key visuals
- Four states of a form (idle / submitting / success / error)
- Controlled input data flow
- Inline validation in action
- Test file side-by-side with component

#### Source materials
- react-hook-form docs
- React Testing Library docs
- Sample form component with tests (commit and link)

#### Shorts potential
- "Every form has four states: idle, submitting, success, error. Handle all four. AI handles one."
- "Every app has forms. Build one per week until they're boring. Then you're ready for real apps."

---

### Z23 — "Fetching Data from an API"

**Runtime target:** 18–22 min
**Pillar:** Delivery
**Search intent:** "React fetch data," "useEffect fetch," "loading states React," "React Query beginner"

**Prerequisites:** Z22.

**Learning objectives:**
- Fetch data in a React component and display it
- Handle loading, success, and error states explicitly
- Know when to use a fetching library vs raw fetch

#### Thesis
Fetching data is the bridge between your app and the rest of the internet. The pattern is simple — fetch, loading, success, error. The mistakes are consistent — forgetting one of those four states. AI writes the happy path; you own the three other states.

#### Outline
1. **The four states** (2 min) — Idle / loading / success / error. Every fetch has all four. Drop any and you ship a broken UI.
2. **fetch with useEffect** (4 min) — Fetch on mount. Store result in state. Show loading spinner. Demo: fetch a list of users from a public API.
3. **Error handling** (3 min) — Network errors, non-200 responses, malformed data. Each case needs explicit handling. Demo with a broken API.
4. **Loading states that don't suck** (2–3 min) — Spinners are the minimum. Skeleton screens are better. Progressive loading is best. Demo.
5. **The useEffect gotchas** (3 min) — Infinite loops from missing dependencies. Race conditions from stale responses. Cleanup functions. Demo each.
6. **Libraries: React Query, SWR, use hook in Next.js** (3 min) — Why nobody writes raw fetch in production. Caching, retries, deduplication. When to graduate from raw fetch.
7. **AI fetch code review** (2 min) — Show AI-generated fetch. Spot: no error handling, no loading state, no cleanup. Fix each.
8. **Close** (60s) — "Every app fetches data. Getting it right means four states always. Three states is a bug."

#### Key visuals
- Four-state flowchart (idle / loading / success / error)
- Spinner vs skeleton screen comparison
- Race condition demo (fast request comes in after slow)
- AI fetch code before/after review

#### Source materials
- React Query docs
- Public practice APIs (jsonplaceholder, PokéAPI)
- Sample fetch component with all four states (commit and link)

#### Shorts potential
- "Every fetch has four states: idle, loading, success, error. Drop any and you ship a broken UI."
- "Nobody writes raw fetch in production. React Query or SWR. Caching, retries, deduplication — free."

---

### Z24 — "Your First Backend Route"

**Runtime target:** 18–22 min
**Pillar:** Delivery
**Search intent:** "Next.js API routes tutorial," "build a backend API," "POST vs GET request," "full stack for beginners"

**Prerequisites:** Z23.

**Learning objectives:**
- Write a Next.js API route that handles GET and POST requests
- Return JSON with appropriate status codes
- Call your own API from a frontend component

#### Thesis
A backend is just code that runs on a server instead of in a browser. Next.js API routes make this nearly frictionless — files in a folder become endpoints. Your first one unlocks everything else: auth, databases, integrations, the whole second half of "full stack."

#### Outline
1. **What a backend is** (2 min) — Code that runs somewhere other than the user's browser. Why you need one: secrets (API keys), shared state (databases), anything users can't trust themselves with.
2. **Next.js API routes** (3 min) — `app/api/[name]/route.ts`. Export `GET`, `POST`, etc. The function runs on the server. Demo: a hello-world endpoint.
3. **Request and Response** (3–4 min) — Reading the request body. Reading query params. Returning JSON. Status codes. Demo GET and POST endpoints.
4. **Calling your API from the frontend** (3 min) — `fetch('/api/your-endpoint')`. Same syntax as external APIs. Demo from a React component.
5. **Status codes that matter** (2 min) — 200 success, 201 created, 400 bad request, 401 unauthorized, 404 not found, 500 server error. Use them correctly. Demo.
6. **A mini full-stack feature** (3–4 min) — A form that submits to your API route, which logs it (we'll add database next episode). End-to-end in one go.
7. **Close** (60s) — "Your first backend route is the unlock. Every complex feature builds on this pattern."

#### Key visuals
- Frontend/backend diagram (browser ↔ API route)
- File-based routing: folder → URL mapping
- Status code reference card
- Mini full-stack flow: form → fetch → API route → response

#### Source materials
- Next.js API routes docs
- HTTP status code reference (MDN)
- Mini full-stack demo repo (commit and link)

#### Shorts potential
- "A backend is code that runs somewhere other than the user's browser. Next.js makes that a file in a folder."
- "200, 201, 400, 401, 404, 500. Six status codes cover most real APIs. Learn them before you memorize the others."

---

### Z25 — "Databases — Storing Things That Matter"

**Runtime target:** 22–25 min
**Pillar:** Delivery
**Search intent:** "PostgreSQL for beginners," "Prisma tutorial," "database schema design," "SQL vs NoSQL"

**Prerequisites:** Z24.

**Learning objectives:**
- Set up a PostgreSQL database and connect with Prisma
- Design a simple schema with relationships
- Read and write data from your API route

#### Thesis
A database is where data persists between sessions. PostgreSQL is the default in 2026 — boring, reliable, used everywhere. Prisma makes it pleasant. Once you have a schema, a migration, and a query, you have the full backend stack. The four-stage discipline from Agent Team Tactics T3 applies here directly.

#### Outline
1. **What a database is** (2 min) — Persistent storage that survives server restarts. Tables, rows, columns. Queries. Why SQL won and why it'll keep winning.
2. **Why PostgreSQL** (90s) — Free, open-source, dominant, runs everywhere. Boring technology wins.
3. **Why Prisma** (2 min) — Type-safe queries. Schema as code. Auto-generated client. What you'd write by hand, without hand-writing it.
4. **Your first schema** (4 min) — `schema.prisma` file. A User model. A Post model. The relation. Demo with a real schema.
5. **Migrations** (3 min) — `prisma migrate dev` to apply the schema to the database. What a migration file looks like. Why migrations matter. Demo.
6. **Reading and writing** (4 min) — `prisma.user.create`, `prisma.user.findMany`. The client API. Demo in an API route: create a user, list users.
7. **The T3 four-stage discipline** (3 min) — Entities → relationships → attributes → schema. Applied to your learning repo. Prompt AI through each stage. Review.
8. **Deploying a database** (2 min) — Neon, Supabase, Railway — free tiers. Environment variables. Demo: deploy the database, connect the Vercel app.
9. **Close** (60s) — "Your app now persists data. That's the full backend stack. Everything else is variations."

#### Key visuals
- Database as persistent storage diagram
- Prisma schema on screen with annotations
- Migration file walkthrough
- Full flow: React form → API route → Prisma → Postgres

#### Source materials
- Prisma docs
- Neon/Supabase/Railway signup links
- Complete learning repo with database connected (commit)

#### Shorts potential
- "PostgreSQL + Prisma is the default backend stack in 2026. Boring, reliable, pleasant. Learn this once, reuse forever."
- "T3's four-stage schema design applies here. Entities, relationships, attributes, schema. Never skip to the answer."

---

### Z26 — "Deploying Your First App"

**Runtime target:** 18–22 min
**Pillar:** Delivery
**Search intent:** "deploy Next.js Vercel," "deploy a web app for beginners," "environment variables production," "my app is live"

**Prerequisites:** Z25.

**Learning objectives:**
- Deploy your learning app to Vercel from the command line
- Configure environment variables for production
- Diagnose and fix common production-only issues

#### Thesis
Deployment used to be hard. Vercel made it a git push. The real skill now isn't deploying — it's diagnosing the five ways your app breaks in production that it didn't break locally. This episode covers both.

#### Outline
1. **What deployment is** (90s) — Making your code run on a server the rest of the world can reach. Not your laptop.
2. **git push to Vercel** (3 min) — Vercel watches your GitHub repo. Every push to main triggers a deploy. Demo: deploy the learning repo.
3. **Environment variables** (4 min) — Secrets that differ between local and production. `.env.local` vs Vercel env vars. Database URLs, API keys. Demo: add Postgres connection to production.
4. **The five production-only failures** (5 min) —
   - Environment variable missing
   - Database not reachable from Vercel
   - Build succeeds locally but fails on Vercel (Node version mismatch, dependency issue)
   - Works on your laptop but slow in production (cold starts, network latency)
   - Cross-origin issues when frontend and backend differ
   - Walk through each with a real example.
5. **Domains** (2 min) — Vercel gives you a free `*.vercel.app` URL. Custom domains are a click. Demo.
6. **Logs and monitoring** (2–3 min) — Vercel logs. Server-side errors. How to find what broke. Demo: trigger an error, find it in logs.
7. **Close** (60s) — "Your app is live. Share the URL with someone. The gap between 'it works on my laptop' and 'strangers can use it' just closed."

#### Key visuals
- git push → Vercel → live URL flow
- Environment variable UI in Vercel dashboard
- Five production failures as a flowchart
- Logs showing a real error

#### Source materials
- Vercel docs
- The fully-deployed learning repo URL (commit and link)
- Environment variable checklist (create and link)

#### Shorts potential
- "Deploying a web app in 2026: git push. That's it. Vercel does the rest."
- "Five things break in production that don't break on your laptop. Env vars, database reach, build diffs, cold starts, CORS. Know them."

---

### ACT 5: THE JUDGMENT LAYER

*This act is the T8 anchor. T8 diagnoses the failure modes; these eight episodes teach the skills that close the gap.*

---

### Z27 — "What AI Can't Do (And Why You Need to Know)"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "AI coding limitations," "what AI can't do in software," "AI developer skills 2026," "skills AI won't replace"

**Prerequisites:** Z1–Z26 (you've built a real app; now we teach the judgment).

**Learning objectives:**
- Name the four categories of AI failure and why they cluster
- Recognize that capability improvements don't erase these categories
- Know what each of the next seven episodes addresses

#### Thesis
You've built a real app with AI help. Now we teach what AI can't do — and why those gaps matter more than the gains. The four categories aren't random. They cluster around what context windows can't hold: business context, system state over time, novel intent, and proportionate scope. Better models don't fix this. You learn it.

#### Outline
1. **You just built something real** (90s) — Recap: Z19 through Z26 produced a deployed app. Celebrate briefly. Then the pivot.
2. **Why Act 5 exists** (2 min) — Building is the easier part. Judging is the harder part. The skills that separate "can use AI" from "proficient AI developer" are in this act.
3. **The four categories, introduced** (5 min) —
   - **Architecture / judgment calls** — AI optimizes locally; you optimize globally (Z30)
   - **Systems-shaped debugging** — bugs that don't fit in a context window (Z29)
   - **Reading code critically** — catching the failures AI makes confidently (Z28)
   - **Scope discipline** — AI defaults to comprehensive; proportionate is human (Z31)
   - Plus: security (Z32) and performance (Z33) as cross-cutting concerns, and the graduation test (Z34)
4. **The cluster** (3 min) — What unites these? Things a context window can't hold. Business history, state over time, intent that isn't on the page, proportion. Better models fit larger windows — they don't change what windows fundamentally can't hold.
5. **Why this act matters for the market** (3 min) — Junior developers in 2026 look identical to AI for the first 80% of tasks. The judgment layer is the differentiator. Employable vs not-employable lives here.
6. **How this act is structured** (2 min) — Each of Z28-Z33 takes one category, goes deep. Z34 is a test you either pass or go back and rewatch specific episodes.
7. **Close** (60s) — "Everything you learned before this was table stakes. This act is where the career lives."

#### Key visuals
- The four failure categories as a graphic (and the cross-cutting Z32/Z33)
- "What context windows can't hold" diagram
- Employability curve: generic AI user vs judgment-layer developer
- Act 5 episode map with episodes pointing at failure modes

#### Source materials
- Agent Team Tactics T8 (the diagnostic this act treats)
- Stack Overflow 2026 developer survey (market data)
- Real examples of each failure category from Party Masters

#### Shorts potential
- "Junior devs in 2026 look identical to AI for the first 80% of tasks. The judgment layer is what separates employable from not."
- "Better models don't fix judgment. Context windows can't hold business history, state over time, or intent that isn't on the page. Better to learn this now."

---

### Z28 — "Reading Code Critically — Not Just Running It"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "reviewing AI generated code," "code review AI," "reading AI code carefully," "AI output quality"

**Prerequisites:** Z15, Z27.

**Learning objectives:**
- Apply the six-question review checklist to AI-generated code
- Spot hallucinated APIs, silent edge case drops, pattern drift, and confident wrongness
- Produce useful code review feedback to AI (or to yourself)

#### Thesis
Reading AI code is different from reading human code. Humans fail in ways that come from misunderstanding. AI fails in ways that come from confident pattern-matching. The failure modes are specific, recurring, and catchable — if you know what to look for. This episode extends T2 into a professional discipline.

#### Outline
1. **Why this matters more than ever** (90s) — You're going to read more AI code than you write. The ratio of reading-to-writing is increasing. This is your main output.
2. **The four AI failure modes (recap from T2)** (4 min) — Hallucinated APIs, silent edge case drops, pattern drift, confident wrongness. Quick examples of each.
3. **The six-question checklist** (5 min) —
   1. Does this call anything that doesn't exist?
   2. What happens with empty/null input?
   3. Does this match existing patterns?
   4. Is authentication/authorization handled?
   5. What does this silently fail on?
   6. Would I ship this if a junior wrote it?
   - Walk through each. Demo on real AI code.
4. **Live review session** (5 min) — Take a real AI-generated file from the learning repo or Party Masters. Apply the checklist. Find the failures. Propose fixes.
5. **Writing useful review feedback** (3 min) — To AI: specific, actionable, example-driven. To yourself: notes that will matter next week. Demo the difference between vague and useful feedback.
6. **The Z34 connection** (2 min) — Preview: the judgment test will include AI output with these specific failure modes. Your ability to spot them is testable.
7. **Close** (60s) — "Reading AI code critically is a professional skill. It pays back every day. Build the habit now."

#### Key visuals
- Six-question checklist graphic (same as T2)
- Four failure modes with real code examples
- Live review on a real PR
- Vague vs useful feedback side-by-side

#### Source materials
- Agent Team Tactics T2 (foundational)
- Real AI-generated code from Party Masters (good and bad examples)
- Review checklist downloadable (create and link)

#### Shorts potential
- "Six questions on every AI-generated change. Hallucinated APIs, edge cases, patterns, auth, silent failures, junior-bar. That's the full checklist."
- "The ratio of reading-to-writing code is increasing. Your main output as an AI developer is review. Train it."

---

### Z29 — "Systems Thinking — Debugging What You Can't See"

**Runtime target:** 22–25 min
**Pillar:** Workflow
**Search intent:** "race condition debugging," "state over time bug," "systems thinking software," "debugging distributed systems"

**Prerequisites:** Z16, Z27.

**Learning objectives:**
- Build a mental model of a system that spans more than one context window
- Diagnose state-shaped and time-shaped bugs
- Know when to stop asking AI and start drawing diagrams

#### Thesis
Some bugs can't live in a context window. Race conditions. State that changes between requests. Bugs that only manifest under load. Debugging these requires holding the whole system in your head — and AI can't do that for you. This is the episode where you learn to build the mental model that finds the bugs AI can't.

#### Outline
1. **The bug AI can't find** (2 min) — Open with a specific example: the Wix webhook race condition from Party Masters. AI proposed three plausible causes, all wrong. What the actual cause was. Why no context window could have held enough.
2. **What systems thinking is** (3 min) — Thinking about things as relationships and state over time, not isolated snapshots. State diagrams. Sequence diagrams. The basic vocabulary.
3. **State-shaped bugs** (4 min) — Bugs that depend on what happened before. Initialization order. Race conditions. Shared mutable state. Demo with a real reproduction.
4. **Time-shaped bugs** (3 min) — Bugs that only happen on certain rhythms. Retries that compound. Timeouts that cascade. Demo with a real example.
5. **Drawing the system** (4 min) — When stuck: stop asking AI, start drawing. Components. Arrows. State. Time. The whiteboard (or Excalidraw, or paper) as a debugging tool. Demo.
6. **Testing hypotheses about invisible state** (3 min) — Adding logging that reveals timing and order. Reproducing locally. Minimizing the repro. Demo.
7. **When AI helps and when it doesn't** (2 min) — AI helps validate a hypothesis you formed. AI struggles to form hypotheses about system state it can't see. Know the difference.
8. **Close** (60s) — "Systems thinking is the skill that finds the bugs AI can't. Build the mental model. Draw the picture. Test the hypothesis. Do this enough times and it becomes intuition."

#### Key visuals
- Race condition reproduction (terminal recording)
- Sequence diagram of the Wix webhook bug
- Whiteboard session debugging a real system
- State diagram of a contested resource

#### Source materials
- The real Wix webhook debugging trail from Party Masters
- Excalidraw or similar diagramming tool
- Thinking in Systems (Donella Meadows) — brief citation

#### Shorts potential
- "Some bugs can't live in a context window. Race conditions. State over time. You have to hold the whole system in your head to find them."
- "When AI proposes three wrong causes, stop prompting. Start drawing. Systems thinking is the skill AI can't replace."

---

### Z30 — "Architecture Decisions — Why This And Not That"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "software architecture for beginners," "architecture decision records," "database normalization tradeoffs," "monolith vs microservices"

**Prerequisites:** Z25, Z27.

**Learning objectives:**
- Frame architecture decisions as tradeoffs, not best practices
- Recognize when AI's locally-optimal answer is globally wrong
- Document decisions so future-you (and your team) can understand them

#### Thesis
Architecture decisions are rarely about "best practice." They're about tradeoffs in the specific context of your project. AI proposes locally-optimal answers — the answer that's correct given the snapshot. Humans propose globally-optimal answers — the answer that's correct given the trajectory. This episode teaches that difference.

#### Outline
1. **The Party Masters schema story** (3 min) — AI proposed normalized schema. Defensible. Also wrong for the actual query pattern. Why the local optimum was the global mistake. Full walkthrough.
2. **Why AI can't make these calls well** (2 min) — The context window doesn't contain the business history, the future query plans, the team's operational maturity, the 3-year roadmap. AI optimizes for what it can see. You have to optimize for what you know.
3. **The decision framework** (4 min) — What options exist? What are the tradeoffs? What does our specific context favor? Which option is least reversible? Demo on a real decision.
4. **Common decisions you'll face** (4 min) —
   - Normalization vs denormalization (schema)
   - Monolith vs services (deployment)
   - Client state vs server state (React)
   - Build vs buy (dependencies)
   - Each with the tradeoffs explained concisely
5. **Architecture Decision Records** (3 min) — Write down the decision. The context. The options considered. Why you chose what you chose. Reversible date. Demo writing one.
6. **Using AI as a sparring partner** (2 min) — AI is terrible at making the call. AI is great at steel-manning alternatives. Prompt: "Argue the case for denormalization here." Then the reverse. Make the call yourself.
7. **Close** (60s) — "Architecture is where AI helps most and decides least. The call stays yours. Write it down so future-you knows why."

#### Key visuals
- Local vs global optimum illustration (the Party Masters schema)
- Decision framework flowchart
- Common decisions table (option A / option B / favor A when / favor B when)
- A real ADR on screen

#### Source materials
- The Party Masters schema decision (with permission)
- Architecture Decision Record template (create and link)
- Thoughtworks ADR guide (link)

#### Shorts potential
- "AI optimizes locally. You optimize globally. The context window doesn't contain your roadmap. Only you do."
- "Architecture is about tradeoffs, not best practices. Options, context, reversibility, call. Write it down."

---

### Z31 — "Scope Discipline — Knowing When to Stop"

**Runtime target:** 18–20 min
**Pillar:** Workflow
**Search intent:** "MVP thinking," "scope creep software," "minimum viable product development," "when to stop adding features"

**Prerequisites:** Z27.

**Learning objectives:**
- Recognize when AI is over-engineering a solution
- Cut features you don't need from a spec without hurting the project
- Have the scope conversation with a client or stakeholder

#### Thesis
AI defaults to comprehensive. Every edge case handled. Every config option exposed. Every possible failure anticipated. That's not quality — it's indiscipline. Real projects need proportionate solutions, not maximalist ones. Scope discipline is a skill, it's human, and it's underrated.

#### Outline
1. **The AI over-engineering pattern** (2 min) — Prompt: "Build a lead capture form." Get: form with six field types, four validation strategies, three submission modes, fifteen possible error states. Too much. Demo.
2. **What proportionate looks like** (3 min) — The same form: three fields, one validation, one submission, three states (idle/submitting/error). Same user outcome. 80% less code. Fewer bugs. Faster to ship.
3. **MVP thinking** (3 min) — What's the smallest version that solves the actual problem? The "useless until it's not" rule — features that don't deliver value alone. Demo cutting a feature spec.
4. **The Party Masters triage** (4 min) — Real case: Andy's 25-item feedback list. How it got triaged to 21 built + 4 deferred + smart questions. The decision framework. Show ANDY-FEEDBACK-TRIAGE-V1.
5. **The scope conversation** (3 min) — How to tell a client (or yourself) "we're not building this now." Framing. Alternatives. Future commitment. Demo the conversation.
6. **The AI prompting pattern for scope** (2 min) — "Build the simplest version of X that solves [specific user need]. Flag anything you'd add in v2." This prompt produces better output than "build X." Demo.
7. **Close** (60s) — "Scope is what separates shipped from shipped-eventually. Be the discipline layer AI doesn't have."

#### Key visuals
- Over-engineered vs proportionate side-by-side (same form, different code)
- MVP decision framework
- The Party Masters triage document on screen
- "Minimum to useful" progression graphic

#### Source materials
- ANDY-FEEDBACK-TRIAGE-V1.md (with permission)
- Agent Team Tactics T8 failure 4 examples
- Shape Up / Ryan Singer scope references

#### Shorts potential
- "AI defaults to comprehensive. Proportionate is human. Cut until it hurts, then ship."
- "Prompt for scope: 'Build the simplest version that solves [specific need]. Flag what you'd add later.' Produces better output."

---

### Z32 — "Security Thinking — The Questions AI Won't Ask"

**Runtime target:** 20–25 min
**Pillar:** Workflow
**Search intent:** "web application security," "OWASP top 10 for beginners," "STRIDE threat modeling," "secure coding practices"

**Prerequisites:** Z24, Z27.

**Learning objectives:**
- Apply STRIDE threat modeling to an API endpoint
- Recognize the OWASP Top 10 categories in real code
- Add the security questions to every AI prompt and review

#### Thesis
AI skips security unless explicitly asked. This isn't a flaw you can patch — it's structural. The security questions have to be asked every time, by you, on every endpoint, on every form, on every integration. STRIDE is the framework. The OWASP Top 10 is the checklist. This episode makes both reflexive.

#### Outline
1. **The default is insecure** (2 min) — Prompt AI to build an auth system. It produces working code. Check for: password storage, rate limiting, CSRF protection, session handling. Most are absent. Demo.
2. **STRIDE, practically** (4 min) — Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. Each with one real example. Apply to an endpoint on screen.
3. **The OWASP Top 10 tour** (5 min) — Injection, broken auth, sensitive data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialization, known vulnerable deps, insufficient logging. One sentence each. One real example each.
4. **Input validation** (3 min) — Validate everything that comes from outside your system. Types, lengths, formats, ranges. Never trust the client. Demo: a form that validates client-side AND server-side.
5. **Auth boundaries** (3 min) — What does "logged in" mean? What does "authorized for this resource" mean? Two different questions. Demo common mistakes.
6. **The AI security prompt** (2 min) — Every prompt for user-facing code should include: "Include input validation, auth checks, and list any remaining security considerations I should address." Makes AI actually ask the questions.
7. **Close** (60s) — "AI won't ask the security questions. You ask them every time. Make it reflex."

#### Key visuals
- STRIDE applied to a real endpoint (one row per threat)
- OWASP Top 10 quick-reference graphic
- Secure vs insecure login flow side-by-side
- The security prompt template

#### Source materials
- OWASP Top 10 (current year)
- Microsoft STRIDE documentation
- Secure prompting template (create and link)

#### Shorts potential
- "AI skips security unless explicitly asked. Every prompt for user code needs: 'Include validation, auth, and flag remaining security considerations.'"
- "STRIDE: six threats on every endpoint. Spoofing, tampering, repudiation, disclosure, DoS, privilege. Even 'not applicable' is a documented answer."

---

### Z33 — "Performance Intuition — When Code Runs Slow"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "N+1 query problem," "big O for beginners," "SQL EXPLAIN plan," "web performance optimization"

**Prerequisites:** Z25, Z27.

**Learning objectives:**
- Identify the N+1 query problem and fix it
- Read an EXPLAIN plan and find the slow operation
- Know when to optimize and when to ship

#### Thesis
Correct and fast are two different properties. AI produces correct code easily and slow code accidentally. The most common performance pitfalls — N+1 queries, missing indexes, fetching too much data, blocking rendering — are predictable, catchable, and teachable. Full CS training is not required. Intuition is.

#### Outline
1. **Why performance is the forgotten dimension** (90s) — Tests pass, linter happy, types correct. Also: takes 8 seconds to load. "Works" means more than "passes."
2. **Big-O without a CS degree** (3 min) — O(1) instant. O(n) linear. O(n²) the shape to avoid. Real examples. Intuition for when code is getting quadratic.
3. **The N+1 query** (4 min) — The most common performance bug in any app with a database. What it is. Why AI writes it. How to spot it. How to fix it. Demo with Prisma (select with includes vs naive loop).
4. **Indexes** (3 min) — What they are. When to add them. EXPLAIN plan reading basics. Demo: query going from slow to fast with one index.
5. **Fetching too much** (2–3 min) — Selecting entire rows when you need three fields. Loading 10,000 items when you display 20. Pagination. Projection. Demo.
6. **Frontend performance quickies** (2 min) — Images (size, lazy loading). Bundle size. Blocking scripts. The biggest wins in 60 seconds.
7. **When to optimize** (2 min) — Not prematurely. When users notice. When metrics show it. When scale is about to hit. Demo the "is it a problem yet?" question.
8. **Close** (60s) — "Performance intuition is built one N+1 at a time. Every time you catch one, the intuition gets sharper."

#### Key visuals
- O(1) / O(n) / O(n²) visualization
- N+1 query explained with a real Prisma example
- EXPLAIN plan before and after an index
- Chrome DevTools Performance tab showing a slow page

#### Source materials
- Prisma docs on `include` vs N+1
- PostgreSQL EXPLAIN documentation
- Web.dev performance guides

#### Shorts potential
- "The N+1 query is the most common performance bug in any app with a database. AI writes it by default. Catch it."
- "Correct and fast are two different properties. AI is great at correct. You handle fast."

---

### Z34 — "The Judgment Test — You're Ready for Real Projects"

**Runtime target:** 22–25 min
**Pillar:** Workflow
**Search intent:** "developer skill test," "AI developer assessment," "ready to be a developer," "coding interview preparation"

**Prerequisites:** Z27–Z33.

**Learning objectives:**
- Demonstrate the judgment layer skills on a realistic project
- Identify specific trap categories (architecture, systems, scope, security, performance)
- Know which Z-episode to revisit if you missed specific categories

#### Thesis
A graduation moment disguised as a test. A realistic project with embedded judgment traps — one per failure category from Z27. You review the AI output, catch the traps, make the calls. Pass the test, you're ready for Act 6. Miss traps, you go back to specific episodes. No gatekeeping. Honest feedback.

#### Outline
1. **The test format** (2 min) — A project spec and AI-generated code for it. Six traps hidden across: architecture (Z30), systems (Z29), scope (Z31), security (Z32), performance (Z33), plus a critical reading trap (Z28). Find them. Explain why they're wrong. Propose fixes.
2. **The project** (3 min) — A realistic small app: e.g., a booking tracker with a form, a list, and an API. Show the spec. Show the AI output. Let the viewer pause and review before continuing.
3. **Trap 1: Architecture** (2 min) — Reveal and walk through. What's locally optimal but globally wrong. Tie back to Z30.
4. **Trap 2: Systems** (2 min) — The race condition or state-shaped bug. Walk through. Tie back to Z29.
5. **Trap 3: Scope** (2 min) — The over-engineered feature. Walk through. Tie back to Z31.
6. **Trap 4: Security** (2 min) — Missing auth check, missing validation, exposed secret. Walk through. Tie back to Z32.
7. **Trap 5: Performance** (2 min) — N+1 query or similar. Walk through. Tie back to Z33.
8. **Trap 6: Critical reading** (2 min) — Hallucinated API, silent edge case drop, or pattern drift. Walk through. Tie back to Z28.
9. **Scoring yourself** (2 min) — All 6: you're ready. 4-5: review the specific episodes you missed. <4: rewatch Act 5 and try again. No shame, no gate. Just a mirror.
10. **Close** (60s) — "If you caught most of those, you have the judgment layer. That's not a qualification — that's a baseline. From here we shift from learning to shipping."

#### Key visuals
- Project spec on screen
- AI-generated code with traps highlighted (after the reveal)
- Trap-to-episode mapping
- "You got X out of 6" scoring rubric

#### Source materials
- The full test project — spec and AI-generated code with traps (create and link)
- Solution walkthrough video reference
- Back-reference links to Z28-Z33

#### Shorts potential
- "The judgment test: six traps in a realistic project. One per failure category. Find them or rewatch specific episodes. No shame, no gate."
- "If you can catch architecture, systems, scope, security, performance, and reading traps — you have the judgment layer. That's proficient."

---

### ACT 6: THE 10X MOMENT

---

### Z35 — "Testing — Proving Your Code Works"

**Runtime target:** 20–22 min
**Pillar:** Workflow
**Search intent:** "testing for beginners," "Vitest tutorial," "TDD with AI," "unit tests vs integration tests"

**Prerequisites:** Z34.

**Learning objectives:**
- Write unit, integration, and end-to-end tests for a real feature
- Explain why tests are the verification layer AI can't provide for itself
- Apply the test-before-code pattern on a small feature

#### Thesis
Tests are the verification layer AI can't provide for itself. Every AI model writes code that runs. Only tests prove it works. This is the callback to Pipeline P4 — TDD matters more with AI than without it, because AI's "I tested it" is unreliable in a way humans' is not.

#### Outline
1. **Why tests more with AI, not less** (2 min) — AI writes tests that confirm what it coded, not what was specified. The argument for tests flips with AI. Quick recap of Pipeline P4.
2. **The test pyramid** (3 min) — Unit (cheap, many), integration (medium, some), end-to-end (expensive, few). When to use each. Demo a pyramid for a real feature.
3. **Vitest basics** (4 min) — `describe`, `it`, `expect`. Running tests. Watching mode. Demo with a pure function, then a component.
4. **Testing React components** (3 min) — React Testing Library. Render, queries, user events. What to test (behavior) vs what not to test (implementation).
5. **Test-before-code with AI** (4 min) — Ask AI to write tests from the spec first. Review them. Implement to pass. Demo a small feature end-to-end.
6. **Coverage and meaningful tests** (2 min) — 100% coverage is not the goal. Meaningful coverage is. Show the difference.
7. **Close** (60s) — "Tests are the trust layer between you and the AI. Build them. They pay every day for the rest of your career."

#### Key visuals
- Test pyramid diagram
- Vitest terminal output (red → green transition)
- React Testing Library query examples
- TDD cycle with AI: spec → tests → implementation

#### Source materials
- Vitest docs
- React Testing Library docs
- Pipeline P4 ("Why I Make AI Write Tests Before Code")

#### Shorts potential
- "Tests are the verification layer AI can't provide for itself. Every AI model writes code that runs. Only tests prove it works."
- "AI writes tests that confirm what it coded. Specify first. Test against the spec. Implement last. Order matters."

---

### Z36 — "Code Review — How to Review AI Output"

**Runtime target:** 18–22 min
**Pillar:** Workflow
**Search intent:** "code review best practices," "reviewing AI generated PRs," "pull request review guide," "PR etiquette"

**Prerequisites:** Z28, Z35.

**Learning objectives:**
- Review a pull request with the six-question checklist applied as professional practice
- Write review feedback that improves future output
- Know the etiquette of reviewing your own AI output before asking others

#### Thesis
The Z28 checklist as a professional practice. Code review is where the judgment layer meets daily work. Review your own AI output before humans review it. Review teammates' AI output the way you'd want yours reviewed — specifically, actionably, kindly. This is what "professional developer who uses AI" looks like day-to-day.

#### Outline
1. **Review as practice, not event** (2 min) — Review isn't a gate at the end. It's a constant. You review what AI produced. Then others review your change. Then you review theirs. Flow.
2. **The self-review** (3 min) — Before asking a human to review an AI-generated PR, do the six-question checklist yourself. Catch the easy stuff before wasting a human's time. Demo.
3. **Reviewing teammates' AI output** (4 min) — Assume good intent. Ask clarifying questions over assertions. Flag concrete issues, not stylistic preferences. Demo a good review comment vs a bad one.
4. **The comment types** (3 min) — Question, suggestion, blocker, nit. Which ones stop a merge. Which ones are FYI. How to label. Demo.
5. **Reviewing a real PR** (4 min) — Take a real PR (from the learning repo or Party Masters). Apply the full practice. Produce the review.
6. **Receiving feedback** (2 min) — Not defensive. Discuss when you disagree. Ship when you agree. Demo the reply etiquette.
7. **Close** (60s) — "Code review is where the profession actually happens. AI made producing code cheap. Good review makes shipping code possible."

#### Key visuals
- Self-review flow (AI produces → you review → you push)
- Good vs bad review comments side-by-side
- Comment type labels (question, suggestion, blocker, nit)
- A real PR with review comments

#### Source materials
- Google's Code Review Developer Guide (link)
- Agent Team Tactics T2 (the checklist)
- A sample PR with good and bad review comments (create and link)

#### Shorts potential
- "Review your own AI output before asking a human to review it. Catch the easy stuff. Respect their time."
- "Four comment types: question, suggestion, blocker, nit. Label them. Makes review faster for everyone."

---

### Z37 — "Shipping — CI/CD and Production"

**Runtime target:** 20–22 min
**Pillar:** Delivery
**Search intent:** "GitHub Actions tutorial," "CI CD for beginners," "deploy to production," "production monitoring basics"

**Prerequisites:** Z26, Z36.

**Learning objectives:**
- Set up a GitHub Actions pipeline that lints, tests, and deploys
- Read production logs and respond to errors
- Know the basics of monitoring and alerting

#### Thesis
Shipping means getting code from your laptop to users reliably. CI/CD automates the "don't ship broken code" part. Monitoring catches what slipped through. Together they're the difference between "I wrote a feature" and "real users are using a feature without it breaking."

#### Outline
1. **What CI/CD actually is** (2 min) — Continuous integration: every commit runs checks. Continuous deployment: passing commits ship. Demystified.
2. **GitHub Actions basics** (5 min) — YAML workflow files. Triggers. Jobs. Steps. Demo: a workflow that runs lint and tests on every PR.
3. **Deployment on merge to main** (3 min) — Vercel's default. What a green pipeline looks like. What to do on red. Demo.
4. **Secrets management** (2 min) — GitHub secrets. Vercel env vars. Never in code. Demo.
5. **Monitoring — the basics** (3 min) — Vercel logs. Sentry (or equivalent) for errors. Uptime monitors. What to set up on day one of a real project.
6. **Incident response** (3 min) — Production is broken. Now what? Revert first, investigate second. Communicate. Demo the revert flow.
7. **Close** (60s) — "Shipping is a discipline. Tests + CI + monitoring + revert-first culture = software that actually works for users."

#### Key visuals
- CI/CD pipeline visualization (commit → checks → deploy)
- GitHub Actions YAML on screen
- Sentry error detail view
- Revert flow (green → red → revert → green)

#### Source materials
- GitHub Actions docs
- Sentry free tier signup
- Sample workflow file (commit and link)

#### Shorts potential
- "CI/CD: every commit runs checks. Passing commits ship. That's the whole discipline."
- "Production broken? Revert first. Investigate second. Communicate always."

---

### Z38 — "Managing AI Agents Like a Team Lead"

**Runtime target:** 20–22 min
**Pillar:** Workflow
**Search intent:** "AI agent orchestration," "Claude Code skills," "multi-agent workflow," "AI team management"

**Prerequisites:** Z35–Z37.

**Learning objectives:**
- Delegate work across multiple AI agents in parallel
- Manage context across agent sessions
- Enforce standards via skills, CLAUDE.md, or equivalents

#### Thesis
Agent Team Tactics T1 at graduation level. You're not just pairing with AI anymore — you're leading. Delegation across multiple agents. Context handoffs between sessions. Standards enforced mechanically, not remembered. This is what a proficient AI developer looks like in their daily flow.

#### Outline
1. **From pair to team** (2 min) — Single-agent pairing is a starting point. Multi-agent orchestration is the professional level. Introduce the shift.
2. **Parallel delegation** (4 min) — Breaking a task into pieces that can run concurrently. Separate context windows for separate jobs. Demo: frontend agent and backend agent working in parallel.
3. **Context management as a profession** (4 min) — What goes in, what stays out. When to start fresh. When to summarize. CLAUDE.md as persistent project knowledge. Demo.
4. **Standards enforcement mechanically** (3 min) — Skills files. Hooks. Pre-commit checks. The standards that used to live in your head now live in the repo. Demo configuring one.
5. **Review at scale** (2 min) — When agents produce more than you can review manually, what changes? Preview Pipeline P6's 105 beats concept. Tests + CI + sampling.
6. **The typical daily flow** (3 min) — Morning: plan in a short session. Day: delegate, review, commit. Evening: knowledge capture. Demo a compressed day.
7. **Close** (60s) — "You're no longer the one typing. You're the one directing. The job isn't smaller — it's different. This is what it looks like."

#### Key visuals
- Single-agent vs multi-agent diagram
- CLAUDE.md and skills on screen
- Parallel task delegation (two Claude sessions running)
- A compressed "day in the life" timeline

#### Source materials
- Agent Team Tactics T1 (foundational)
- Pipeline P6 (preview of the orchestrated version)
- Travis Gautier CLAUDE.md and skills directory (real examples)

#### Shorts potential
- "You're no longer the one typing. You're the one directing. That's what proficient AI developer looks like day-to-day."
- "Standards that used to live in your head now live in the repo. Skills files. CLAUDE.md. Hooks. Standards mechanical, not remembered."

---

### Z39 — "The Travis Gautier Pipeline — Graduation Project"

**Runtime target:** 25–30 min
**Pillar:** Workflow (crosses into Delivery)
**Search intent:** "TDD pipeline AI," "Travis Gautier pipeline tutorial," "AI development methodology," "structured AI workflow"

**Prerequisites:** Z1–Z38. This is the graduation.

**Learning objectives:**
- Run the full Travis Gautier Pipeline on a real feature
- Produce a shippable feature using the integrated system
- Earn the "proficient AI developer" designation honestly

#### Thesis
The full Pipeline playlist methodology, applied to a feature you build end-to-end. Discovery → red → green → refactor → finish. This is the graduation project. You produce a shippable feature using the integrated system. The tactics and fundamentals all converge here.

#### Outline
1. **Why this is the graduation** (90s) — Everything before was fundamentals. This is the synthesis. A real feature, built with the pipeline.
2. **The project** (3 min) — A well-scoped small feature in the learning repo. Not trivial, not huge. Something like "add a comment feature to the blog." Show the spec.
3. **Discovery phase** (5 min) — The 5 YAML contracts. Walk through producing each one. What the output looks like.
4. **Red phase** (4 min) — Write tests across all 10 categories. Demo a subset. Run them. They fail.
5. **Green phase** (4 min) — Implement to pass the tests. Demo the implementation flow. Tests go green.
6. **Refactor phase** (3 min) — Quality improvements while tests stay green. Demo.
7. **Finish phase** (3 min) — Cleanup, documentation, commit. The feature is shipped. Demo.
8. **What you just proved** (2 min) — You executed a professional development methodology end-to-end using AI. That's proficient. Congratulations earned.
9. **The next playlist** (90s) — If this episode interested you, the full Pipeline playlist (12 episodes) is the deep dive. This was the compressed graduation version.
10. **Close** (60s) — "You shipped a feature using a professional methodology, with AI doing most of the execution and you doing all the judgment. That's the graduation."

#### Key visuals
- Full pipeline diagram (6 phases)
- Each phase producing real artifacts on screen
- Tests going from red to green
- The final shipped feature running in the deployed app

#### Source materials
- The full Travis Gautier Pipeline playlist (docs/playlists/the-pipeline.md)
- Travis Gautier skills directory
- The graduation project spec (create and link)
- The completed graduation project commits

#### Shorts potential
- "Graduation: ship a real feature using the full Travis Gautier Pipeline. Discovery, red, green, refactor, finish. That's proficient."
- "AI does most of the execution. You do all of the judgment. Shipped feature, professional methodology, full loop. That's the unlock."

---

### Z40 — "Your Next 10X"

**Runtime target:** 20–25 min
**Pillar:** Future
**Search intent:** "developer career 2026," "after bootcamp what next," "freelance developer path," "how to get hired as a developer"

**Prerequisites:** Z39.

**Learning objectives:**
- Articulate what "proficient AI developer" means in the market
- Choose between freelance, startup, and corporate paths
- Know what takes years (seniority, taste, judgment at scale) vs what doesn't

#### Thesis
Proficient is where real work starts. The curriculum ends with a clear picture of the career ahead. The paths (freelance, startup, corporate, consulting). What separates proficient from senior (years). What compounds over time (judgment, taste, portfolio, relationships). A final, honest CTA: you're ready. Now go.

#### Outline
1. **What "proficient" means in the market** (3 min) — In 2026: you can be productive on a real codebase within weeks, you can review and judge AI output reliably, you can ship features end-to-end with oversight. Contextualize: proficient is entry-level-to-mid. Not senior. Senior is years.
2. **The freelance path** (3 min) — How to start. How to price. Discovery as a paid phase (callback to Building Party Masters). Where to find clients. What year one looks like.
3. **The startup path** (3 min) — What startups hire for. Small teams, broad responsibilities. Why judgment matters more than any single skill. How to get an interview.
4. **The corporate path** (2 min) — Bigger teams, deeper specialization, more process. The slower-but-safer path. What to look for in a first role.
5. **The consulting path** (2 min) — Travis Gautier's own path. Building projects, documenting them, charging for expertise. The longer arc.
6. **What compounds** (3 min) — Portfolio (shipped projects). Relationships (people who've worked with you). Judgment (the thing this curriculum built). Domain expertise (years in a vertical). Reputation.
7. **What takes years** (2 min) — Seniority isn't a set of techniques. It's experience with failure modes. Taste isn't knowable from the outside. Both take time. No hack.
8. **Contributing to LLL** (2 min) — Every problem you solve as a proficient developer is worth preserving. Zero to 10X → Large Language Library contribution → ecosystem. Preview the LLL plugin workflow.
9. **The final CTA** (2 min) — "You are a developer now. A proficient one. Here's the list of the next ten things to do this week." Make it specific.
10. **Close** (90s) — "Forty episodes ago you had zero experience. Today you have a shipped app, a methodology, and judgment. Proficient is not the end — it's the real beginning. Go build something that matters."

#### Key visuals
- The four career path overview
- What compounds over time vs what takes years
- Portfolio checklist graphic
- The final CTA "your next 10 actions"

#### Source materials
- Building Party Masters (for the consulting path)
- Building Large Language Library (for the contribution path)
- Market data on 2026 developer hiring

#### Shorts potential
- "Proficient is not the end of the learning arc. It's the start of the career arc. Senior takes years. No hack."
- "What compounds: portfolio, relationships, judgment, domain expertise, reputation. Build these deliberately."
- "Forty episodes from zero to proficient. Free. Now go build something that matters. That's the curriculum."

---

## Cross-Playlist Integration

### Agent Team Tactics tie-ins (especially T8)
- **T8 "When AI Fails" is the diagnostic. This curriculum is the treatment.** T8 names the four failure modes; Act 5 (Z27–Z34) teaches the skills that close each gap.
- Specifically: T8 judgment → Z30 · T8 debugging → Z29 · T8 novel patterns → Z28 · T8 scope → Z31
- T1 "Manage AI Agents Like a Dev Team Lead" previewed at graduation level in Z38
- T2 six-question review checklist is the basis of Z28 and Z36
- T3 database design four-stage prompt chain introduced in Z25
- T5 structure-first spec approach used throughout Act 4

### The Travis Gautier Pipeline tie-ins
- The full Pipeline is the graduation project in Z39 — students don't use the pipeline until they've built the foundation
- Pipeline P4 (tests before code) introduced at learning level in Z35
- Pipeline P5 (specification) principles underlie all of Act 4
- Pipeline P7 (knowledge that compounds) is a meta-message of the whole curriculum
- Pipeline P8 (where AI fails) shares DNA with Act 5 — both map the boundary

### Building Party Masters tie-ins
- Real examples from Party Masters are used throughout (Z29's Wix webhook, Z30's schema decision, Z31's ANDY-FEEDBACK-TRIAGE)
- By Z40, students understand enough to watch Building Party Masters as a working developer, not as an aspirational viewer
- Party Masters episodes can reference back: "for the fundamentals behind what we just did, see Zero to 10X Z[N]"

### Building Large Language Library tie-ins
- Z40 introduces LLL as a contribution path for graduating developers
- LLL's governance council concept referenced in Z27 as "what rigorous knowledge validation actually looks like"
- LLL plugin workflow introduced in Z40 — how to submit your first solved problem

### Night Build tie-ins
- Live teaching sessions on stream for specific Z episodes (highest-demand ones — Z5 setup, Z15 reading, Z29 debugging)
- Student questions answered live — "office hours" format
- Community submissions for the Z34 judgment test project and Z39 graduation project

### Shorts strategy
- Each episode produces 2–3 Shorts (~100 total across the curriculum)
- Highest-performing will be Act 5 — "what AI can't do" content is shareable to both beginners and experienced devs
- Z1 establishes the brand frame: "zero to proficient in 40 episodes, free forever"
- Z40's "you are a developer now" montage is the emotional payoff short

### Community & Ecosystem (Tier 5)
- "Zero to 10X Study Groups" — community cohorts progressing through the curriculum together
- "Review My Project" — Z26, Z34, and Z39 projects reviewed on stream
- "Office Hours" — weekly live Q&A tied to current-cohort episodes
- "Fork the Curriculum" — showcase viewers who adapted the curriculum for specific domains (DevOps track, backend-first track, etc.)

---

## Production Notes

### Recording order
Sequential recording mostly matches playlist order, but some exceptions:

1. **Z1, Z3, Z27** first as pilots — Z1 for discovery, Z3 for positioning against hype, Z27 for the Act 5 differentiator
2. **Z5, Z10** next — practical setup episodes anchor viewer expectations
3. **Z15, Z16** early in Act 3 recording — reading and debugging are the most underrated skills
4. **Act 4 episodes (Z19–Z26)** recorded as a block to maintain continuity in the learning-repo app
5. **Act 5 (Z27–Z34)** recorded as a block — highest production value, highest differentiation
6. **Z34 judgment test project** needs to be designed before Z28–Z33 are recorded (so traps are deliberate)
7. **Z39 graduation project** needs to be scoped before Act 4 so the learning repo grows toward it
8. **Z40** recorded last — retrospective narration over the curriculum arc

### Data and assets to capture
- [ ] Full learning repo at each episode's checkpoint (tagged in git)
- [ ] Screen recordings of real AI-coding sessions for Z10, Z15, Z16, Z22, Z23, Z25
- [ ] The Z34 judgment test project — spec + AI-generated code with 6 deliberate traps
- [ ] The Z39 graduation project — spec + full pipeline run captured
- [ ] Real Party Masters artifacts excerpted (with permission) for Z29, Z30, Z31
- [ ] Token/cost data for Z37 monitoring content

### Template assets to create
- [ ] Curriculum roadmap poster (full 40 episodes, one image)
- [ ] Act-by-act reference sheets (6 sheets, one per act)
- [ ] Review checklist card (Z28) — branded, screenshot-worthy
- [ ] STRIDE and OWASP reference sheets (Z32)
- [ ] The judgment test scoring rubric (Z34)
- [ ] Career path decision flowchart (Z40)
- [ ] "You are a developer now" graduation graphic (Z40)

### Format discipline (Professor Messer constraints)
- Free forever on YouTube. No paywall. No sponsor gates on learning content.
- Sequential by design. Later episodes assume earlier ones. State prerequisites explicitly at the top of every episode.
- Exam-coded feel: learning objectives stated upfront, "you can now do X" at the end.
- Consistent visual identity distinct from flagship/playbook content — the curriculum is recognizable at a glance.
- No gatekeeping: zero assumed background. Jargon defined on first use. No "as you know" statements.
- Companion repo for every episode. Commits tagged with `z01`, `z02`, etc. Viewers can clone to any checkpoint.
