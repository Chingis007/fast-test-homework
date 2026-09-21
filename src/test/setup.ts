import "@testing-library/jest-dom/vitest";

/**
 * No test may reach the network.
 *
 * Suites above the gateway use fakes, and `ApiGateway.test.ts` stubs `fetch`
 * itself. Anything that slips through lands here and fails loudly instead of
 * silently depending on a live server — which would make the suite slow,
 * flaky, and destructive to real data.
 */
globalThis.fetch = (() => {
  throw new Error(
    "Network access is not allowed in tests. Use FakeHttpGateway / FakeBooksRepository, " +
      "or stub fetch explicitly with vi.stubGlobal."
  );
}) as typeof fetch;
