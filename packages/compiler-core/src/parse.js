import { parseElement } from './element.js'
import { parseInterpolation } from './interpolation.js'
import { parseText } from './text.js'

function createParserContext (content) {
  return {
    source: content,
  }
}

function parseChildren (context) {
  const nodes = []
  while (!isEnd(context)) {
    let node
    if (context.source.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (context.source.startsWith('<')) {
      node = parseElement(context)
    } else {
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
}

function isEnd (context) {
  if (context.source.startsWith('</') || context.source === '') {
    return true
  } else {
    return false
  }
}

function baseParse (content) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))

  function createRoot (children) {
    return {
      children
    }
  }
}

export {
  baseParse,
  parseChildren
}

