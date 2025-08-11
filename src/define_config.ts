/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import type { ConfigProvider } from '@adonisjs/core/types'
import { QuickstartConfig, QuickstartResolvedConfig } from './types.js'

/**
 * Define the Quickstart configuration
 */
export function defineConfig(config: QuickstartConfig): ConfigProvider<QuickstartResolvedConfig> {
  return configProvider.create(async (_app) => {
    return {
      componentDir: config.componentDir ?? 'resources/js/components',
      ssr: {
        entryPoint: config.ssr.entryPoint,
        buildDirectory: 'ssr',
        manifestFile: 'ssr/.vite/manifest.json',
      },
    }
  })
}
