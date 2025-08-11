/*
 * @reddigital/quickstart
 *
 * (c) Red Digital
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { PluginFn, TagContract } from 'edge.js/types'
import { encode } from 'html-entities'
import { EdgeError } from 'edge-error'
import { ServerRenderer } from '../server_renderer.js'

/**
 * Register the quickstart globals within Edge
 */
export const edgePluginQuickstart: (serverRenderer: ServerRenderer) => PluginFn<undefined> = (
  serverRenderer
) => {
  return (edge) => {
    edge.global(
      'quick',
      async (
        componentPath: string,
        props: Record<string, any> = {},
        options: { lazy?: boolean; media?: string } = {}
      ) => {
        const html = await serverRenderer.renderComponent(componentPath, props)
        const propsJson = encode(JSON.stringify(props))

        const clientOptions = [
          options.lazy ? 'client:lazy' : '',
          options.media ? `client:media="${options.media}"` : '',
        ]
          .filter(Boolean)
          .join(' ')
          .trim()

        return `<quick-start src="${componentPath}" data-props='${propsJson}' ${clientOptions}>${html}</quick-start>`
      }
    )

    const quickTag: TagContract = {
      tagName: 'quick',
      block: false,
      seekable: true,
      compile(parser, buffer, { filename, loc, properties }) {
        const componentPath = properties.jsArg

        if (!componentPath.trim()) {
          throw new EdgeError(
            `The @quick tag requires a component path as an argument`,
            'E_MISSING_ARGUMENT',
            { line: loc.start.line, col: loc.start.col, filename }
          )
        }

        // Parse the properties to extract props and options
        const parsed = parser.utils.transformAst(
          parser.utils.generateAST(componentPath, loc, filename),
          filename,
          parser
        )

        // Check if we have multiple arguments (component, props, options)
        if (parsed.type === 'SequenceExpression') {
          const expressions = parsed.expressions
          const component = expressions[0]
          const props = expressions[1] || null
          const options = expressions[2] || null

          const componentCode = parser.utils.stringify(component)
          const propsCode = props ? parser.utils.stringify(props) : '{}'
          const optionsCode = options ? parser.utils.stringify(options) : '{}'

          buffer.writeExpression(
            `out += await state.quick(${componentCode}, ${propsCode}, ${optionsCode});`,
            filename,
            loc.start.line
          )
        } else {
          // Single argument - just the component path
          const componentCode = parser.utils.stringify(parsed)
          buffer.writeExpression(
            `out += await state.quick(${componentCode}, {}, {});`,
            filename,
            loc.start.line
          )
        }
      },
    }

    edge.registerTag(quickTag)
  }
}
