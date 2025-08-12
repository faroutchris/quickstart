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

test.group('Vite Plugin - Framework Dependencies', () => {
  test('handles no framework specified', ({ assert }) => {
    const plugin = quickstartPlugin()
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.deepEqual(config.optimizeDeps.include, [])
    assert.deepEqual(config.ssr.noExternal, ['@adonisjs/vite'])
  })

  test('configures svelte framework dependencies', ({ assert }) => {
    const plugin = quickstartPlugin({ framework: 'svelte' })
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.include(config.optimizeDeps.include, 'svelte')
    assert.include(config.optimizeDeps.include, 'svelte/internal')
    assert.include(config.ssr.noExternal, 'svelte')
    assert.include(config.ssr.noExternal, 'svelte/internal')
    assert.include(config.ssr.noExternal, '@adonisjs/vite')
  })

  test('configures preact framework dependencies', ({ assert }) => {
    const plugin = quickstartPlugin({ framework: 'preact' })
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.include(config.optimizeDeps.include, 'preact')
    assert.include(config.ssr.noExternal, 'preact')
    assert.include(config.ssr.noExternal, 'preact-render-to-string')
    assert.include(config.ssr.noExternal, '@adonisjs/vite')
  })
})

test.group('Vite Plugin - Build Steps', () => {
  test('generates correct build step configuration', ({ assert }) => {
    const plugin = quickstartPlugin()
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.isArray(config.buildSteps)
    assert.lengthOf(config.buildSteps, 1)

    const buildStep = config.buildSteps[0]
    assert.equal(buildStep.name, 'build-ssr')
    assert.equal(buildStep.description, 'Build quickstart server-side rendering assets')

    // Check build configuration
    assert.isTrue(buildStep.config.build.ssr)
    assert.equal(buildStep.config.build.outDir, 'build/ssr')
    assert.equal(buildStep.config.build.rollupOptions.preserveEntrySignatures, 'strict')
    assert.equal(buildStep.config.build.rollupOptions.output.format, 'es')
  })

  test('uses custom SSR entry in build step', ({ assert }) => {
    const customSsr = 'app/ssr/server.ts'
    const plugin = quickstartPlugin({ ssr: customSsr })
    const config = callConfig(plugin, {}, { command: 'build', mode: 'production' })

    const buildStep = config.buildSteps[0]
    assert.equal(buildStep.config.build.rollupOptions.input, customSsr)
  })
})

test.group('Vite Plugin - Environment Variables', () => {
  test('sets NODE_ENV to production during build', ({ assert }) => {
    const originalNodeEnv = process.env.NODE_ENV

    // Clean up NODE_ENV
    delete process.env.NODE_ENV

    const plugin = quickstartPlugin()
    callConfig(plugin, {}, { command: 'build', mode: 'production' })

    assert.equal(process.env.NODE_ENV, 'production')

    // Restore original value
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  test('does not modify NODE_ENV during serve', ({ assert }) => {
    const originalNodeEnv = process.env.NODE_ENV || 'test'

    const plugin = quickstartPlugin()
    callConfig(plugin, {}, { command: 'serve', mode: 'development' })

    assert.equal(process.env.NODE_ENV, originalNodeEnv)
  })
})
