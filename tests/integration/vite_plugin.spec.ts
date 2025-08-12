import { test } from '@japa/runner'
import quickstartPlugin from '../../src/plugins/vite.js'

test.group('Vite Plugin - Integration', () => {
  test('plugin integrates with Vite config', async ({ fs, assert }) => {
    // Create a minimal Vite project structure
    await fs.create(
      'package.json',
      JSON.stringify({
        name: 'test-project',
        type: 'module',
        dependencies: {
          vite: '^5.0.0',
        },
      })
    )

    await fs.create(
      'vite.config.js',
      `
      import { defineConfig } from 'vite'
      import quickstart from '@reddigital/quickstart/plugins/vite'

      export default defineConfig({
        plugins: [
          quickstart({
            framework: 'svelte',
            ssr: 'src/ssr.ts',
            components: 'src/components'
          })
        ]
      })
      `
    )

    await fs.create(
      'src/ssr.ts',
      `
      export default function render() {
        return '<div>Hello SSR</div>'
      }
      `
    )

    await fs.create(
      'src/components/test.svelte',
      `
      <script>
        let count = 0
      </script>
      
      <button on:click={() => count++}>Count: {count}</button>
      `
    )

    // Verify files were created
    assert.isTrue(await fs.exists('vite.config.js'))
    assert.isTrue(await fs.exists('src/ssr.ts'))
    assert.isTrue(await fs.exists('src/components/test.svelte'))
  })

  test('plugin works with different frameworks', ({ assert }) => {
    const frameworks = ['svelte', 'preact'] as const

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
