import { advanceBy } from './utils.js'

function parseText (context) {
  let contextEnd
  const firstDoubleCurly = context.source.indexOf('{{')
  const firstAngleBracket = context.source.indexOf('<')
  if (firstDoubleCurly == -1) {
    contextEnd = firstAngleBracket
  } else {
    contextEnd = firstDoubleCurly < firstAngleBracket ? firstDoubleCurly : firstAngleBracket
  }
  const content = context.source.slice(0, contextEnd)
  advanceBy(context, contextEnd)
  return {
    type: 'text',
    content,
  }
}

// console.log(parseText({ source: '1234</div>' }))
export {
  parseText
}