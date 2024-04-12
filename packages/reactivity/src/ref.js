import { Track, Trigger } from './effect'

class RefImpl {
  constructor (value) {
    this._value = value
  }

  get value () {
    Track(this, 'value')
    return this._value
  }

  set value (newValue) {
    this._value = newValue
    Trigger(this, 'value')
  }
}

function ref (target) {
  return new RefImpl(target)
}

export {
  ref
}
