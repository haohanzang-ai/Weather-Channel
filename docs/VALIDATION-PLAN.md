# Validation plan

**Status: not yet conducted. No results are recorded below, and none are claimed anywhere in the app or its documentation.**

This document exists because "we assumed people would find this useful" is the weakest part of most student projects, and because fabricating survey data would contradict the entire premise of a tool built around evidence honesty. The protocol is written in advance so that when sessions are run, the result is whatever it is.

---

## What is actually being tested

Not "did they like it". The app's claim is that it makes an evidence-aware biological interpretation *legible to a non-expert*. So the test is comprehension, and the bar is that a first-time user can independently answer three questions after using the app unassisted:

**Q1 — Direction.** Which of these two environments (or two crops) appears more compatible, and which single factor is driving that difference most?

**Q2 — Mechanism.** Through what biological mechanism does that factor act? (A correct answer names stomatal limitation, thermal stress, or water deficit — not the score.)

**Q3 — Certainty.** How much should you trust that conclusion, and what is the main reason it isn't more certain?

**Q3 is the real test.** Q1 and Q2 are answerable by any competent dashboard. If users can rank two sites but cannot articulate *why the answer is uncertain*, the central feature has failed regardless of how good the interface looks.

## Success criteria, fixed in advance

| Question | Target | Why this bar |
|---|---|---|
| Q1 Direction | ≥ 80% correct | Basic legibility. Below this, the results hierarchy is broken |
| Q2 Mechanism | ≥ 60% correct | The biology step is genuinely harder; partial success is still informative |
| Q3 Certainty | ≥ 60% name a real limitation | The differentiating feature. Below this, the confidence engine is decoration |

A "real limitation" means naming something the app actually reports — no cultivar, no soil measurement, uncalibrated model, inference distance — rather than a generic "it's just an estimate".

## Protocol

**Participants.** Target 8–12: a mix of high-school science students (primary audience), 2–3 teachers (secondary), and 1–2 people with no biology background (control for jargon). Small-n and non-random; this is formative usability testing, not a study, and it will be described as such.

**Setup.** Unassisted, think-aloud, 10–15 minutes, on their own device. No walkthrough first — the app has to work without one. Note the screen width used, because a mobile-first failure would be invisible in desktop-only testing.

**Task.** "Your school wants to plant a bioenergy crop. Compare switchgrass in two Texas locations and tell me which looks more promising, why, and how sure you are."

**Recording.** Verbatim answers to Q1–Q3; every point of visible confusion with the element that caused it; time to first correct interpretation; whether they opened a `WHY?` panel unprompted (a proxy for whether the affordance reads as clickable).

**Ethics.** Verbal consent; no names, no recordings, no personal data retained. Minors participate only with teacher or parent awareness, consistent with school policy.

## Running a session

Two companion files make this executable rather than aspirational:

- **`VALIDATION-FACILITATOR-SCRIPT.md`** — printable, one page. Verbatim wording for the consent, the task and the three questions; an explicit list of things the facilitator must not say; and the scoring rubric, including the closed list of limitations that count as a correct Q3.
- **`TexasClimate-validation-tracker.xlsx`** — one row per participant. Scores against the bars above automatically, breaks results down by group, and counts *which* limitation each participant named — which is the interesting question. Naming "cultivar unknown" means the app taught them something specific; "it's just an estimate" is scepticism they walked in with, and scores zero.

The bars live in this document and are computed in the tracker. Neither should be edited once the first session has run.

## Results

*Empty until sessions are actually run. Any published claim about user validation will link to this table.*

| Date | n | Q1 correct | Q2 correct | Q3 correct | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | Not yet conducted |

## Known threats to validity, stated now

- **Small n, non-random recruitment.** Results will be directional, not statistically meaningful. They will be reported as usability findings, never as evidence of demand or impact.
- **Acquiescence bias.** Participants recruited through the author will tend toward positive feedback. Comprehension questions are scored right/wrong specifically to blunt this — a participant who enjoys the app but cannot answer Q3 counts as a failure.
- **Author-run sessions.** Facilitator effects cannot be eliminated at this scale. Task wording is fixed in advance and read verbatim to limit them.
- **Comprehension is not usefulness.** Passing all three bars would show the app *communicates* its reasoning. Whether anyone's decision improves as a result is a separate and much harder question this protocol does not attempt.

## Analytics currently in place

The site loads Google Analytics (measurement ID `G-EPP05BJFJ3`) from `index.html`. That is page-level traffic measurement only — it records visits, not anything about an analysis a user runs. **None of the product instrumentation described below exists**, and no analytics data has been or will be used to support any claim about validation or usefulness.

Because the stated audience is high-school students, this should be treated as a live privacy question rather than a settled one: the honest options are to disclose the tracker in the interface, or to remove it. It is documented here so that it is not an undisclosed omission.

## Instrumentation that would help, and is not implemented

Anonymous, aggregate, opt-in only — and worth stating that none of it exists today: `WHY?` panel open rate (does anyone look?), Model Cards visit rate (does the honesty layer get read?), scenario usage, and drop-off point in the six-step pipeline. Each would answer a question this protocol can only sample.
