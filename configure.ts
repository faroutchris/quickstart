/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

/**
 * Framework adapter interface
 */
interface FrameworkAdapter {
  name: string
  displayName: string
  packages: Array<{ name: string; isDevDependency: boolean }>
  vitePlugins: Array<{
    call: string
    imports: Array<{ isNamed: boolean; module: string; identifier: string }>
  }>
  stubs: Array<{ stub: string; templateData?: Record<string, any> }>
}

/**
 * Framework adapters
 */
const adapters: Record<string, FrameworkAdapter> = {
  svelte: {
    name: 'svelte',
    displayName: 'Svelte',
    packages: [
      { name: 'svelte', isDevDependency: true },
      { name: '@sveltejs/vite-plugin-svelte', isDevDependency: true },
    ],
    vitePlugins: [
      {
        call: 'svelte()',
        imports: [{ isNamed: true, module: '@sveltejs/vite-plugin-svelte', identifier: 'svelte' }],
      },
    ],
    stubs: [
      { stub: 'config.stub' },
      { stub: 'svelte/app.ts.stub' },
      { stub: 'svelte/ssr.ts.stub' },
      { stub: 'svelte/tsconfig.json.stub' },
      { stub: 'svelte/sample-component.svelte.stub' },
    ],
  },
  preact: {
    name: 'preact',
    displayName: 'Preact',
    packages: [
      { name: 'preact', isDevDependency: false },
      { name: 'preact-render-to-string', isDevDependency: false },
      { name: '@preact/preset-vite', isDevDependency: true },
    ],
    vitePlugins: [
      {
        call: 'preact()',
        imports: [{ isNamed: false, module: '@preact/preset-vite', identifier: 'preact' }],
      },
    ],
    stubs: [
      { stub: 'config.stub' },
      { stub: 'preact/app.ts.stub' },
      { stub: 'preact/ssr.ts.stub' },
      { stub: 'preact/tsconfig.json.stub' },
      { stub: 'preact/sample-component.tsx.stub' },
    ],
  },
  vue: {
    name: 'vue',
    displayName: 'Vue',
    packages: [
      { name: 'vue', isDevDependency: false },
      { name: '@vue/server-renderer', isDevDependency: false },
      { name: '@vitejs/plugin-vue', isDevDependency: true },
    ],
    vitePlugins: [
      {
        call: 'vue()',
        imports: [{ isNamed: false, module: '@vitejs/plugin-vue', identifier: 'vue' }],
      },
    ],
    stubs: [
      { stub: 'config.stub' },
      { stub: 'vue/app.ts.stub' },
      { stub: 'vue/ssr.ts.stub' },
      { stub: 'vue/tsconfig.json.stub' },
      { stub: 'vue/sample-component.vue.stub' },
    ],
  },
}

/**
 * Detect or prompt for framework choice
 */
async function selectFramework(command: Configure): Promise<FrameworkAdapter> {
  // Available framework options
  const frameworkChoices = Object.values(adapters).map((adapter) => ({
    name: adapter.name,
    message: adapter.displayName,
  }))

  // Prompt user to select framework
  const selectedFramework = await command.prompt.choice(
    'Which frontend framework would you like to use?',
    frameworkChoices,
    { name: 'framework' }
  )

  return adapters[selectedFramework]
}

/**
 * Configures the quickstart package
 */
export async function configure(command: Configure) {
  let shouldInstallPackages: boolean | undefined = command.parsedFlags.install

  const codemods = await command.createCodemods()
  const adapter = await selectFramework(command)

  /**
   * Publish provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@reddigital/quickstart/provider')
  })

  /**
   * Register quickstart plugin in vite config
   */
  await codemods.registerVitePlugin(`quickStartPlugin({ framework: '${adapter.name}' })`, [
    {
      isNamed: false,
      module: '@reddigital/quickstart/plugins/vite',
      identifier: 'quickStartPlugin',
    },
  ])

  /**
   * Register framework-specific vite plugins
   */
  for (const plugin of adapter.vitePlugins) {
    await codemods.registerVitePlugin(plugin.call, plugin.imports)
  }

  /**
   * Publish framework-specific stub files
   */
  for (const stubConfig of adapter.stubs) {
    await codemods.makeUsingStub(stubsRoot, stubConfig.stub, stubConfig.templateData || {})
  }

  /**
   * Install framework-specific packages
   */
  if (shouldInstallPackages === undefined) {
    shouldInstallPackages = await command.prompt.confirm(
      `Do you want to install ${adapter.displayName} dependencies (${adapter.packages.map((pkg) => pkg.name).join(', ')})?`,
      { name: 'install' }
    )
  }

  if (shouldInstallPackages) {
    await codemods.installPackages(adapter.packages)
  } else {
    await codemods.listPackagesToInstall(adapter.packages)
  }

  /**
   * Provide instructions for updating existing adonisjs plugin
   */
  command.logger.info('')
  command.logger.info('🔧 Manual step required:')
  command.logger.info(
    'Please update your existing adonisjs() plugin in vite.config.ts to include the client app.ts entrypoint:'
  )
  command.logger.info('')
  command.logger.info('Before:')
  command.logger.info(
    `  adonisjs({ entrypoints: ['resources/css/app.css', 'resources/js/app.js'], ... })`
  )
  command.logger.info('')
  command.logger.info('After:')
  command.logger.info(
    `  adonisjs({ entrypoints: ['resources/css/app.css', 'resources/js/app.ts'], ... })`
  )
  command.logger.info('')
}
