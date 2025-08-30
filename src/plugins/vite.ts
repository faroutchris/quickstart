/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@vavite/multibuild" />

import type { PluginOption } from 'vite'

export interface QuickstartPluginOptions {
  /**
   * Path to the SSR entry point file
   * @default 'resources/js/ssr.ts'
   */
  ssr?: string

  /**
   * Directory for component files
   * @default 'resources/js/components'
   */
  components?: string

  /**
   * Used to detect which dependencies vite needs to optimize
   */
  framework?: 'svelte' | 'preact' | 'vue'

  /**
   * Output directory for the SSR bundle
   * @default 'build/ssr'
   */
  ssrOutput?: string
}

function getFrameworkDependencies(framework: string | null) {
  switch (framework) {
    case 'svelte':
      return {
        include: ['svelte', 'svelte/internal'],
        noExternal: ['svelte', 'svelte/internal'],
      }
    case 'preact':
      return {
        include: ['preact'],
        noExternal: ['preact', 'preact-render-to-string'],
      }
    case 'vue':
      return {
        include: ['vue'],
        noExternal: ['vue', '@vue/server-renderer'],
      }
    default:
      return {
        include: [],
        noExternal: [],
      }
  }
}

export default function quickstartPlugin(options: QuickstartPluginOptions = {}): PluginOption {
  const ssrEntryPoint = options.ssr ?? 'resources/js/ssr.ts'
  const componentDir = options.components ?? 'resources/js/components'
  const framework = options.framework ?? null
  const ssrOutput = options.ssrOutput ?? 'build/ssr'
  const frameworkDeps = getFrameworkDependencies(framework)

  return {
    name: 'quickstart',
    config: (_, { command }) => {
      // Set NODE_ENV to production when building for consistency
      if (command === 'build') {
        process.env.NODE_ENV = 'production'
      }

      return {
        // Configure SSR dependencies to not be externalized
        ssr: {
          noExternal: ['@adonisjs/vite', ...frameworkDeps.noExternal],
          target: 'node',
        },
        // Optimize dependencies for component loading
        optimizeDeps: {
          include: frameworkDeps.include,
          exclude: [componentDir],
        },
        // Define build steps for both client and SSR
        buildSteps: [
          {
            name: 'build-ssr',
            description: 'Build quickstart server-side rendering assets',
            config: {
              build: {
                ssr: true,
                outDir: ssrOutput,
                rollupOptions: {
                  input: ssrEntryPoint,
                  preserveEntrySignatures: 'strict',
                  output: {
                    format: 'es',
                    entryFileNames: 'ssr.js',
                  },
                },
              },
            },
          },
        ],
      }
    },
  }
}
