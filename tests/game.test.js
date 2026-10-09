import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORDS,
  MAX_MISSES,
  STORAGE_KEY,
  createRound,
  getRound,
  guessLetter,
  restoreRound,
  saveRound,
} from '../src/game.js';
const round = () => ({ version: 1, wordId: 'banana', guesses: [] });
const withGuesses = (letters) => [...letters].reduce(guessLetter, round());
const storage = (value) => ({ getItem: () => value });

test('word collection is varied, unique, playable and categorized', () => {
  assert.ok(WORDS.length >= 24);
  assert.equal(new Set(WORDS.map((w) => w.id)).size, WORDS.length);
  for (const word of WORDS) {
    assert.match(word.word, /^[A-Z]{3,8}$/);
    assert.ok(word.category.length > 0);
  }
});
test('new rounds have no guesses and avoid the previous word', () => {
  const first = createRound(null, () => 0);
  assert.equal(first.version, 1);
  assert.deepEqual(first.guesses, []);
  assert.notEqual(createRound(first.wordId, () => 0).wordId, first.wordId);
  assert.ok(
    WORDS.some((w) => w.id === createRound(null, () => 0.999999).wordId),
  );
});
test('blank round has six chances and a masked letter for each position', () => {
  const view = getRound(round());
  assert.equal(view.remaining, 6);
  assert.equal(view.status, 'playing');
  assert.deepEqual(view.revealed, [null, null, null, null, null, null]);
});
test('lowercase guess reveals every occurrence without mutation', () => {
  const original = Object.freeze({ ...round(), guesses: Object.freeze([]) });
  const next = guessLetter(original, 'a');
  assert.deepEqual(next.guesses, ['A']);
  assert.deepEqual(original.guesses, []);
  assert.deepEqual(getRound(next).revealed, [null, 'A', null, 'A', null, 'A']);
  assert.equal(getRound(next).remaining, MAX_MISSES);
});
test('blank, whitespace, numbers, punctuation, multiple characters and non-English guesses do nothing', () => {
  const original = round();
  for (const bad of [
    '',
    ' ',
    ' A',
    'AA',
    '1',
    'Enter',
    'é',
    'ß',
    '💡',
    null,
    undefined,
    3,
  ]) {
    assert.equal(guessLetter(original, bad), original);
  }
});
test('repeat correct and incorrect guesses cannot spend more chances', () => {
  const one = withGuesses('AX');
  assert.equal(guessLetter(one, 'a'), one);
  assert.equal(guessLetter(one, 'x'), one);
  assert.equal(getRound(one).remaining, 5);
});
test('six distinct incorrect letters end a round and further guesses cannot change it', () => {
  const lost = withGuesses('CDEFGH');
  assert.equal(getRound(lost).status, 'lost');
  assert.equal(getRound(lost).remaining, 0);
  assert.equal(guessLetter(lost, 'J'), lost);
  assert.equal(guessLetter(lost, 'B'), lost);
});
test('winning is deterministic and a finished round is locked', () => {
  const won = withGuesses('BAN');
  assert.equal(getRound(won).status, 'won');
  assert.deepEqual(getRound(won).revealed, [...'BANANA']);
  assert.equal(guessLetter(won, 'X'), won);
});
test('correct guesses on the last chance can still win', () => {
  const won = withGuesses('CDEFGBAN');
  assert.equal(getRound(won).status, 'won');
  assert.equal(getRound(won).remaining, 1);
});
test('restart creates clean state and leaves the old round intact', () => {
  const old = withGuesses('AX');
  const next = createRound(old.wordId, () => 0);
  assert.deepEqual(next.guesses, []);
  assert.equal(getRound(next).remaining, 6);
  assert.deepEqual(old.guesses, ['A', 'X']);
});
test('valid interrupted and completed rounds restore exactly', () => {
  for (const state of [
    round(),
    withGuesses('AX'),
    withGuesses('BAN'),
    withGuesses('CDEFGH'),
  ]) {
    assert.deepEqual(restoreRound(storage(JSON.stringify(state))), state);
  }
});
test('malformed or obsolete session data is rejected safely', () => {
  const bad = [
    null,
    '',
    '{',
    'null',
    '[]',
    '{}',
    '"oops"',
    ...[
      { ...round(), version: 2 },
      { ...round(), wordId: 'missing' },
      { ...round(), guesses: ['A', 'A'] },
      { ...round(), guesses: ['a'] },
      { ...round(), guesses: ['XX'] },
      { ...round(), guesses: 'ABC' },
      { ...round(), guesses: [...'CDEFGHJ'] },
      { ...round(), guesses: [...'BANX'] },
    ].map(JSON.stringify),
  ];
  for (const value of bad) assert.equal(restoreRound(storage(value)), null);
});
test('storage unavailable or blocked does not prevent playing', () => {
  const blocked = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('blocked');
    },
  };
  assert.equal(restoreRound(blocked), null);
  assert.equal(restoreRound(undefined), null);
  assert.equal(saveRound(blocked, round()), false);
  assert.equal(saveRound(undefined, round()), false);
});
test('saving round uses a versioned namespaced key', () => {
  let saved;
  assert.equal(
    saveRound(
      {
        setItem: (key, value) => {
          saved = [key, value];
        },
      },
      round(),
    ),
    true,
  );
  assert.deepEqual(saved, [STORAGE_KEY, JSON.stringify(round())]);
});
