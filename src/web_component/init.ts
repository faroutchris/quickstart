/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { media, resetInputs, visible } from './utils.js'

import { ClientConfig } from '../types.js'

export function init<T>({ resolve, hydrate }: ClientConfig<T>) {
  class Quickstart extends HTMLElement {
    private cleanupMediaListener?: any

    async connectedCallback() {
      // Firefox caches client side inputs so we make sure to reset them
      // Chromium based browsers behave "correctly" (but not according to w3 spec)
      await resetInputs({ element: this })

      if (this.hasAttribute('client:lazy')) {
        await visible({ element: this })
      }

      if (this.hasAttribute('client:media')) {
        const query = this.getAttribute('client:media') ?? ''
        this.cleanupMediaListener = media({
          query,
          onMatch: async () => await this.hydrate(),
          onUnmatch: () => (this.innerHTML = ''),
        })
      } else {
        await this.hydrate()
      }
    }

    disconnectedCallback() {
      this.cleanupMediaListener?.()
    }

    async hydrate() {
      const src = this.getAttribute('src') ?? ''
      const propsData = this.getAttribute('data-props')
      const props = propsData ? JSON.parse(propsData) : {}

      const Component = await resolve(src)
      hydrate(Component, { target: this, props })
    }
  }
  customElements.define('quick-start', Quickstart)
}
