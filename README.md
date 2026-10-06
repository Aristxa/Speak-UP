# Guxo: Speak Boldly

A web app in English and Albanian for practicing public speaking. It gives you a prompt and a little time to prepare, then you speak until the timer runs out. It keeps track of your pace, filler words and nerves over time.

Live: https://aristxa.github.io/Speak-UP/

## Running it

It's a static site with no build step or dependencies:

```bash
python -m http.server 5173
# http://localhost:5173
```

It needs to be served (any static host works) because browsers only allow microphone access on `localhost` or `https`.

## Features

There are four practice modes: talk about a single word, answer a question, argue a debate (you switch sides halfway), or tell a story that connects three random words. Prompts are grouped into 11 categories, including Albanian culture, and all of them exist in both languages, with search in both. There's also a daily challenge that's the same for everyone.

A session goes like this:

1. rate how nervous you are (1–5)
2. optional breathing warm-up (4-2-6)
3. preparation time, with a speech structure to follow (PREP, Past-Present-Future and others)
4. speaking time, with a countdown and a mic level meter; if you go quiet for 4+ seconds you get a gentle nudge

While you speak it records audio, or video if the camera mirror is on, which you can play back or download. In Chrome and Edge it also shows a live transcript with words per minute and highlighted filler words for each language (`um`, `like` / `ëë`, `domethënë`, `pra`…). Pause detection calibrates to the room noise during preparation and measures your longest pause and how much of the time you were actually speaking.

Afterwards you rate your nerves again, give yourself stars, write notes and get some rule-based feedback.

Speaking time grows along a "Courage Path" (30s, 1 min, 1:30, 2 min, 3 min, 5 min); three full sessions unlock the next step. The progress page has streaks, total minutes, a before/after nervousness chart, 12 badges, history, and JSON export/import.

Light and dark themes, a mobile layout, keyboard shortcuts (Enter / Esc) and reduced motion are supported. Everything is stored in `localStorage`; nothing is uploaded.

## Files

```
index.html        page shell, header, footer
css/styles.css    design tokens (light/dark) and styles
js/i18n.js        UI strings in en + sq, t() helper
js/prompts.js     prompts, speech structures, tips, nudges, filler word lists
js/storage.js     settings and history, streaks, Courage Path, badges
js/audio.js       mic/camera, level meter, pause detection, recorder, speech recognition, analysis
js/app.js         router and views (home, practice, session, results, topics, progress)
```

New prompts go into a category in `js/prompts.js` as `{ en, sq }`. A new language needs a block in `STRINGS`, the matching keys in the prompt data and a filler word list.
