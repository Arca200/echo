import { getCurrentInstance } from '../setupComponent'

function provide (key, value) {
  const instance = getCurrentInstance()
  if (instance) {
    const { provide } = instance
    provide[key] = value
  }
}

export {
  provide
}