import { advanceBy } from './utils.js'

function parseInterpolation (context) {
  const closeIndex = context.source.indexOf('}}')
  const text = context.source.slice(2, closeIndex).trim()
  advanceBy(context, closeIndex + 2)

  return {
    type: 'interpolation',
    content: {
      type: 'simple_expression',
      content: text
    }
  }
}

export {
  parseInterpolation,
}