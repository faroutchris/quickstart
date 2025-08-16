import { test } from '@japa/runner'
import { edgePluginQuickstart } from '../../src/plugins/edge.js'
import edge from 'edge.js'
import { encode } from 'html-entities'

function fakeRenderer(html: string) {
  return { renderComponent: async () => html }
}

test.group('Edge Plugin - @quick tag', () => {
  test('renders with encoded props and options', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>SSR</div>') as any))

    const out = await edge.renderRaw(
      `@quick('components/counter', { a: '<x>' }, { lazy: true, media: '(max-width: 600px)' })`
    )

    assert.snapshot(out)
    assert.include(out, 'client:lazy')
    assert.include(out, 'client:media="(max-width: 600px)"')
    assert.include(out, `data-props='${encode(JSON.stringify({ a: '<x>' }))}'`)
  })

  test('renders with just component path (no props or options)', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<span>Simple</span>') as any))

    const out = await edge.renderRaw(`@quick('components/simple')`)

    assert.include(out, '<quick-start src="components/simple"')
    assert.include(out, `data-props='${encode(JSON.stringify({}))}'`)
    assert.include(out, '<span>Simple</span>')
    // Should not have any client: attributes when no options provided
    assert.notInclude(out, 'client:')
  })

  test('renders with component path and props only', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>With Props</div>') as any))

    const out = await edge.renderRaw(`@quick('components/test', { name: 'John', count: 42 })`)

    assert.include(out, '<quick-start src="components/test"')
    assert.include(out, `data-props='${encode(JSON.stringify({ name: 'John', count: 42 }))}'`)
    assert.include(out, '<div>With Props</div>')
    assert.notInclude(out, 'client:')
  })

  test('renders with lazy option only', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>Lazy</div>') as any))

    const out = await edge.renderRaw(`@quick('components/lazy', {}, { lazy: true })`)

    assert.include(out, 'client:lazy')
    assert.notInclude(out, 'client:media')
    assert.include(out, '<div>Lazy</div>')
  })

  test('renders with media option only', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>Media</div>') as any))

    const out = await edge.renderRaw(
      `@quick('components/media', {}, { media: '(min-width: 768px)' })`
    )

    assert.include(out, 'client:media="(min-width: 768px)"')
    assert.notInclude(out, 'client:lazy')
    assert.include(out, '<div>Media</div>')
  })

  test('renders with both lazy and media options false/empty', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>No Options</div>') as any))

    const out = await edge.renderRaw(`@quick('components/test', {}, { lazy: false, media: '' })`)

    assert.notInclude(out, 'client:lazy')
    assert.notInclude(out, 'client:media')
    assert.include(out, '<div>No Options</div>')
  })

  test('throws error when supplied with no arguments', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<span/>') as any))
    await assert.rejects(
      () => edge.renderRaw('@quick()'),
      'The @quick tag requires a component path as an argument'
    )
  })

  test('rejects when component path is empty string', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<span/>') as any))

    await assert.rejects(() => edge.renderRaw(`@quick('')`))
  })

  test('rejects when component path is whitespace only', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<span/>') as any))

    await assert.rejects(() => edge.renderRaw(`@quick('   ')`))
  })

  test('handles complex props with nested objects and arrays', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>Complex</div>') as any))

    const complexProps = {
      user: { name: 'Alice', age: 30 },
      items: ['apple', 'banana'],
      config: { theme: 'dark', features: { a: true, b: false } },
    }

    const out = await edge.renderRaw(
      `@quick('components/complex', ${JSON.stringify(complexProps)})`
    )

    assert.include(out, `data-props='${encode(JSON.stringify(complexProps))}'`)
    assert.include(out, '<div>Complex</div>')
  })

  test('handles props with special characters and HTML entities', async ({ assert }) => {
    edge.use(edgePluginQuickstart(fakeRenderer('<div>Special</div>') as any))

    const specialProps = {
      html: '<script>alert("xss")</script>',
      quotes: 'He said "Hello"',
      ampersand: 'A & B',
    }

    const out = await edge.renderRaw(
      `@quick('components/special', ${JSON.stringify(specialProps)})`
    )

    // Props should be HTML encoded
    assert.include(out, `data-props='${encode(JSON.stringify(specialProps))}'`)
    assert.include(out, '<div>Special</div>')
    // Make sure the actual component HTML is not double-encoded
    assert.notInclude(out, '&lt;div&gt;')
  })
})

test.group('Edge Plugin - Server Renderer Integration', () => {
  test('calls server renderer with correct arguments', async ({ assert }) => {
    let capturedPath: string | undefined
    let capturedProps: any

    const mockRenderer = {
      renderComponent: async (path: string, props: any) => {
        capturedPath = path
        capturedProps = props
        return '<div>Rendered</div>'
      },
    }

    edge.use(edgePluginQuickstart(mockRenderer as any))

    await edge.renderRaw(`@quick('components/test', { id: 123, active: true })`)

    assert.equal(capturedPath, 'components/test')
    assert.deepEqual(capturedProps, { id: 123, active: true })
  })

  test('handles server renderer errors gracefully', async ({ assert }) => {
    const mockRenderer = {
      renderComponent: async () => {
        throw new Error('Rendering failed')
      },
    }

    edge.use(edgePluginQuickstart(mockRenderer as any))

    await assert.rejects(() => edge.renderRaw(`@quick('components/failing')`), 'Rendering failed')
  })
})
