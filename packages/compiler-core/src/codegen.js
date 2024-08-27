function generate (ast) {
  const rootNode = ast.children[0]
  console.log(rootNode)
  const context = createCodegenContext()
  const { push } = context
  push('render(){ return h(')
  push(`${rootNode.tag}`)
  push(')}')
  return {
    code: context.code,
  }
}

function createCodegenContext () {
  const context = {
    code: '',
    push (source) {
      context.code += source
    }
  }
  return context
}

function genNode (ast, context) {
  const { push } = context
  const node = ast.children[0]
  push(`return ${node.children[0].content}`)
}

export {
  generate
}