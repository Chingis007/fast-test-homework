# Books — fast-test (MVVM) refactor

The original CodeSandbox page did everything inside one `App()` component: local state, the
fetch, the mapping and an `alert("TBD")` instead of book creation. This version separates the
layers so that **all behaviour is testable without a DOM and without a network**, which is the
point of the exercise.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

> **Self-signed certificate — do this first.** The demo API uses a self-signed cert, so the
> browser silently blocks its requests until you accept it once. Open
> <https://tdd.demo.reaktivate.com/v1/books/user/> in the same browser, accept the warning,
> then load the app.

The API is namespaced per person: `/v1/books/{user}/`. With no `.env` present the app falls back
to `user`. To use your own bucket, copy the example and set your nickname — then accept the
certificate on *that* URL instead:

```bash
cp .env.example .env     # then edit VITE_API_USER
```

Production build:

```bash
npm run build        # typechecks, then bundles to dist/
npm run preview      # serves the built bundle
```

## Test it

```bash
npm test             # 92 tests, ~0.7s
npm run test:watch   # re-runs on change
npm run test:coverage
npm run typecheck
```

No test touches the network: `src/test/setup.ts` replaces `fetch` with a throwing stub, and
everything above the gateway runs against hand-written fakes in `src/test/fakes.ts`.

## Stack

Vite 5 · React 18 · TypeScript 5 · MobX 6 · mobx-react 9 · Vitest 2 · React Testing Library.

The original `react-scripts@3.0.1` cannot build on current Node, so the tooling had to change
regardless; Vitest keeps the feedback loop near-instant, which is what a fast-test workflow needs.
