# Z2 — What Code Actually Is · Slides

**Runtime target:** 15–18 min
**Pillar:** Workflow
**Episode:** Z2 (Act 1: Orientation)
**Deck length:** 20 slides · ~48s average

---

## Slide 1 — Title

# Zero to 10X
### Z2 — What Code Actually Is

*[Visual: Series card. Position marker: "Episode 2 of 40 · Act 1: Orientation". Previous episode badge: Z1. Next badge: Z3.]*

---

## Slide 2 — The question

# What is code, really?

*Not "what language should I learn."*
*Not "what framework is hot."*
*The thing underneath all of that.*

*[Visual: Centered text, minimal motion. Hold three seconds.]*

---

## Slide 3 — A recipe

## A recipe is instructions for a human.

1. Preheat oven to 350°F
2. Mix flour, sugar, eggs in a bowl
3. Pour into a pan
4. Bake for 30 minutes

*The human follows the steps, interpreting where needed.*

*[Visual: A real cookbook page photo, annotated.]*

---

## Slide 4 — A program

## A program is instructions for a machine.

```js
const flour = 2
const sugar = 1
const eggs = 3
const batter = flour + sugar + eggs
console.log(batter)
```

*Same idea. Different audience.*

*[Visual: Code in a clean editor view, syntax highlighted.]*

---

## Slide 5 — The whole definition

# Code is instructions a computer can follow.

**That's it. Everything else is detail.**

*[Visual: The sentence rendered large. Hold four seconds.]*

---

## Slide 6 — What a computer actually does

## The loop every CPU runs, billions of times per second:

1. **Read** the next instruction
2. **Execute** it
3. **Move on** to the one after that

*[Visual: Animated loop diagram — three-step cycle rotating.]*

---

## Slide 7 — The superpower

## A computer has exactly two advantages over a human:

- It is **very fast**
- It is **very literal**

**Neither is intelligence. Both are useful.**

*[Visual: Two-column layout. Left: stopwatch icon + "billions/sec". Right: magnifying glass + "exact bytes".]*

---

## Slide 8 — The consequence of literal

If you tell a computer the wrong thing, very clearly, it will do the wrong thing very fast.

- It will not ask "did you mean…"
- It will not notice you typo'd a variable
- It will not fix your off-by-one

**Your instructions have to be right. AI's job is helping you be right.**

*[Visual: Screenshot of a terminal running code that looks fine but produces nonsense output.]*

---

## Slide 9 — Why we don't write binary

```
01001000 01000101 01001100 01001100 01001111
```

*That's "HELLO" in ASCII binary. The CPU runs at this level.*

**Nobody writes this. Everybody used to.**

*[Visual: Binary text, monospace, green-on-black terminal aesthetic.]*

---

## Slide 10 — Layering

## Every layer makes intent easier to express.

```
Binary        →  machine speaks this
Assembly      →  human-readable CPU instructions
C / Go        →  system-level languages
JavaScript    →  browser + everywhere
React / Next  →  frameworks on top of JS
AI agents     →  natural language on top of frameworks
```

**Each layer hides the one below. Each one adds leverage.**

*[Visual: Stacked pyramid, bottom heavy. Current layer (AI) glowing at the top.]*

---

## Slide 11 — AI is just the newest layer

- It didn't replace programming
- It added another floor on top of the stack
- You still have to know what you're asking for
- You still have to know whether the answer makes sense

*[Visual: The pyramid again, with an arrow pointing at the top layer: "we are here."]*

---

## Slide 12 — A five-line program

```js
const name = "Alice"
const hour = new Date().getHours()
const isMorning = hour < 12
const greeting = isMorning ? "Good morning" : "Good afternoon"
console.log(`${greeting}, ${name}`)
```

**Five lines. Let's read it.**

*[Visual: Full-width code editor, dark theme.]*

---

## Slide 13 — Line by line

- **Line 1:** Remember the name "Alice"
- **Line 2:** Ask the clock what hour it is
- **Line 3:** Decide: is it before noon?
- **Line 4:** Pick the right greeting
- **Line 5:** Print the greeting, using the name

**Each line is a single instruction. The computer runs them top to bottom.**

*[Visual: Code on left, annotations appearing next to each line on right.]*

---

## Slide 14 — Running it

*[Visual: Live screen recording. Terminal. Runs `node greet.js`. Output: "Good afternoon, Alice". Hold on the output.]*

**That's a program. That's programming.**

---

## Slide 15 — Everything else is bigger versions of this

A web app is the same loop — on thousands of instructions instead of five.

A database is the same loop — reading and writing data.

A React component is the same loop — running when its inputs change.

**The loop doesn't change. The scale does.**

*[Visual: The 3-step cycle from slide 6, but zoomed out — inside it is a whole app, inside a cluster, inside a data center.]*

---

## Slide 16 — What makes a good programmer

**Not typing speed.**
**Not memorizing syntax.**
**Not "thinking like a computer."**

## Three things:

- **Clear thinking** — decomposing a problem before touching code
- **Careful reading** — understanding what the code in front of you actually does
- **Honest testing** — knowing the difference between "looks right" and "is right"

---

## Slide 17 — These skills predate AI

- They predate JavaScript
- They predate the PC
- They predate electricity
- **They are not going anywhere**

*AI changed the tool. It did not change the skill.*

*[Visual: Timeline, far-left shows ancient abacus → punchcards → keyboards → AI. A thread labeled "clear thinking, careful reading, honest testing" runs unbroken through all of it.]*

---

## Slide 18 — Why this matters right now

You will be tempted to skip fundamentals because AI can type for you.

**Don't.**

The programmers who thrive with AI are the ones who understand the instructions AI is writing for them.

Fundamentals aren't optional. They're the reading comprehension for the AI era.

---

## Slide 19 — The one sentence to remember

# Code is instructions a machine follows very fast and very literally.

*Your job is making those instructions say what you actually mean.*

*[Visual: Single slide, large type. Hold four seconds.]*

---

## Slide 20 — Close

## Next up: Z3 — What AI Changed.

**If code is instructions, and AI writes instructions now — what's left for you?**

*Spoiler: more than you think. And different from what you expect.*

*[Visual: End card. Z3 thumbnail. Subscribe prompt. Bottom bar: travisgautier.com/learn.]*
