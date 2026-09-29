# Facilitator script — one session

Print this. Read the **bold** lines verbatim; improvise anywhere else and you contaminate the result.

Companion to `VALIDATION-PLAN.md`, which fixed the questions and the pass bars before any session was run. Do not change either after you start — a bar moved to fit the data is not a bar.

**Time:** 15 minutes. **You need:** this page, a timer, the scoring sheet (one per participant), a device with the site open to the About page.

---

## Before they arrive (2 min)

- [ ] Site loads. Run one analysis yourself and close it, so the first fetch is warm.
- [ ] Browser at the **About** page. Not Analyze — they have to find it.
- [ ] Note the **screen width** they will use. A phone session is worth more than a fifth laptop session; a mobile-only failure is invisible in desktop-only testing.
- [ ] Scoring sheet blank, participant number written on it. **No name.**
- [ ] If a minor: teacher or parent already aware, per school policy.

---

## 1. Consent (30 sec)

> **"I'm testing a website I built. I'm not testing you — if something is confusing, that's the site's fault and it's exactly what I need to find. Fifteen minutes, no names written down, nothing recorded. You can stop at any point. Okay to start?"**

Wait for a clear yes. If they hesitate at all, thank them and stop.

---

## 2. The task (30 sec)

Hand them the device. Read once, verbatim:

> **"Your school wants to plant a bioenergy crop. Using this site, compare switchgrass in two Texas locations and tell me which looks more promising, why, and how sure you are."**

If they ask a question, say:

> **"Whatever you think — I'd rather see what you'd do on your own."**

Then stop talking.

---

## 3. Observation (10 min)

Say nothing. This is the hard part and it is the whole method.

**Never say:** "try clicking WHY", "scroll down", "did you see the confidence part", "that's the one", "not quite", "yeah". No pointing. No nodding at the right answer. If you catch yourself steering, write it on the sheet — a steered session still has value if it is *labelled* as steered.

**You may say only:**
- If stuck >90 s: **"What are you thinking?"**
- If they ask you to interpret: **"What do you make of it?"**
- If genuinely broken: **"That looks like a bug — carry on however you like."**

**Record as it happens** (times matter more than adjectives):
- Time to first correct interpretation
- Whether they opened a `WHY?` panel **without prompting** — the key affordance signal
- Every confusion point, plus the element that caused it
- Anything they said out loud, verbatim, especially complaints

At 10 minutes: **"That's time — let's talk about what you found."**

---

## 4. The three questions (3 min)

Ask in order. Do not rephrase. Write answers **verbatim** — not your summary of them.

> **Q1. "Which of the two locations looked more promising, and what one thing was driving that difference most?"**

> **Q2. "How does that factor actually affect the plant, biologically?"**

> **Q3. "How much would you trust that conclusion, and what's the main reason it isn't more certain?"**

If an answer is short: **"Say more?"** — once, then move on. Never supply a candidate answer.

---

## 5. Close (30 sec)

> **"Last thing — what was the single most confusing part?"**

Write it verbatim. It is usually the most valuable line on the sheet.

> **"Thank you. That was genuinely useful."**

---

# Scoring rubric

Score immediately, before the next session, while it is fresh. Score against what they *said*, not what you think they understood.

### Q1 — Direction · pass bar ≥ 80%

**Correct:** names the location the app actually scored higher **and** names a driving factor the app actually surfaced as a top contributor (heat, water-demand proxy, VPD, or surface soil moisture).

**Incorrect:** wrong location; or right location with a factor the app did not flag; or right location with no factor at all.

*Check the app's own WHY panel for that comparison — the top contributor is whatever the panel lists first. Do not score from memory.*

### Q2 — Mechanism · pass bar ≥ 60%

**Correct:** describes a biological mechanism in their own words. Any of: stomata closing / the plant shutting down to save water; heat damaging or stressing the plant's tissue or processes; the plant losing more water than it takes up; growth stopping because the plant is conserving water.

**Incorrect:** restates the score ("it was 37, so it's stressed"); names the factor without a mechanism ("because it's hot"); or invents a mechanism the app never shows.

*Vocabulary is not the test. "The little pores shut so it stops eating sunlight" is a pass.*

### Q3 — Certainty · pass bar ≥ 60% — **this is the real test**

**Correct:** names a limitation the app actually reports. The closed list:
- cultivar / variety unknown
- growth stage unknown
- soil salinity unknown, or no soil measurement
- the model is uncalibrated / experimental / not validated
- the biology or fuel part is inferred rather than measured
- nothing about the plant itself is measured
- the data is a grid estimate, not a sensor at that spot
- a data source failed, so part of it is missing

**Incorrect:** "it's just an estimate"; "computers can be wrong"; "I'd trust it" with no reason; naming a limitation the app never states.

*The distinction that matters: did the app **teach them** a specific limitation, or did they fall back on generic scepticism they walked in with? Only the first counts.*

---

# After each session

- [ ] Score all three now, not later
- [ ] Copy verbatim answers into the tracker
- [ ] Note screen width and whether they opened `WHY?` unprompted
- [ ] Note if you steered them at any point — mark the session, do not discard it
- [ ] Fix nothing yet. Changing the app mid-run means you tested two different apps

# After all sessions

Compare against the bars fixed in `VALIDATION-PLAN.md`. Then write down what actually happened, including the parts that went badly.

A result below the bar is a finding, not a failure — "6 of 10 could rank the sites but only 3 could say why the answer was uncertain" is a more interesting sentence than any number above the bar, and it tells you exactly what to build next. Reporting it is also the only version consistent with a project built around evidence honesty.

**Do not report:** made-up numbers, sessions that did not happen, or a bar quietly lowered afterwards.
