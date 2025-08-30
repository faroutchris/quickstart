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

  /** Framework being used (determines component file extensions) */
  framework?: 'svelte' | 'preact' | 'vue'

  /** SSR configuration */
  ssr: {
    /** Path to the SSR entrypoint file */
    entryPoint: string
  }
}

export interface QuickstartResolvedConfig {
  /** Directory where component files live (relative to project root) */
  componentDir: string

  /** Framework being used (determines component file extensions) */
  framework: 'svelte' | 'preact' | 'vue'

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
  render(component: T, props: any): Promise<string> | string
}

export interface ClientConfig<T> {
  resolve: (path: string, resolver?: (path: string, ext: string) => Promise<T>) => Promise<T>
  hydrate: (component: T, options: { target: HTMLElement; props: any }) => void
}

/**
 * Get the file extension for a given framework
 */
export function getFrameworkExtension(framework: 'svelte' | 'preact' | 'vue'): string {
  switch (framework) {
    case 'svelte':
      return 'svelte'
    case 'preact':
      return 'tsx'
    case 'vue':
      return 'vue'
    default:
      return 'vue'
  }
}
