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
import debug from './debug.js'

/**
 * Component resolver that uses Vite manifest in production
 * and falls back to development behavior when manifest is not available
 */
export class ComponentResolver {
  private manifest: Record<string, any> | null = null
  private buildDirectory: string
  private componentDir: string

  constructor(
    private viteManifestPath: string,
    componentDir: string,
    buildDirectory?: string
  ) {
    this.componentDir = componentDir
    this.buildDirectory = buildDirectory || 'build/ssr'
  }

  /**
   * Resolve a component by path and extension
   * In production: uses manifest to find the built file
   * In development: uses dynamic import directly
   */
  async resolve(componentPath: string, extension: string): Promise<any> {
    if (app.inProduction) {
      return this.resolveProduction(componentPath, extension)
    } else {
      return this.resolveDevelopment(componentPath, extension)
    }
  }

  private async resolveProduction(componentPath: string, extension: string): Promise<any> {
    try {
      const manifest = await this.getManifest()
      const sourceKey = `${this.componentDir}/${componentPath}.${extension}`

      debug('Looking for component in manifest:', sourceKey)

      const entry = manifest[sourceKey]
      if (!entry || !entry.file) {
        throw new Error(`Component not found in manifest: ${componentPath}`)
      }

      const builtPath = app.makePath(this.buildDirectory, entry.file)
      debug('Resolving component in production:', builtPath)

      const module = await import(builtPath)
      return module.default
    } catch (error) {
      debug('Failed to resolve component in production:', componentPath, error.message)
      throw new Error(`Component not found: ${componentPath}`)
    }
  }

  private async resolveDevelopment(componentPath: string, extension: string): Promise<any> {
    try {
      // In development, use dynamic import directly
      const fullPath = `/${this.componentDir}/${componentPath}.${extension}`
      debug('Resolving component in development:', fullPath)

      const module = await import(fullPath)
      return module.default
    } catch (error) {
      debug('Failed to resolve component in development:', componentPath, error.message)
      throw new Error(`Component not found: ${componentPath}`)
    }
  }

  private async getManifest(): Promise<Record<string, any>> {
    if (!this.manifest) {
      try {
        const manifestContent = await fs.readFile(this.viteManifestPath, 'utf-8')
        this.manifest = JSON.parse(manifestContent)
        debug('Loaded manifest from:', this.viteManifestPath)
      } catch (error) {
        throw new Error(`Failed to load manifest from ${this.viteManifestPath}: ${error.message}`)
      }
    }
    return this.manifest!
  }
}
