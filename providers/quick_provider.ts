/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import type { ApplicationService } from '@adonisjs/core/types'
import { ServerRenderer } from '../src/server_renderer.js'
import { QuickstartConfig, QuickstartResolvedConfig } from '../src/types.js'

export default class QuickstartProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Registers edge plugin when edge is installed
   */
  protected async registerQuickstartEdgePlugin() {
    if (!this.app.usingEdgeJS) return

    const edge = await import('edge.js')
    const { edgePluginQuickstart } = await import('../src/plugins/edge.js')
    const serverRenderer = await this.app.container.make(ServerRenderer)
    edge.default.use(edgePluginQuickstart(serverRenderer))
  }

  /**
   * Register ServerRenderer used by Edge Plugin
   */
  async register() {
    this.app.container.bind(ServerRenderer, async () => {
      const vite = await this.app.container.make('vite')
      const quickstartConfigProvider = this.app.config.get<QuickstartConfig>('quickstart')
      const config = await configProvider.resolve<QuickstartResolvedConfig>(
        this.app,
        quickstartConfigProvider
      )

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/quickstart.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new ServerRenderer(config, vite)
    })
  }

  /**
   * Register edge plugin
   */
  async boot() {
    await this.registerQuickstartEdgePlugin()
  }
}
