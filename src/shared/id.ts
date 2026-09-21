let lastIssued = 0;

/**
 * Monotonic id generator for newly created books.
 *
 * The API never assigns ids (verified 2026-09-20: a POST without one stores a
 * record with no id at all), so the client mints them. `Date.now()` alone has
 * millisecond resolution, and two creations inside the same millisecond
 * produced the *same* id — which the server accepts without complaint, leaving
 * two records that cannot be told apart. Advancing past the last issued value
 * keeps ids unique for the session while staying time-ordered.
 */
export const nextId = (): number => {
  const now = Date.now();
  lastIssued = now > lastIssued ? now : lastIssued + 1;
  return lastIssued;
};
