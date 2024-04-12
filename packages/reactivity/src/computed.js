import { createDep } from './dep'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

class ComputedRefImpl {
  constructor (getter) {
    this._dirty = true
    this.dep = createDep()
    this.effect = new ReactiveEffect(getter, () => {
      if (this._dirty) return

      this._dirty = true
      triggerRefValue(this)
    })
  }

  get value () {
    trackRefValue(this)

    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }

    return this._value
  }
}

function computed (getter) {
  return new ComputedRefImpl(getter)
}

export {
  computed
}