import { test } from '@japa/runner'
import quickstartPlugin from '../../src/plugins/vite.js'
import type { UserConfig, ConfigEnv } from 'vite'

// Helper to call the config function safely
function callConfig(plugin: any, userConfig: UserConfig, env: ConfigEnv) {
  const configHook = plugin.config
  if (typeof configHook === 'function') {
    return configHook(userConfig, env)
  } else if (configHook && typeof configHook.handler === 'function') {
    return configHook.handler(userConfig, env)
  }
  throw new Error('Config hook is not callable')
}

test.group('Vite Plugin - quickstartPlugin', () => {
  test('exports a function', ({ assert }) => {
    assert.isFunction(quickstartPlugin)
  })

  test('returns plugin object with correct name', ({ assert }) => {
    const plugin = quickstartPlugin()

    assert.isObject(plugin)
    assert.equal(plugin.name, 'quickstart')
    assert.isTrue(plugin.config !== null)
  })

  test('accepts empty options', ({ assert }) => {
    assert.doesNotThrow(() => {
      quickstartPlugin()
    })
  })

  test('accepts custom options', ({ assert }) => {
    const options = {
      ssr: 'custom/ssr.ts',
      components: 'custom/components',
      framework: 'svelte' as const,
    }

    assert.doesNotThrow(() => {
      quickstartPlugin(options)
    })
  })
})

test.group('Vite Plugin - config generation', () => {
  test('generates default config for build command', ({ assert }) => {
    const plugin = quickstartPlugin()
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.isObject(config)
    assert.isObject(config.ssr)
    assert.equal(config.ssr.target, 'node')
    assert.isArray(config.ssr.noExternal)
    assert.include(config.ssr.noExternal, '@adonisjs/vite')
  })

  test('generates config for serve command', ({ assert }) => {
    const plugin = quickstartPlugin()
    const config = callConfig(plugin, {}, { command: 'serve', mode: 'development' })

    assert.isObject(config)
    assert.isObject(config.ssr)
    assert.isObject(config.optimizeDeps)
  })

  test('uses default SSR entry point', ({ assert }) => {
    const plugin = quickstartPlugin()
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.isArray(config.buildSteps)
    assert.lengthOf(config.buildSteps, 1)

    const buildStep = config.buildSteps[0]
    assert.equal(buildStep.name, 'build-ssr')
    assert.equal(buildStep.config.build.rollupOptions.input, 'resources/js/ssr.ts')
  })

  test('uses custom SSR entry point', ({ assert }) => {
    const plugin = quickstartPlugin({ ssr: 'custom/ssr.ts' })
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    const buildStep = config.buildSteps[0]
    assert.equal(buildStep.config.build.rollupOptions.input, 'custom/ssr.ts')
  })

  test('uses default component directory', ({ assert }) => {
    const plugin = quickstartPlugin()
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.include(config.optimizeDeps.exclude, 'resources/js/components')
  })

  test('uses custom component directory', ({ assert }) => {
    const plugin = quickstartPlugin({ components: 'custom/components' })
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.include(config.optimizeDeps.exclude, 'custom/components')
  })
})
