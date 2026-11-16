import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VacancyLoader from '@/components/VacancyLoader'
import { fetchVacancies } from '@/lib/api'
import { vacancies } from '../fixtures'

jest.mock('@/lib/api')

const mockedFetchVacancies = jest.mocked(fetchVacancies)

describe('VacancyLoader', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('toont een laadmelding zolang de vacatures worden opgehaald', async () => {
    mockedFetchVacancies.mockResolvedValue(vacancies)
    render(<VacancyLoader />)

    expect(screen.getByText('Vacatures laden…')).toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(4)
  })

  it('haalt de vacatures precies één keer op', async () => {
    mockedFetchVacancies.mockResolvedValue(vacancies)
    render(<VacancyLoader />)

    await screen.findAllByRole('article')
    expect(mockedFetchVacancies).toHaveBeenCalledTimes(1)
  })

  it('toont de opgehaalde vacatures', async () => {
    mockedFetchVacancies.mockResolvedValue(vacancies)
    render(<VacancyLoader />)

    expect(await screen.findByRole('heading', { name: 'Backend developer' })).toBeInTheDocument()
    expect(screen.queryByText('Vacatures laden…')).not.toBeInTheDocument()
  })

  it('toont een foutmelding als ophalen mislukt', async () => {
    mockedFetchVacancies.mockRejectedValue(new Error('Netwerkfout'))
    render(<VacancyLoader />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vacatures konden niet worden geladen.',
    )
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('maakt de opgehaalde vacatures doorzoekbaar', async () => {
    const user = userEvent.setup()
    mockedFetchVacancies.mockResolvedValue(vacancies)
    render(<VacancyLoader />)

    await user.type(await screen.findByRole('searchbox', { name: 'Zoeken' }), 'klantenservice')

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Klantenservicemedewerker' })).toBeInTheDocument()
  })
})
