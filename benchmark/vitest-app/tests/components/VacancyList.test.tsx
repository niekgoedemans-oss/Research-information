import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VacancyList from '@/components/VacancyList'
import { vacancies } from '../fixtures'

const titles = () =>
  screen.queryAllByRole('article').map((card) => within(card).getByRole('heading').textContent)

describe('VacancyList', () => {
  it('toont alle vacatures bij het openen', () => {
    render(<VacancyList vacancies={vacancies} />)
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('toont het aantal gevonden vacatures', () => {
    render(<VacancyList vacancies={vacancies} />)
    expect(screen.getByRole('status')).toHaveTextContent('4 vacatures gevonden')
  })

  it('filtert op titel tijdens het typen', async () => {
    const user = userEvent.setup()
    render(<VacancyList vacancies={vacancies} />)

    await user.type(screen.getByRole('searchbox', { name: 'Zoeken' }), 'developer')

    expect(titles()).toEqual(['Frontend developer', 'Backend developer'])
  })

  it('filtert op bedrijfsnaam', async () => {
    const user = userEvent.setup()
    render(<VacancyList vacancies={vacancies} />)

    await user.type(screen.getByRole('searchbox', { name: 'Zoeken' }), 'ontwerpstudio')

    expect(titles()).toEqual(['UX designer'])
  })

  it('filtert op locatie', async () => {
    const user = userEvent.setup()
    render(<VacancyList vacancies={vacancies} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Locatie' }), 'Utrecht')

    expect(titles()).toEqual(['Frontend developer', 'Klantenservicemedewerker'])
  })

  it('combineert zoekterm en locatie', async () => {
    const user = userEvent.setup()
    render(<VacancyList vacancies={vacancies} />)

    await user.type(screen.getByRole('searchbox', { name: 'Zoeken' }), 'developer')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Locatie' }), 'Amsterdam')

    expect(titles()).toEqual(['Backend developer'])
  })

  it('gebruikt enkelvoud bij één resultaat', async () => {
    const user = userEvent.setup()
    render(<VacancyList vacancies={vacancies} />)

    await user.type(screen.getByRole('searchbox', { name: 'Zoeken' }), 'designer')

    expect(screen.getByRole('status')).toHaveTextContent('1 vacature gevonden')
  })

  it('toont een melding als er niets gevonden is', async () => {
    const user = userEvent.setup()
    render(<VacancyList vacancies={vacancies} />)

    await user.type(screen.getByRole('searchbox', { name: 'Zoeken' }), 'piloot')

    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(
      screen.getByText('Geen vacatures gevonden. Probeer een andere zoekterm.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 vacatures gevonden')
  })

  it('biedt elke locatie één keer aan, alfabetisch', () => {
    render(<VacancyList vacancies={vacancies} />)
    const options = within(screen.getByRole('combobox', { name: 'Locatie' })).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'Alle locaties',
      'Amsterdam',
      'Rotterdam',
      'Utrecht',
    ])
  })
})
