import {isObject} from "../src"

describe('shared', () => {
    test('isObject', () => {
        expect(isObject({})).toBe(true)
    })
})