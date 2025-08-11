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
import { QuickstartResolvedConfig, SSRClientConfig } from './types.js'
import debug from './debug.js'

export class ServerRenderer {
  constructor(
    private config: QuickstartResolvedConfig,
    private vite?: Vite
  ) {}

  locateBundle = async () => {
    const entryBundle = this.config.ssr.entryPoint
    const manifestPath = app.makePath(this.config.ssr.manifestFile)

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
    const ssrEntry = manifest[entryBundle]
    if (!ssrEntry || !ssrEntry.file) {
      throw new Error('SSR bundle not found in manifest')
    }

    return app.makePath(this.config.ssr.buildDirectory, ssrEntry.file)
  }

  private async ssrModule(): Promise<{ default: SSRClientConfig<any> }> {
    if (app.inProduction) {
      const bundlePath = await this.locateBundle()
      return import(bundlePath)
    } else {
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
      const component = await ssrModule.default.resolve(componentPath)
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
