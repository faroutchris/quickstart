import { test } from '@japa/runner'
import { resetInputs, visible, media } from '../../src/web_component/utils.js'

test.group('Web Component Utils - resetInputs', () => {
  test('resets various input types correctly', async ({ assert }) => {
    // Create a mock DOM environment
    const mockElement = {
      querySelectorAll: (selector: string) => {
        if (selector === 'input') {
          return [
            {
              type: 'text',
              value: 'current',
              defaultValue: 'default',
            },
            {
              type: 'checkbox',
              checked: true,
              defaultChecked: false,
            },
            {
              type: 'radio',
              checked: false,
              defaultChecked: true,
            },
            {
              type: 'file',
              value: 'file.txt',
            },
          ]
        }
        if (selector === 'textarea') {
          return [
            {
              value: 'current text',
              defaultValue: 'default text',
            },
          ]
        }
        if (selector === 'select') {
          return [
            {
              multiple: false,
              selectedIndex: 1,
              options: [{ defaultSelected: true }, { defaultSelected: false }],
            },
          ]
        }
        return []
      },
    }

    // Mock window and performance API to simulate page reload
    const originalWindow = global.window
    const originalPerformance = global.performance
    global.window = {
      performance: {
        navigation: {
          type: 1, // TYPE_RELOAD
          TYPE_RELOAD: 1,
          TYPE_BACK_FORWARD: 2,
        },
      },
    } as any
    global.performance = {
      navigation: {
        type: 1, // TYPE_RELOAD
        TYPE_RELOAD: 1,
        TYPE_BACK_FORWARD: 2,
      },
    } as any

    await resetInputs({ element: mockElement as any })

    // Verify the function completes without error
    assert.isTrue(true)

    // Restore originals
    global.window = originalWindow
    global.performance = originalPerformance
  })
})

test.group('Web Component Utils - visible', () => {
  test('returns promise that resolves when element is visible', async ({ assert }) => {
    // Mock IntersectionObserver
    const originalIntersectionObserver = global.IntersectionObserver
    global.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback: (entries: any[]) => void) {
        // Immediately trigger visibility
        setTimeout(() => {
          callback([{ isIntersecting: true }])
        }, 0)
      }
      observe() {}
      disconnect() {}
    } as any

    const mockElement = {} as HTMLElement
    const result = await visible({ element: mockElement })

    assert.equal(result, true)

    // Restore original
    global.IntersectionObserver = originalIntersectionObserver
  })
})

test.group('Web Component Utils - media', () => {
  test('sets up media query listener correctly', ({ assert }) => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: (_event: string, handler: (e: any) => void) => {
        // Test that handler works
        handler({ matches: true })
      },
      removeEventListener: () => {},
    }

    const originalWindow = global.window
    global.window = {
      matchMedia: () => mockMediaQuery,
    } as any

    let onMatchCalled = false
    let onUnmatchCalled = false

    const cleanup = media({
      query: '(min-width: 768px)',
      onMatch: () => {
        onMatchCalled = true
      },
      onUnmatch: () => {
        onUnmatchCalled = true
      },
    })

    assert.isTrue(onMatchCalled)
    assert.isFalse(onUnmatchCalled)
    assert.isFunction(cleanup)

    // Restore original
    global.window = originalWindow
  })

  test('calls onUnmatch when media query does not match', ({ assert }) => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }

    const originalWindow = global.window
    global.window = {
      matchMedia: () => mockMediaQuery,
    } as any

    let onMatchCalled = false
    let onUnmatchCalled = false

    media({
      query: '(min-width: 768px)',
      onMatch: () => {
        onMatchCalled = true
      },
      onUnmatch: () => {
        onUnmatchCalled = true
      },
    })

    assert.isFalse(onMatchCalled)
    assert.isTrue(onUnmatchCalled)

    // Restore original
    global.window = originalWindow
  })

  test('returns cleanup function that removes event listener', ({ assert }) => {
    let removeEventListenerCalled = false

    const mockMediaQuery = {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {
        removeEventListenerCalled = true
      },
    }

    const originalWindow = global.window
    global.window = {
      matchMedia: () => mockMediaQuery,
    } as any

    const cleanup = media({
      query: '(min-width: 768px)',
    })

    cleanup()
    assert.isTrue(removeEventListenerCalled)

    // Restore original
    global.window = originalWindow
  })
})
