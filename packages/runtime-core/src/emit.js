export default function emit (instance, event) {
  const props = instance.props || {}
  const emitAction = props[event]
  emitAction && emitAction()
}