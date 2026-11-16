import { hasErrors, validateApplication } from '@/lib/validation'
import { validInput } from '../fixtures'

describe('validateApplication', () => {
  it('geeft geen fouten bij geldige invoer', () => {
    expect(validateApplication(validInput)).toEqual({})
  })

  it('meldt alle verplichte velden bij lege invoer', () => {
    expect(
      validateApplication({ name: '', email: '', phone: '', motivation: '', consent: false }),
    ).toEqual({
      name: 'Naam is verplicht',
      email: 'E-mail is verplicht',
      phone: 'Telefoonnummer is verplicht',
      motivation: 'Motivatie moet minimaal 20 tekens bevatten',
      consent: 'Je moet akkoord gaan met de voorwaarden',
    })
  })

  it('meldt een ongeldig e-mailadres', () => {
    expect(validateApplication({ ...validInput, email: 'sanne@' }).email).toBe(
      'Vul een geldig e-mailadres in',
    )
  })

  it('meldt een ongeldig telefoonnummer', () => {
    expect(validateApplication({ ...validInput, phone: '12345' }).phone).toBe(
      'Vul een geldig Nederlands telefoonnummer in',
    )
  })

  it('accepteert een motivatie van precies 20 tekens', () => {
    expect(validateApplication({ ...validInput, motivation: 'a'.repeat(20) })).toEqual({})
  })
})

describe('hasErrors', () => {
  it('is false voor een leeg foutenobject', () => {
    expect(hasErrors({})).toBe(false)
  })

  it('is true zodra er één fout is', () => {
    expect(hasErrors({ name: 'Naam is verplicht' })).toBe(true)
  })
})
