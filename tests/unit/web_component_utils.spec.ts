import { test } from '@japa/runner'
import { JSDOM } from 'jsdom'
import { resetInputs, visible, media } from '../../src/web_component/utils.js'

function setupDom(html = '<!DOCTYPE html><html><body></body></html>') {
  const dom = new JSDOM(html)
  const { window } = dom
  // Attach globals commonly expected by utilities
  // Keep references so we can restore per test if needed
  ;(globalThis as any).window = window as any
  ;(globalThis as any).document = window.document as any
  return window
}

function mockPerformanceNavigation(type: number) {
  const nav = { type, TYPE_RELOAD: 1, TYPE_BACK_FORWARD: 2 }
  // Augment both window.performance and global performance (do not reassign objects)
  if ((window as any).performance) {
    ;(window as any).performance.navigation = nav
  }
  if ((globalThis as any).performance) {
    ;(globalThis as any).performance.navigation = nav
  }
}

test.group('Web Component Utils - resetInputs', () => {
  test('resets input/select/textarea values on reload/back-forward', async ({ assert }) => {
    const window = setupDom()

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
    mockPerformanceNavigation(1) // TYPE_RELOAD

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

  test('does nothing when not reload or back-forward', async ({ assert }) => {
    const window = setupDom()

    const container = window.document.createElement('div')
    const text = window.document.createElement('input')
    text.type = 'text'
    text.defaultValue = 'default'
    text.value = 'changed'
    container.append(text)
    window.document.body.appendChild(container)

    // Simulate normal navigation
    mockPerformanceNavigation(0) // neither TYPE_RELOAD nor TYPE_BACK_FORWARD

    await resetInputs({ element: container as any })

    // Value should remain unchanged
    assert.equal(text.value, 'changed')
  })
})

test.group('Web Component Utils - visible', () => {
  test('resolves when element becomes visible (IntersectionObserver mock)', async ({ assert }) => {
    const window = setupDom()

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

test.group('Web Component Utils - media', () => {
  test('invokes onMatch/onUnmatch and returns cleanup to remove listener', ({ assert }) => {
    const window = setupDom()

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
/*

import { test } from '@japa/runner'
import { JSDOM } from 'jsdom'
import { resetInputs, visible, media } from '../../src/web_component/utils.js'

function setupDom(html = '<!DOCTYPE html><html><body></body></html>') {
  const dom = new JSDOM(html)
  const { window } = dom
  // Attach globals commonly expected by utilities
  // Keep references so we can restore per test if needed
  ;(globalThis as any).window = window as any
  ;(globalThis as any).document = window.document as any
  return window
}

function mockPerformanceNavigation(type: number) {
  const nav = { type, TYPE_RELOAD: 1, TYPE_BACK_FORWARD: 2 }
  // Augment both window.performance and global performance (do not reassign objects)
  if ((window as any).performance) {
    ;(window as any).performance.navigation = nav
  }
  if ((globalThis as any).performance) {
    ;(globalThis as any).performance.navigation = nav
  }
}

test.group('Web Component Utils - resetInputs', () => {
  test('resets input/select/textarea values on reload/back-forward', async ({ assert }) => {
    const window = setupDom()

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

    const radio1 = window.document.createElement('input')
    radio1.type = 'radio'
    radio1.name = 'grp'
    radio1.defaultChecked = false
    radio1.checked = true

    const radio2 = window.document.createElement('input')
    radio2.type = 'radio'
    radio2.name = 'grp'
    radio2.defaultChecked = true
    radio2.checked = false

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

    container.append(
      text,
      number,
      file,
      checkbox,
      radio1,
      radio2,
      textarea,
      selectSingle,
      selectMulti
    )
    window.document.body.appendChild(container)

    // Simulate back-forward
    mockPerformanceNavigation(2) // TYPE_BACK_FORWARD

    await resetInputs({ element: container as any })

    // Assertions: values restored to defaults
    assert.equal(text.value, 'default text')
    assert.equal(number.value, '5')
    assert.equal((file as any).value, '')
    assert.equal(checkbox.checked, true)
    assert.equal(radio1.checked, false)
    assert.equal(radio2.checked, true)
    assert.equal(textarea.value, 'hello')

    assert.equal(selectSingle.selectedIndex, 1, 'single select picks defaultSelected option')

    // Multiple select mirrors defaultSelected flags
    assert.equal(m1.selected, false)
    assert.equal(m2.selected, true)
    assert.equal(m3.selected, true)
  })

  test('single select with no defaultSelected falls back to first option', async ({ assert }) => {
    const window = setupDom()
    const container = window.document.createElement('div')
    const select = window.document.createElement('select')
    const o1 = window.document.createElement('option')
    o1.value = '1'
    const o2 = window.document.createElement('option')
    o2.value = '2'
    select.append(o1, o2)
    select.selectedIndex = 1
    container.append(select)
    window.document.body.appendChild(container)

    mockPerformanceNavigation(1)
    await resetInputs({ element: container as any })

    assert.equal(select.selectedIndex, 0)
  })

  test('does nothing when not reload or back-forward', async ({ assert }) => {
    const window = setupDom()

    const container = window.document.createElement('div')
    const text = window.document.createElement('input')
    text.type = 'text'
    text.defaultValue = 'default'
    text.value = 'changed'
    container.append(text)
    window.document.body.appendChild(container)

    // Simulate normal navigation
    mockPerformanceNavigation(0) // neither TYPE_RELOAD nor TYPE_BACK_FORWARD

    await resetInputs({ element: container as any })

    // Value should remain unchanged
    assert.equal(text.value, 'changed')
  })
})

test.group('Web Component Utils - visible', () => {
  test('resolves after becoming visible and disconnects observer', async ({ assert }) => {
    const window = setupDom()

    // Mock IntersectionObserver with manual control
    let observed = 0
    let disconnected = 0
    let cb: IntersectionObserverCallback | undefined
    class IO {
      constructor(callback: IntersectionObserverCallback) {
        cb = callback
      }
      observe() {
        observed++
      }
      disconnect() {
        disconnected++
      }
      unobserve() {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
    }
    ;(globalThis as any).IntersectionObserver = IO

    const el = window.document.createElement('div')
    const p = visible({ element: el as any })
    assert.equal(observed, 1)

    // Not yet resolved until intersecting
    let settled = false
    p.then(() => (settled = true))
    await new Promise((r) => setTimeout(r, 0))
    assert.isFalse(settled)

    // Trigger intersecting
    cb?.([{ isIntersecting: true, target: el } as any], {} as any)
    await p

    assert.isTrue(settled)
    assert.equal(disconnected, 1)
  })
})

test.group('Web Component Utils - media', () => {
  test('initial unmatched state does not call onMatch and cleanup is idempotent', ({ assert }) => {
    const window = setupDom()

    const listeners: Array<(e: any) => void> = []
    const mql = {
      matches: false,
      addEventListener: (_: string, fn: any) => listeners.push(fn),
      removeEventListener: (_: string, fn: any) => {
        const i = listeners.indexOf(fn)
        if (i > -1) listeners.splice(i, 1)
      },
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
      query: '(min-width: 1024px)',
      onMatch: () => matched++,
      onUnmatch: () => unmatched++,
    })

    // Initially false -> no match callback
    assert.equal(matched, 0)
    assert.equal(unmatched, 0)

    // Flip to true -> 1 match
    mql.dispatch(true)
    assert.equal(matched, 1)

    // Cleanup twice should not throw or duplicate effects
    cleanup()
    cleanup()

    // Further dispatches do nothing
    mql.dispatch(false)
    assert.equal(unmatched, 0)
  })
})
*/
