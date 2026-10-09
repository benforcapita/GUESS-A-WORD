import { useEffect, useRef, useState } from 'react';
import {
  MAX_MISSES,
  createRound,
  getRound,
  guessLetter,
  restoreRound,
  saveRound,
} from './game.js';

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
function sessionStore() {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
function Arrow({ className = '' }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [round, setRound] = useState(
    () => restoreRound(sessionStore()) ?? createRound(),
  );
  const [canSave, setCanSave] = useState(true);
  const [restartOpen, setRestartOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(
    'Choose a letter to get started.',
  );
  const dialog = useRef(null);
  const boardHeading = useRef(null);
  const resultHeading = useRef(null);
  const view = getRound(round);
  const finished = view.status !== 'playing';

  useEffect(() => {
    setCanSave(saveRound(sessionStore(), round));
  }, [round]);
  useEffect(() => {
    function onKeyDown(event) {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        restartOpen ||
        event.target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) ||
        !/^[a-z]$/i.test(event.key)
      )
        return;
      event.preventDefault();
      setRound((current) => guessLetter(current, event.key));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [restartOpen]);
  useEffect(() => {
    if (restartOpen) dialog.current.showModal();
    else if (dialog.current.open) dialog.current.close();
  }, [restartOpen]);
  useEffect(() => {
    const current = getRound(round);
    const last = round.guesses.at(-1);
    if (current.status === 'won')
      setAnnouncement(`Nicely done! You found ${current.word}.`);
    else if (current.status === 'lost')
      setAnnouncement(
        `No chances left. The word was ${current.word}. Try another word.`,
      );
    else if (last)
      setAnnouncement(
        `${last} is ${current.word.includes(last) ? 'in the word' : 'not in the word'}. ${current.remaining} ${current.remaining === 1 ? 'chance' : 'chances'} left.`,
      );
    else setAnnouncement('Choose a letter to get started.');
    if (current.status !== 'playing') resultHeading.current?.focus();
  }, [round]);

  function startNewRound() {
    setRestartOpen(false);
    setRound((current) => createRound(current.wordId));
    requestAnimationFrame(() => boardHeading.current?.focus());
  }
  function requestNewRound() {
    if (!finished && round.guesses.length > 0) setRestartOpen(true);
    else startNewRound();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#play">
        Skip to game
      </a>
      <header className="site-header">
        <a
          className="wordmark"
          href="#play"
          aria-label="Guess a Word, go to game"
        >
          <span className="brand-icon" aria-hidden="true">
            w<span>·</span>
          </span>
          <span>
            guess a word
            <span className="brand-caption">
              A SMALL GAME FOR A LITTLE BREAK
            </span>
          </span>
        </a>
        <span className="header-note">
          <span aria-hidden="true" /> Free to play. Yours to solve.
        </span>
      </header>

      <main className="main-grid">
        <section className="intro" aria-labelledby="intro-title">
          <p className="eyebrow">
            <span aria-hidden="true">✳</span> THE EVERYDAY WORD BREAK
          </p>
          <h1 id="intro-title">
            One word.
            <br />
            Six chances.
            <br />
            <span>All you.</span>
          </h1>
          <p className="intro-copy">
            A little mystery, one letter at a time.
            <br className="desktop-break" /> Find the hidden word before your
            <br className="desktop-break" /> chances run out.
          </p>
          <div className="word-art" aria-hidden="true">
            <span className="art-tile tile-one">a</span>
            <span className="art-tile tile-two">b</span>
            <span className="art-tile tile-three">?</span>
            <svg className="art-spark" viewBox="0 0 50 50">
              <path d="M25 3v44M3 25h44M9 9l32 32M9 41 41 9" />
            </svg>
          </div>
          <details className="how-to">
            <summary>
              How to play <span aria-hidden="true">+</span>
            </summary>
            <ol>
              <li>Tap a letter or use your keyboard.</li>
              <li>Every correct guess reveals all matching letters.</li>
              <li>
                You have six incorrect guesses. Repeated letters never cost a
                chance.
              </li>
              <li>Find the whole word, then try a fresh one.</li>
            </ol>
          </details>
          <p className="small-note">
            No timer. No sign-up. Just one good word.
          </p>
        </section>

        <section
          className={`game-card ${finished ? `is-${view.status}` : ''}`}
          id="play"
          aria-labelledby="board-heading"
        >
          <div className="game-topline">
            <div>
              <p className="eyebrow">YOUR NEXT LITTLE CHALLENGE</p>
              <h2 id="board-heading" ref={boardHeading} tabIndex="-1">
                Find the hidden word.
              </h2>
            </div>
            <button className="new-word" onClick={requestNewRound}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 20 20"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M16.5 8a6.7 6.7 0 1 0-.6 5M16.5 3v5h-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              New word
            </button>
          </div>
          <div className="round-info">
            <span className="category">
              <Arrow className="diagonal-arrow category-arrow" />{' '}
              {view.category}
            </span>
            <span className="letter-count">{view.word.length} letters</span>
          </div>
          <div
            className="letter-board"
            role="group"
            aria-label={`Word: ${view.revealed.map((letter) => letter || 'blank').join(' ')}`}
            style={{ '--letter-count': view.word.length }}
          >
            {view.revealed.map((letter, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`letter-tile ${letter ? 'revealed' : ''} ${view.status === 'lost' && !letter ? 'missed' : ''}`}
              >
                {letter ||
                  (view.status === 'lost' ? (
                    view.word[index]
                  ) : (
                    <span className="blank-mark" />
                  ))}
              </span>
            ))}
          </div>
          <div className="chances-row">
            <span className="chance-copy">
              <strong data-testid="chances">{view.remaining}</strong>{' '}
              {view.remaining === 1 ? 'chance' : 'chances'} left
            </span>
            <div className="chance-dots" aria-hidden="true">
              {Array.from({ length: MAX_MISSES }, (_, index) => (
                <span
                  key={index}
                  className={index < view.remaining ? 'available' : 'spent'}
                >
                  {index < view.remaining ? '✳' : '×'}
                </span>
              ))}
            </div>
          </div>
          <p
            className="feedback"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </p>

          {finished ? (
            <div className="result-panel">
              <div className="result-symbol" aria-hidden="true">
                {view.status === 'won' ? (
                  '✳'
                ) : (
                  <Arrow className="diagonal-arrow" />
                )}
              </div>
              <h3 ref={resultHeading} tabIndex="-1">
                {view.status === 'won'
                  ? 'Nicely done!'
                  : 'A good word for next time.'}
              </h3>
              <p>
                {view.status === 'won'
                  ? 'You found your word.'
                  : 'The hidden word was'}{' '}
                <strong data-testid="answer">{view.word}</strong>
                {view.status === 'lost' ? '.' : ' looks good on you.'}
              </p>
              <button className="primary-button" onClick={startNewRound}>
                Play another word <Arrow />
              </button>
            </div>
          ) : (
            <div className="keyboard" role="group" aria-label="Letter keyboard">
              {KEY_ROWS.map((row) => (
                <div className="key-row" key={row}>
                  {[...row].map((letter) => {
                    const used = round.guesses.includes(letter);
                    const correct = view.word.includes(letter);
                    return (
                      <button
                        key={letter}
                        className={`letter-key ${used ? (correct ? 'key-correct' : 'key-incorrect') : ''}`}
                        aria-label={
                          used
                            ? `${letter}, ${correct ? 'correct' : 'incorrect'}`
                            : `Guess ${letter}`
                        }
                        disabled={used}
                        onClick={() =>
                          setRound((current) => guessLetter(current, letter))
                        }
                      >
                        {letter}
                        {used && (
                          <span className="key-indicator" aria-hidden="true">
                            {correct ? '•' : '−'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              <p className="keyboard-caption">
                <svg
                  width="15"
                  height="12"
                  viewBox="0 0 20 15"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="1"
                    y="1"
                    width="18"
                    height="13"
                    rx="2"
                    stroke="currentColor"
                  />
                  <path
                    d="M4 5h1m3 0h1m3 0h1m3 0h1M4 8h1m3 0h1m3 0h1m3 0h1M6 11h8"
                    stroke="currentColor"
                    strokeLinecap="round"
                  />
                </svg>{' '}
                Type on your keyboard or tap a letter
              </p>
            </div>
          )}
          <div className="card-footer">
            <span className="footer-dot" />{' '}
            {canSave
              ? 'Your round stays with you when you refresh this tab.'
              : 'Saving is unavailable. This round will reset if you refresh.'}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>Made for the joy of figuring it out.</span>
        <span>36 words. A fresh start, every time.</span>
      </footer>

      <dialog
        ref={dialog}
        className="restart-dialog"
        aria-labelledby="restart-title"
        aria-describedby="restart-description"
        onCancel={() => setRestartOpen(false)}
        onClose={() => setRestartOpen(false)}
      >
        <span className="dialog-symbol" aria-hidden="true">
          <Arrow className="diagonal-arrow" />
        </span>
        <h2 id="restart-title">Ready for a new word?</h2>
        <p id="restart-description">
          Your current guesses will be cleared. You can also keep going with
          this word.
        </p>
        <div className="dialog-actions">
          <button
            className="secondary-button"
            autoFocus
            onClick={() => setRestartOpen(false)}
          >
            Keep playing
          </button>
          <button className="primary-button" onClick={startNewRound}>
            Start a new word <Arrow />
          </button>
        </div>
      </dialog>
    </div>
  );
}
