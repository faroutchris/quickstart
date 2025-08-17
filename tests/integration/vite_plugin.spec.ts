import { test } from '@japa/runner'
import quickstartPlugin from '../../src/plugins/vite.js'

test.group('Vite Plugin - Integration', () => {
  test('plugin works with different frameworks', ({ assert }) => {
    const frameworks = ['svelte', 'preact', 'react', 'vue', 'solid'] as const

    frameworks.forEach((framework) => {
      assert.doesNotThrow(() => {
        const plugin = quickstartPlugin({ framework })
        assert.equal(plugin.name, 'quickstart')
      })
    })
  })

  test('plugin handles malformed options gracefully', ({ assert }) => {
    // Test with potentially problematic inputs
    const testCases = [
      {},
      { ssr: '' },
      { components: '' },
      { framework: undefined },
      { ssr: null },
      { components: null },
    ]

    testCases.forEach((options) => {
      assert.doesNotThrow(
        () => {
          quickstartPlugin(options as any)
        },
        `Failed with options: ${JSON.stringify(options)}`
      )
    })
  })
})
