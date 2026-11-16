import { describe, expect, it } from 'vitest'
import { filterVacancies, uniqueLocations } from '@/lib/filter'
import { vacancies } from '../fixtures'

const ids = (list: { id: string }[]) => list.map((vacancy) => vacancy.id)

describe('filterVacancies', () => {
  it('geeft alle vacatures terug zonder zoekterm en locatie', () => {
    expect(ids(filterVacancies(vacancies, { query: '', location: '' }))).toEqual([
      'v1',
      'v2',
      'v3',
      'v4',
    ])
  })

  it('zoekt hoofdletterongevoelig in de titel', () => {
    expect(ids(filterVacancies(vacancies, { query: 'DEVELOPER', location: '' }))).toEqual([
      'v1',
      'v2',
    ])
  })

  it('zoekt ook in de bedrijfsnaam', () => {
    expect(ids(filterVacancies(vacancies, { query: 'testbedrijf', location: '' }))).toEqual(['v3'])
  })

  it('filtert op locatie', () => {
    expect(ids(filterVacancies(vacancies, { query: '', location: 'Utrecht' }))).toEqual([
      'v1',
      'v3',
    ])
  })

  it('combineert zoekterm en locatie', () => {
    expect(
      ids(filterVacancies(vacancies, { query: 'developer', location: 'Utrecht' })),
    ).toEqual(['v1'])
  })

  it('geeft een lege lijst als niets overeenkomt', () => {
    expect(filterVacancies(vacancies, { query: 'piloot', location: '' })).toEqual([])
  })
})

describe('uniqueLocations', () => {
  it('geeft elke locatie één keer terug, alfabetisch gesorteerd', () => {
    expect(uniqueLocations(vacancies)).toEqual(['Amsterdam', 'Rotterdam', 'Utrecht'])
  })
})
