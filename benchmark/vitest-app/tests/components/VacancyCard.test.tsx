import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VacancyCard from '@/components/VacancyCard'
import { vacancies } from '../fixtures'

const vacancy = vacancies[0]

describe('VacancyCard', () => {
  it('toont de titel als kop', () => {
    render(<VacancyCard vacancy={vacancy} />)
    expect(screen.getByRole('heading', { name: 'Frontend developer' })).toBeInTheDocument()
  })

  it('toont bedrijf en locatie', () => {
    render(<VacancyCard vacancy={vacancy} />)
    expect(screen.getByText('Pixelwerk Fictief BV')).toBeInTheDocument()
    expect(screen.getByText('Locatie: Utrecht')).toBeInTheDocument()
  })

  it('toont het geformatteerde salaris', () => {
    render(<VacancyCard vacancy={vacancy} />)
    expect(screen.getByText('Salaris: € 3.800 – € 5.200 per maand')).toBeInTheDocument()
  })

  it('toont geen sollicitatieknop zonder onApply', () => {
    render(<VacancyCard vacancy={vacancy} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('roept onApply aan met de vacature bij een klik op de knop', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<VacancyCard vacancy={vacancy} onApply={onApply} />)

    await user.click(screen.getByRole('button', { name: 'Solliciteer op Frontend developer' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith(vacancy)
  })
})
