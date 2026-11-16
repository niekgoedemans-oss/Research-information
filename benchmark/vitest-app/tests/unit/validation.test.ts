import { describe, expect, it } from 'vitest'
import { isValidDutchPhone, isValidEmail } from '@/lib/validation'

describe('isValidEmail', () => {
  it('accepteert een gewoon e-mailadres', () => {
    expect(isValidEmail('sanne@voorbeeld.example')).toBe(true)
  })

  it('accepteert een adres met subdomein', () => {
    expect(isValidEmail('info@mail.bedrijf.example')).toBe(true)
  })

  it('negeert spaties aan begin en eind', () => {
    expect(isValidEmail('  jan@test.example  ')).toBe(true)
  })

  it('weigert een adres zonder @', () => {
    expect(isValidEmail('janvoorbeeld.example')).toBe(false)
  })

  it('weigert een adres zonder domeinextensie', () => {
    expect(isValidEmail('jan@voorbeeld')).toBe(false)
  })

  it('weigert een adres met een spatie erin', () => {
    expect(isValidEmail('jan de vries@test.example')).toBe(false)
  })
})

describe('isValidDutchPhone', () => {
  it('accepteert een mobiel nummer', () => {
    expect(isValidDutchPhone('0612345678')).toBe(true)
  })

  it('accepteert een nummer met spaties en streepjes', () => {
    expect(isValidDutchPhone('06-12 34 56 78')).toBe(true)
  })

  it('accepteert een nummer met +31', () => {
    expect(isValidDutchPhone('+31612345678')).toBe(true)
  })

  it('accepteert een vast nummer met 0031', () => {
    expect(isValidDutchPhone('0031201234567')).toBe(true)
  })

  it('weigert een nummer dat te kort is', () => {
    expect(isValidDutchPhone('061234567')).toBe(false)
  })

  it('weigert een buitenlands nummer', () => {
    expect(isValidDutchPhone('+32470123456')).toBe(false)
  })
})
