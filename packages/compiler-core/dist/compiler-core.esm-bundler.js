function advanceBy (context, len) {
  context.source = context.source.slice(len);
}

function parseElement (context) {
  const match = /^<([a-z]*)/i.exec(context.source);
  advanceBy(context, match[0].length);
  let firstRightAngleBracket = context.source.indexOf('>');
  const propsArr = context.source.slice(0, firstRightAngleBracket).trim().split(' ');
  let props = {};
  propsArr.forEach(prop => {
    if (prop.length > 0) {
      const length = prop.length;
      let equal_pos = prop.indexOf('=');
      let key = prop.slice(0, equal_pos);
      let value = prop.slice(equal_pos + 2, length - 1);
      props[key] = value;
    }
  });
  advanceBy(context, firstRightAngleBracket + 1);
  const children = parseChildren(context);
  firstRightAngleBracket = context.source.indexOf('>');
  advanceBy(context, firstRightAngleBracket + 1);
  return {
    type: 'element',
    tag: match[1],
    props: props,
    children
  }
}

function parseInterpolation (context) {
  const closeIndex = context.source.indexOf('}}');
  const text = context.source.slice(2, closeIndex).trim();
  advanceBy(context, closeIndex + 2);

  return {
    type: 'interpolation',
    content: {
      type: 'simple_expression',
      content: text
    }
  }
}

function parseText (context) {
  let contextEnd;
  const firstDoubleCurly = context.source.indexOf('{{');
  const firstAngleBracket = context.source.indexOf('<');
  if (firstDoubleCurly == -1) {
    contextEnd = firstAngleBracket;
  } else {
    contextEnd = firstDoubleCurly < firstAngleBracket ? firstDoubleCurly : firstAngleBracket;
  }
  const content = context.source.slice(0, contextEnd);
  advanceBy(context, contextEnd);
  return {
    type: 'text',
    content,
  }
}

function createParserContext (content) {
  return {
    source: content,
  }
}

function parseChildren (context) {
  const nodes = [];
  while (!isEnd(context)) {
    let node;
    if (context.source.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (context.source.startsWith('<')) {
      node = parseElement(context);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
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
  const context = createParserContext(content);
  return createRoot(parseChildren(context))

  function createRoot (children) {
    return {
      children
    }
  }
}

function generate (ast) {
  const rootNode = ast.children[0];
  console.log(rootNode);
  const context = createCodegenContext();
  const { push } = context;
  push('render(){ return h(');
  push(`${rootNode.tag}`);
  push(')}');
  return {
    code: context.code,
  }
}

function createCodegenContext () {
  const context = {
    code: '',
    push (source) {
      context.code += source;
    }
  };
  return context
}

export { baseParse, generate };
//# sourceMappingURL=compiler-core.esm-bundler.js.map
