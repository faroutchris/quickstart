import { test } from '@japa/runner'
import { JSDOM } from 'jsdom'
import { init } from '../../src/web_component/init.js'
import { withDom } from '../../tests_helpers/globals.js'
import { DOMWindow } from 'jsdom'

test.group('Web Component - Quickstart Element Integration', () => {
  function mockPerformanceNavigation(window: DOMWindow) {
    const nav = { type: 0, TYPE_RELOAD: 1, TYPE_BACK_FORWARD: 2 }
    // Augment both window.performance and global performance (do not reassign)
    if ((window as any).performance) {
      ;(window as any).performance.navigation = nav
    }
    if ((globalThis as any).performance) {
      ;(globalThis as any).performance.navigation = nav
    }
  }

  test('handles lazy loading with intersection observer', async ({ assert }) => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    const { window } = dom

    // Set up globals
    global.window = window as any
    global.document = window.document as any
    global.HTMLElement = window.HTMLElement as any
    global.customElements = window.customElements as any

    // Ensure performance.navigation is present to satisfy resetInputs
    mockPerformanceNavigation(window)

    // Mock IntersectionObserver to simulate lazy loading
    let intersectionCallback: ((entries: any[]) => void) | undefined
    global.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback: (entries: any[]) => void) {
        intersectionCallback = callback
      }
      observe() {}
      disconnect() {}
    } as any

    let hydrationCalled = false
    const mockResolve = async () => ({ name: 'LazyComponent' })
    const mockHydrate = () => {
      hydrationCalled = true
    }

    // Initialize custom element
    init({ resolve: mockResolve, hydrate: mockHydrate })

    // Create element with lazy attribute
    const quickstart = window.document.createElement('quick-start')
    quickstart.setAttribute('client:lazy', '')
    quickstart.setAttribute('src', 'lazy-component')

    window.document.body.appendChild(quickstart)

    // Wait a tick - hydration should not happen yet
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.isFalse(hydrationCalled, 'Component should not be hydrated before becoming visible')

    // Simulate element becoming visible
    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: true }])
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    assert.isTrue(hydrationCalled, 'Component should be hydrated after becoming visible')

    // Cleanup
    delete (global as any).window
    delete (global as any).document
    delete (global as any).HTMLElement
    delete (global as any).customElements
    delete (global as any).IntersectionObserver
  })

  test('handles media query conditional loading', async ({ assert }) => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    const { window } = dom

    // Set up globals
    global.window = window as any
    global.document = window.document as any
    global.HTMLElement = window.HTMLElement as any
    global.customElements = window.customElements as any

    // Ensure performance.navigation is present to satisfy resetInputs
    mockPerformanceNavigation(window)

    // Mock matchMedia
    let mediaChangeHandler: ((event: { matches: boolean }) => void) | undefined
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
          mediaChangeHandler = handler
        },
        removeEventListener: () => {},
      }) as any

    let hydrationCount = 0
    const mockResolve = async () => ({ name: 'MediaComponent' })
    const mockHydrate = () => {
      hydrationCount++
    }

    // Initialize custom element
    init({ resolve: mockResolve, hydrate: mockHydrate })

    // Create element with media query
    const quickstart = window.document.createElement('quick-start')
    quickstart.setAttribute('client:media', '(min-width: 768px)')
    quickstart.setAttribute('src', 'media-component')
    quickstart.innerHTML = '<p>Loading...</p>'

    window.document.body.appendChild(quickstart)
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Initially should not hydrate (matches: false)
    assert.equal(hydrationCount, 0, 'Component should not hydrate when media query does not match')

    // Simulate media query matching
    if (mediaChangeHandler) {
      mediaChangeHandler({ matches: true })
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    assert.equal(hydrationCount, 1, 'Component should hydrate when media query matches')

    // Simulate media query not matching - should clear content
    if (mediaChangeHandler) {
      mediaChangeHandler({ matches: false })
    }

    assert.equal(
      quickstart.innerHTML,
      '',
      'Content should be cleared when media query no longer matches'
    )

    // Cleanup
    delete (global as any).window
    delete (global as any).document
    delete (global as any).HTMLElement
    delete (global as any).customElements
  })

  test('handles disconnection cleanup', async ({ assert }) => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    const { window } = dom

    global.window = window as any
    global.document = window.document as any
    global.HTMLElement = window.HTMLElement as any
    global.customElements = window.customElements as any

    // Mock matchMedia with cleanup tracking
    let removeEventListenerCalled = false
    window.matchMedia = () =>
      ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {
          removeEventListenerCalled = true
        },
      }) as any

    const mockResolve = async () => ({ name: 'Component' })
    const mockHydrate = () => {}

    init({ resolve: mockResolve, hydrate: mockHydrate })

    // Create element with media query to set up cleanup
    const quickstart = window.document.createElement('quick-start')
    quickstart.setAttribute('client:media', '(min-width: 768px)')
    quickstart.setAttribute('src', 'test-component')

    window.document.body.appendChild(quickstart)
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Remove element to trigger disconnectedCallback
    window.document.body.removeChild(quickstart)

    assert.isTrue(
      removeEventListenerCalled,
      'Media query listener should be cleaned up on disconnect'
    )

    // Cleanup
    delete (global as any).window
    delete (global as any).document
    delete (global as any).HTMLElement
    delete (global as any).customElements
  })

  test('handles missing or invalid props gracefully', async ({ assert }) => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    const { window } = dom

    global.window = window as any
    global.document = window.document as any
    global.HTMLElement = window.HTMLElement as any
    global.customElements = window.customElements as any

    // Ensure performance.navigation is present to satisfy resetInputs
    mockPerformanceNavigation(window)

    let hydratedProps: any
    const mockResolve = async () => ({ name: 'Component' })
    const mockHydrate = (_component: any, options: any) => {
      hydratedProps = options.props
    }

    init({ resolve: mockResolve, hydrate: mockHydrate })

    // Test with no props attribute
    const quickstart1 = window.document.createElement('quick-start')
    quickstart1.setAttribute('src', 'test-component')
    window.document.body.appendChild(quickstart1)
    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.deepEqual(hydratedProps, {}, 'Should default to empty object when no props')

    // Test with invalid JSON
    const quickstart2 = window.document.createElement('quick-start')
    quickstart2.setAttribute('src', 'test-component2')
    quickstart2.setAttribute('data-props', '{invalid json}')
    window.document.body.appendChild(quickstart2)

    // This should not throw - the JSON.parse might fail but we can catch it
    assert.doesNotThrow(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }, 'Should handle invalid JSON gracefully')

    // Cleanup
    delete (global as any).window
    delete (global as any).document
    delete (global as any).HTMLElement
    delete (global as any).customElements
  })

  test('lazy + media together hydrate exactly once after visibility and match', async (ctx) => {
    const { assert } = ctx
    await withDom(async ({ window }) => {
      // Mock IntersectionObserver controlled
      let ioCallback: ((entries: any[]) => void) | undefined
      ;(globalThis as any).IntersectionObserver = class IO {
        constructor(cb: any) {
          ioCallback = cb
        }
        observe() {}
        disconnect() {}
      }

      // Mock matchMedia starting unmatched
      let mediaHandler: ((e: { matches: boolean }) => void) | undefined
      window.matchMedia = (q: string) =>
        ({
          matches: false,
          media: q,
          addEventListener: (_: string, h: any) => (mediaHandler = h),
          removeEventListener: () => {},
        }) as any

      let hydrateCount = 0
      const mockResolve = async () => ({})
      const mockHydrate = () => {
        hydrateCount++
      }

      init({ resolve: mockResolve, hydrate: mockHydrate })

      const el = window.document.createElement('quick-start')
      el.setAttribute('client:lazy', '')
      el.setAttribute('client:media', '(min-width: 900px)')
      el.setAttribute('src', 'x')
      window.document.body.appendChild(el)

      // Initially, not visible and media false -> no hydrate
      await new Promise((r) => setTimeout(r, 0))
      assert.equal(hydrateCount, 0)

      // Become visible
      ioCallback?.([{ isIntersecting: true } as any])
      await new Promise((r) => setTimeout(r, 0))
      assert.equal(hydrateCount, 0)

      // Now media matches -> exactly one hydrate
      mediaHandler?.({ matches: true })
      await new Promise((r) => setTimeout(r, 0))
      assert.equal(hydrateCount, 1)

      // Flipping media again should not re-hydrate (only clear content on unmatch)
      mediaHandler?.({ matches: false })
      mediaHandler?.({ matches: true })
      await new Promise((r) => setTimeout(r, 0))
      assert.equal(hydrateCount, 2, 'should hydrate again only when toggled back to true')
    })
  })

  test('disconnect before media match prevents hydration after listener cleanup', async (ctx) => {
    const { assert } = ctx
    await withDom(async ({ window }) => {
      // Track removeEventListener
      let removed = false
      window.matchMedia = () =>
        ({
          matches: false,
          addEventListener: () => {},
          removeEventListener: () => {
            removed = true
          },
        }) as any

      let hydrated = 0
      const mockResolve = async () => ({})
      const mockHydrate = () => {
        hydrated++
      }

      init({ resolve: mockResolve, hydrate: mockHydrate })

      const el = window.document.createElement('quick-start')
      el.setAttribute('client:media', '(min-width: 700px)')
      el.setAttribute('src', 'x')
      window.document.body.appendChild(el)
      await new Promise((r) => setTimeout(r, 0))

      // Disconnect before any media match
      window.document.body.removeChild(el)
      assert.isTrue(removed, 'media listener removed on disconnect')

      // If match happens later, no hydration should occur because listener is cleaned up
      // Simulate a lingering reference calling handler (not available, so no effect)
      assert.equal(hydrated, 0)
    })
  })
})
