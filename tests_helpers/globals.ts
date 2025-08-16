import { JSDOM } from 'jsdom'

export type WithDomOptions = {
  url?: string
  html?: string
}

export function withDom<T>(
  fn: (api: { window: Window & typeof globalThis; document: Document }) => Promise<T> | T,
  options: WithDomOptions = {}
) {
  const html = options.html ?? '<!DOCTYPE html><html><body></body></html>'
  const url = options.url ?? 'https://localhost'

  const dom = new JSDOM(html, { url })
  const { window } = dom

  const prev: Record<string, any> = {}

  function save<K extends string>(key: K, value: any) {
    prev[key] = (globalThis as any)[key]
    ;(globalThis as any)[key] = value
  }

  // Save globals that browser-like code usually expects
  save('window', window as any)
  save('document', window.document as any)
  save('HTMLElement', window.HTMLElement as any)
  save('customElements', window.customElements as any)

  // Preserve performance object identity; augment navigation if needed
  if (typeof (window as any).performance === 'object') {
    if (!(window as any).performance.navigation) {
      ;(window as any).performance.navigation = { type: 0, TYPE_RELOAD: 1, TYPE_BACK_FORWARD: 2 }
    }
  }
  if (typeof (globalThis as any).performance === 'object') {
    if (!(globalThis as any).performance.navigation) {
      ;(globalThis as any).performance.navigation = {
        type: 0,
        TYPE_RELOAD: 1,
        TYPE_BACK_FORWARD: 2,
      }
    }
  }

  const api = { window: window as any, document: window.document as any }

  const finalize = () => {
    // Restore globals
    for (const key of Object.keys(prev)) {
      if (prev[key] === undefined) {
        delete (globalThis as any)[key]
      } else {
        ;(globalThis as any)[key] = prev[key]
      }
    }
  }

  try {
    return Promise.resolve(fn(api)).finally(finalize)
  } catch (err) {
    finalize()
    throw err
  }
}

export function setPerformanceNavigation(type: number) {
  const nav = { type, TYPE_RELOAD: 1, TYPE_BACK_FORWARD: 2 }
  if ((globalThis as any).performance) {
    ;(globalThis as any).performance.navigation = nav
  }
  if ((globalThis as any).window && (globalThis as any).window.performance) {
    ;(globalThis as any).window.performance.navigation = nav
  }
}
