import { advanceBy } from './utils.js'
import { parseChildren } from './parse.js'

function parseElement (context) {
  const match = /^<([a-z]*)/i.exec(context.source)
  advanceBy(context, match[0].length)
  let firstRightAngleBracket = context.source.indexOf('>')
  const propsArr = context.source.slice(0, firstRightAngleBracket).trim().split(' ')
  let props = {}
  propsArr.forEach(prop => {
    if (prop.length > 0) {
      const length = prop.length
      let equal_pos = prop.indexOf('=')
      let key = prop.slice(0, equal_pos)
      let value = prop.slice(equal_pos + 2, length - 1)
      props[key] = value
    }
  })
  advanceBy(context, firstRightAngleBracket + 1)
  const children = parseChildren(context)
  firstRightAngleBracket = context.source.indexOf('>')
  advanceBy(context, firstRightAngleBracket + 1)
  return {
    type: 'element',
    tag: match[1],
    props: props,
    children
  }
}

export {
  parseElement
}