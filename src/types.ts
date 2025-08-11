/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference lib="dom" />

export interface QuickstartConfig {
  /** Directory where component files live (relative to project root) */
  componentDir?: string

  /** SSR configuration */
  ssr: {
    /** Path to the SSR entrypoint file */
    entryPoint: string
  }
}

export interface QuickstartResolvedConfig {
  /** Directory where component files live (relative to project root) */
  componentDir: string

  /** SSR configuration */
  ssr: {
    /** Path to the SSR entrypoint file */
    entryPoint: string

    /** Output directory name for SSR build (relative to project root) */
    buildDirectory: string

    /** Path to the Vite manifest for SSR (relative to project root) */
    manifestFile: string
  }
}

export interface SSRClientConfig<T> {
  resolve(path: string): Promise<T>
  render(component: T, props: any): string
}

export interface ClientConfig<T> {
  resolve: (path: string) => Promise<T>
  hydrate: (component: T, options: { target: HTMLElement; props: any }) => void
}
