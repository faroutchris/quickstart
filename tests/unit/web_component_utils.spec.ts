import { test } from '@japa/runner'
import { resetInputs, visible, media } from '../../src/web_component/utils.js'
import { setPerformanceNavigation, withDom } from '../../tests_helpers/globals.js'

test.group('Web Component Utils - resetInputs', async () => {
  test('resets input/select/textarea values on reload/back-forward', async ({ assert }) => {
    await withDom(async ({ window }) => {
      // Build a tree of form controls with non-default current values
      const container = window.document.createElement('div')

      const text = window.document.createElement('input')
      text.type = 'text'
      text.defaultValue = 'default text'
      text.value = 'changed text'

      const number = window.document.createElement('input')
      number.type = 'number'
      number.defaultValue = '5'
      number.value = '10'

      const file = window.document.createElement('input')
      file.type = 'file'

      const checkbox = window.document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.defaultChecked = true
      checkbox.checked = false

      const radio = window.document.createElement('input')
      radio.type = 'radio'
      radio.defaultChecked = false
      radio.checked = true

      const textarea = window.document.createElement('textarea')
      textarea.defaultValue = 'hello'
      textarea.value = 'world'

      const selectSingle = window.document.createElement('select')
      const optA = window.document.createElement('option')
      optA.value = 'a'
      optA.textContent = 'A'
      const optB = window.document.createElement('option')
      optB.value = 'b'
      optB.textContent = 'B'
      optB.defaultSelected = true
      selectSingle.append(optA, optB)
      selectSingle.selectedIndex = 0

      const selectMulti = window.document.createElement('select')
      selectMulti.multiple = true
      const m1 = window.document.createElement('option')
      m1.value = '1'
      const m2 = window.document.createElement('option')
      m2.value = '2'
      m2.defaultSelected = true
      const m3 = window.document.createElement('option')
      m3.value = '3'
      m3.defaultSelected = true
      m1.selected = true
      m2.selected = false
      m3.selected = false
      selectMulti.append(m1, m2, m3)

      container.append(text, number, file, checkbox, radio, textarea, selectSingle, selectMulti)
      window.document.body.appendChild(container)

      // Simulate reload
      setPerformanceNavigation(1) // TYPE_RELOAD

      await resetInputs({ element: container as any })

      // Assertions: values restored to defaults
      assert.equal(text.value, 'default text')
      assert.equal(number.value, '5')
      assert.equal((file as any).value, '')
      assert.equal(checkbox.checked, true)
      assert.equal(radio.checked, false)
      assert.equal(textarea.value, 'hello')

      assert.equal(selectSingle.selectedIndex, 1, 'single select picks defaultSelected option')

      // Multiple select mirrors defaultSelected flags
      assert.equal(m1.selected, false)
      assert.equal(m2.selected, true)
      assert.equal(m3.selected, true)
    })
  })

  test('does nothing when not reload or back-forward', async ({ assert }) => {
    await withDom(async ({ window }) => {
      const container = window.document.createElement('div')
      const text = window.document.createElement('input')
      text.type = 'text'
      text.defaultValue = 'default'
      text.value = 'changed'
      container.append(text)
      window.document.body.appendChild(container)

      // Simulate normal navigation
      setPerformanceNavigation(0) // neither TYPE_RELOAD nor TYPE_BACK_FORWARD

      await resetInputs({ element: container as any })

      // Value should remain unchanged
      assert.equal(text.value, 'changed')
    })
  })
})

test.group('Web Component Utils - visible', () => {
  test('resolves when element becomes visible (IntersectionObserver mock)', async ({ assert }) => {
    await withDom(async ({ window }) => {
      // Mock IntersectionObserver
      class IO {
        private cb: IntersectionObserverCallback
        constructor(cb: IntersectionObserverCallback) {
          this.cb = cb
        }
        observe(el: Element) {
          // Immediately report intersecting
          this.cb([{ isIntersecting: true, target: el } as any], this as any)
        }
        disconnect() {}
        unobserve() {}
        takeRecords(): IntersectionObserverEntry[] {
          return []
        }
      }
      ;(globalThis as any).IntersectionObserver = IO

      const el = window.document.createElement('div')
      const promise = visible({ element: el as any })
      await assert.doesNotReject(async () => await promise)
    })
  })
})

test.group('Web Component Utils - media', () => {
  test('invokes onMatch/onUnmatch and returns cleanup to remove listener', async ({ assert }) => {
    await withDom(async ({ window }) => {
      // Simple matchMedia mock with trigger
      const listeners: Array<(e: any) => void> = []
      const mql = {
        matches: true,
        addEventListener: (_: string, fn: any) => listeners.push(fn),
        removeEventListener: (_: string, fn: any) => {
          const i = listeners.indexOf(fn)
          if (i > -1) listeners.splice(i, 1)
        },
        media: '(min-width: 768px)',
        onchange: null,
        dispatch: (matches: boolean) => {
          const e = { matches } as any
          listeners.slice().forEach((fn) => fn(e))
        },
      }
      ;(window as any).matchMedia = () => mql as any
      ;(globalThis as any).matchMedia = (q: string) => (window as any).matchMedia(q)

      let matched = 0
      let unmatched = 0

      const cleanup = media({
        query: '(min-width: 768px)',
        onMatch: () => matched++,
        onUnmatch: () => unmatched++,
      })

      // Initially matches = true, so onMatch called once
      assert.equal(matched, 1)
      assert.equal(unmatched, 0)

      // Flip to false -> should call onUnmatch
      mql.dispatch(false)
      assert.equal(matched, 1)
      assert.equal(unmatched, 1)

      // Cleanup removes listener; no further callbacks
      cleanup()
      mql.dispatch(true)
      assert.equal(matched, 1)
      assert.equal(unmatched, 1)
    })
  })
})
