# Guess a Word

A small, responsive word game. Find the hidden word one letter at a time, with six chances for incorrect guesses.

## Play

- Tap the on-screen keyboard or type an English A–Z letter.
- Correct guesses reveal every matching letter. Repeated guesses never cost a chance.
- A category gives you a clue. Find the entire word before six incorrect guesses.
- Won and lost rounds show the answer and offer **Play another word**, without reloading.
- **New word** asks before clearing a round with guesses. Escape or **Keep playing** cancels.
- Your round survives a refresh in the same tab. If browser storage is unavailable, play still works and the app explains that refresh recovery is unavailable.

No account, analytics, server, payment, or personal information is required. Round data is stored only in your browser's session storage; closing the tab normally ends the session. This is a casual client-side game, so the word list and answers are not hidden from developer tools.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Build and preview a static release:

```sh
npm run build
npm run preview
```

Deploy the contents of `dist/` to a static host. Assets use relative URLs so a subdirectory such as `/demos/guess-a-word/` works without changing the build. The game has no client-side routes or server fallback requirement.

## Verify

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run check
```

- Unit tests exercise immutable guesses, validation, repeated letters, exact win/loss boundaries, replay, and valid/corrupt/blocked session storage.
- Browser tests cover physical keyboard, touch, refresh, canceled/confirmed restart, win/loss and replay, narrow layouts, runtime errors, and automated accessibility checks.
- Browser coverage runs in desktop Chromium and an emulated Pixel 7 viewport. It does not claim native Android/iOS or screen-reader certification.
- CI runs the full check command using Node 24.

To use an existing Chromium installation in constrained environments:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

## Implementation

React 19 with a Vite 8 build. `src/game.js` owns the pure game rules and session validation. `src/App.jsx` owns rendering, keyboard input, live feedback, and the native confirmation dialog. The session format is versioned and rejected if it contains invalid words, duplicate guesses, or guesses after the round already ended.

The original 2021 React/Redux project has been preserved in Git history. This completion replaces its split mutable state and full-page redirects with a single immutable round, removes the unused name/phone form, and replaces the legacy Create React App toolchain.
