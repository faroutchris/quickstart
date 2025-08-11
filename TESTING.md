Testing Plan for @reddigital/quickstart using Japa

This document explains how to start, structure, and run tests for this package using Japa v4.

Prerequisites
- Node.js >= 20.6.0 (see package.json engines)
- Package manager: pnpm (preferred) or npm
- Install dependencies: pnpm install or npm install

Overview
- Test runner entry: bin/test.ts
  - Loads plugins: @japa/assert, @japa/file-system, @japa/expect-type, @japa/snapshot
  - Discovers files: tests/**/*.spec.ts
  - Parses CLI flags via processCLIArgs, so runner accepts flags like --tags and --files
- TypeScript/ESM execution: Tests run via ts-node-maintained/register/esm, so you can write tests in TypeScript using ES modules.
- Coverage: npm test runs tests wrapped with c8 producing text and HTML coverage reports (see ./coverage).

How to run tests
- Full test suite with coverage: npm test
- Run without coverage: npm run quick:test
- Pass Japa CLI flags (forwarded after --):
  - npm run quick:test -- --files "tests/unit/**/*.spec.ts"
  - npm run quick:test -- --tags @fast

Writing tests
- File location: Place test files anywhere under tests/ with the .spec.ts suffix.
- Basic example:
  
  // tests/smoke/example.spec.ts
  import { test } from '@japa/runner'
  
  test('adds numbers', ({ assert }) => {
    assert.equal(1 + 1, 2)
  })

- Using the file-system plugin:
  
  // Provides an isolated fs under tmp/ configured in bin/test.ts
  test('writes a temp file', async ({ fs, assert }) => {
    await fs.create('foo.txt', 'hello')
    assert.isTrue(await fs.exists('foo.txt'))
  })

- Type assertions with @japa/expect-type:
  
  import type { expectTypeOf } from '@japa/expect-type'
  
  test('type expectations compile', () => {
    // Example: expectTypeOf<'a'>().toEqualTypeOf<string>()
    // This plugin ensures type-level tests compile correctly.
  })

- Snapshots with @japa/snapshot:
  - The plugin is registered; you can add snapshot-based tests. See https://github.com/japa/snapshot for API and best practices.

Organizing tests
- Suggested folders: tests/unit, tests/integration, tests/e2e (as needed)
- Naming convention: my_feature.spec.ts
- Use describe() blocks if preferred, or group related tests in files.

Tags and selective runs
- You can tag tests and run a subset:
  
  test('only run fast tests', { tags: ['fast'] }, ({ assert }) => {
    assert.isTrue(true)
  })
  
  # Run just fast tests
  npm run quick:test -- --tags fast

Common tasks
- Lint before tests (runs automatically via pretest): npm run lint
- Type-check (optional but recommended): npm run typecheck

CI
- The GitHub Actions workflow (.github/workflows/checks.yml) uses reusable AdonisJS workflows for test, lint, and typecheck. Ensure tests are deterministic and do not rely on network or external services unless mocked.

Troubleshooting
- ESM/TypeScript imports: Use ESM syntax (import/export). The project has "type": "module".
- Flaky tests: Prefer deterministic inputs and isolate filesystem state via the @japa/file-system plugin.
- Coverage excludes tests/ by default (see package.json c8 config). Modify as needed.

Next steps to expand coverage
1) Create unit tests for pure helpers in src/ (e.g., argument parsing, config builders).
2) Add integration tests for the Vite plugin behavior using @japa/file-system to scaffold temp projects.
3) If applicable, add API client tests with @japa/api-client against a minimal AdonisJS app when integrating.
4) Use snapshots to lock down generated files/templates under stubs/ when commands scaffold content.
