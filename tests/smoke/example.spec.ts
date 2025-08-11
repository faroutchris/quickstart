import { test } from '@japa/runner'

// Basic sanity test to verify the Japa runner is wired correctly
// Run: npm run quick:test -- --files "tests/smoke/example.spec.ts"

test('adds numbers', ({ assert }) => {
  assert.equal(1 + 1, 2)
})
