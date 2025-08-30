/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import { promises as fs } from 'node:fs'
import { Vite } from '@adonisjs/vite'
import { QuickstartResolvedConfig, SSRClientConfig, getFrameworkExtension } from './types.js'
import { ComponentResolver } from './component_resolver.js'
import debug from './debug.js'

export class ServerRenderer {
  private componentResolver: ComponentResolver

  constructor(
    private config: QuickstartResolvedConfig,
    private vite?: Vite
  ) {
    // Only need the SSR manifest for component resolution
    const ssrManifestPath = app.makePath(this.config.ssr.buildDirectory, '.vite', 'manifest.json')
    this.componentResolver = new ComponentResolver(
      ssrManifestPath,
      this.config.componentDir,
      this.config.ssr.buildDirectory
    )
  }

  private async ssrModule(): Promise<{ default: SSRClientConfig<any> }> {
    if (app.inProduction) {
      // In production, use the SSR manifest to find the built SSR entry
      try {
        const ssrManifestPath = app.makePath(
          this.config.ssr.buildDirectory,
          '.vite',
          'manifest.json'
        )
        const manifestContent = await fs.readFile(ssrManifestPath, 'utf-8')
        const manifest = JSON.parse(manifestContent)

        debug('SSR manifest path:', ssrManifestPath)
        debug('Looking for SSR entry:', this.config.ssr.entryPoint)
        debug('Available SSR manifest keys:', Object.keys(manifest))

        // Use the SSR entry point path as the key (e.g., "resources/js/ssr.ts")
        const ssrEntry = manifest[this.config.ssr.entryPoint]
        if (!ssrEntry || !ssrEntry.file) {
          debug('Available SSR manifest keys:', Object.keys(manifest))
          throw new Error(
            `SSR entry not found in SSR manifest with key '${this.config.ssr.entryPoint}'`
          )
        }

        const ssrEntryPath = app.makePath(this.config.ssr.buildDirectory, ssrEntry.file)
        debug('Loading SSR module from:', ssrEntryPath)
        return import(ssrEntryPath)
      } catch (error) {
        debug('Failed to load SSR module:', error.message)
        throw new Error(`SSR module not found: ${error.message}`)
      }
    } else {
      // In development, use Vite's SSR loading
      const viteServer = this.vite?.getDevServer()
      return viteServer?.ssrLoadModule(this.config.ssr.entryPoint) as Promise<{
        default: SSRClientConfig<any>
      }>
    }
  }

  /**
   * Renders the component to html
   */
  async renderComponent(componentPath: string, props: Record<string, any> = {}) {
    try {
      const ssrModule = await this.ssrModule()

      // Get the file extension based on the framework config
      const extension = getFrameworkExtension(this.config.framework)

      // Resolve the component using our ComponentResolver
      const component = await this.componentResolver.resolve(componentPath, extension)
      if (!component) {
        debug('SSR Error:', `Component not found: ${componentPath}`)
        return `<!-- SSR Error: Component not found: ${componentPath} -->`
      }

      return ssrModule.default.render(component, props)
    } catch (error) {
      debug('SSR Error:', error.message)
      return `<!-- SSR Error: ${error.message} -->`
    }
  }
}
