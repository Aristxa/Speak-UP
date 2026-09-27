# Guxo: Speak Boldly

**Live:** https://aristxa.github.io/Speak-UP/

A bilingual (English / Albanian) web app that helps people overcome their fear of public speaking.
The app gives you a prompt and a short time to prepare. You then speak on it until the timer runs out.
Your pace, filler words and nerves are tracked over time.

## Run it

It's a static site with no build step and no dependencies.

```bash
python -m http.server 5173
# then open http://localhost:5173
```

A server (or any static host such as Netlify, Vercel or GitHub Pages) is needed for the microphone to work.
Browsers only allow mic and camera access on `localhost` or `https`.

## Features

- **4 practice modes**
  - **Single word:** talk about one word.
  - **Question:** answer an impromptu question.
  - **Debate:** argue for a statement, then switch sides halfway through.
  - **Story:** connect three random words into one story.
- **Topics to browse:** 11 categories (including *Albanian Culture*) plus debates.
  - Every prompt is available in EN and SQ, and search works in both languages.
- **Daily challenge:** the same prompt for everyone on a given day.
- **Session flow**
  1. A nervousness check-in (1–5).
  2. An optional breathing warm-up (4-2-6).
  3. Preparation time with a speech structure (PREP, Past-Present-Future, and others).
  4. Speaking time, with a countdown ring and a mic level meter.
  5. Gentle nudges when you go quiet for 4 seconds or more.
- **Recording:** audio (or video with the camera mirror). You can play it back and download it.
- **Live transcript** (Chrome/Edge Web Speech API):
  - word count and words per minute
  - filler-word detection per language (`um`, `like` / `ëë`, `domethënë`, `pra`…), highlighted in the transcript.
- **Pause detection:** calibrates to room noise during preparation, then measures your longest pause and how much of the time your voice was active.
- **Reflection:** rate your nervousness again, give yourself stars, and write notes. You also get rule-based feedback.
- **Courage Path:** 30s → 1 min → 1:30 → 2 min → 3 min → 5 min. Three full-length sessions unlock the next level. The default speaking time follows your level.
- **Progress:** streaks, total minutes, a chart of nervousness before and after, 12 badges, history, and JSON export/import.
- Light and dark themes, a mobile layout, keyboard shortcuts (Enter / Esc), and reduced-motion support.

All data stays in `localStorage`. Nothing is uploaded.

## Project layout

```
index.html        page shell, header, footer
css/styles.css    design tokens (light/dark) and all styles
js/i18n.js        UI strings in en + sq, t() helper
js/prompts.js     prompt library, frameworks, tips, nudges, filler lists
js/storage.js     settings/history persistence, streaks, Courage Path, badges
js/audio.js       mic/camera capture, level meter, pause detection, recorder, speech recognition, analysis
js/app.js         router and views (home, practice, session, results, topics, progress)
```

To add prompts, append `{ en, sq }` items to a category in `js/prompts.js`.
To add a language, add a block in `STRINGS`, the matching keys in the prompt data, and a filler list.
