import { formatSalary, formatSalaryRange } from '@/lib/format'

describe('formatSalary', () => {
  it('formatteert een bedrag met euroteken en punt als duizendtalscheiding', () => {
    expect(formatSalary(3500)).toBe('€ 3.500')
  })

  it('formatteert grote bedragen met meerdere scheidingstekens', () => {
    expect(formatSalary(1250000)).toBe('€ 1.250.000')
  })

  it('rondt af op hele euro’s', () => {
    expect(formatSalary(2999.6)).toBe('€ 3.000')
  })

  it('gooit een fout bij een ongeldig getal', () => {
    expect(() => formatSalary(Number.NaN)).toThrow('Salaris moet een eindig getal zijn')
  })
})

describe('formatSalaryRange', () => {
  it('toont een bandbreedte per maand', () => {
    expect(formatSalaryRange(3000, 4500)).toBe('€ 3.000 – € 4.500 per maand')
  })

  it('toont één bedrag als minimum en maximum gelijk zijn', () => {
    expect(formatSalaryRange(4000, 4000)).toBe('€ 4.000 per maand')
  })

  it('gooit een fout als het minimum hoger is dan het maximum', () => {
    expect(() => formatSalaryRange(5000, 4000)).toThrow(
      'Minimumsalaris mag niet hoger zijn dan maximumsalaris',
    )
  })
})
