export const MAX_MISSES = 6;
export const STORAGE_KEY = 'guess-a-word:v1';

const wordGroups = {
  'Everyday things': [
    'BALL',
    'PHONE',
    'TOWEL',
    'BOOK',
    'CLOCK',
    'PENCIL',
    'BOTTLE',
    'CAMERA',
  ],
  'Food & drink': [
    'BANANA',
    'ORANGE',
    'COFFEE',
    'COOKIE',
    'LEMON',
    'CHERRY',
    'BREAD',
    'HONEY',
  ],
  'The outdoors': [
    'OCEAN',
    'FOREST',
    'GARDEN',
    'RIVER',
    'FLOWER',
    'SUNSET',
    'ISLAND',
    'RAINBOW',
  ],
  'On the move': ['BIKE', 'PLANE', 'TRAIN', 'ROCKET', 'BRIDGE', 'BOAT'],
  'A little of everything': [
    'MUSIC',
    'GAME',
    'QUEEN',
    'DREAM',
    'PUZZLE',
    'PLANET',
  ],
};
export const WORDS = Object.freeze(
  Object.entries(wordGroups).flatMap(([category, words]) =>
    words.map((word) =>
      Object.freeze({ id: word.toLowerCase(), word, category }),
    ),
  ),
);

export function createRound(previousId = null, random = Math.random) {
  const choices = WORDS.filter((word) => word.id !== previousId);
  const word = choices[Math.floor(random() * choices.length)];
  return { version: 1, wordId: word.id, guesses: [] };
}

export function getRound(state) {
  const entry = WORDS.find((word) => word.id === state.wordId);
  const misses = state.guesses.filter((letter) => !entry.word.includes(letter));
  const revealed = [...entry.word].map((letter) =>
    state.guesses.includes(letter) ? letter : null,
  );
  const remaining = Math.max(0, MAX_MISSES - misses.length);
  const status = revealed.every(Boolean)
    ? 'won'
    : remaining === 0
      ? 'lost'
      : 'playing';
  return { ...entry, revealed, misses, remaining, status };
}

export function guessLetter(state, input) {
  if (typeof input !== 'string' || !/^[a-z]$/i.test(input)) return state;
  const letter = input.toUpperCase();
  if (state.guesses.includes(letter) || getRound(state).status !== 'playing')
    return state;
  return { ...state, guesses: [...state.guesses, letter] };
}

export function restoreRound(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (
      !saved ||
      saved.version !== 1 ||
      !WORDS.some((word) => word.id === saved.wordId) ||
      !Array.isArray(saved.guesses) ||
      saved.guesses.length > 26
    )
      return null;
    let state = { version: 1, wordId: saved.wordId, guesses: [] };
    for (const letter of saved.guesses) {
      if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) return null;
      const next = guessLetter(state, letter);
      if (next === state) return null;
      state = next;
    }
    return state;
  } catch {
    return null;
  }
}

export function saveRound(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
