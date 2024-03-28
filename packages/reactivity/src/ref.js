import { Track, Trigger } from './effect'

class RefImpl {
  private _value

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

export function ref (target) {
  return new RefImpl(target)
}