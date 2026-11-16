import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationForm from '@/components/ApplicationForm'
import { submitApplication } from '@/lib/api'

vi.mock('@/lib/api')

const mockedSubmitApplication = vi.mocked(submitApplication)

function renderForm() {
  render(<ApplicationForm vacancyId="v1" vacancyTitle="Frontend developer" />)
  return userEvent.setup()
}

const submitButton = () => screen.getByRole('button', { name: 'Verstuur sollicitatie' })

describe('ApplicationForm – validatie', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('toont alle velden met een toegankelijke naam', () => {
    renderForm()
    expect(screen.getByRole('form', { name: 'Solliciteren op Frontend developer' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Naam' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Telefoonnummer' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Motivatie' })).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Ik ga akkoord met de voorwaarden' }),
    ).not.toBeChecked()
  })

  it('toont foutmeldingen voor alle verplichte velden bij een leeg formulier', async () => {
    const user = renderForm()
    await user.click(submitButton())

    expect(screen.getByText('Naam is verplicht')).toBeInTheDocument()
    expect(screen.getByText('E-mail is verplicht')).toBeInTheDocument()
    expect(screen.getByText('Telefoonnummer is verplicht')).toBeInTheDocument()
    expect(screen.getByText('Motivatie moet minimaal 20 tekens bevatten')).toBeInTheDocument()
    expect(screen.getByText('Je moet akkoord gaan met de voorwaarden')).toBeInTheDocument()
  })

  it('koppelt de foutmelding aan een ongeldig e-mailveld', async () => {
    const user = renderForm()
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'sanne@')
    await user.click(submitButton())

    const email = screen.getByRole('textbox', { name: 'E-mail' })
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Vul een geldig e-mailadres in')
  })

  it('meldt een ongeldig telefoonnummer', async () => {
    const user = renderForm()
    await user.type(screen.getByRole('textbox', { name: 'Telefoonnummer' }), '12345')
    await user.click(submitButton())

    expect(screen.getByRole('textbox', { name: 'Telefoonnummer' })).toHaveAccessibleDescription(
      'Vul een geldig Nederlands telefoonnummer in',
    )
  })

  it('meldt een te korte motivatie', async () => {
    const user = renderForm()
    await user.type(screen.getByRole('textbox', { name: 'Motivatie' }), 'Te kort')
    await user.click(submitButton())

    expect(screen.getByRole('textbox', { name: 'Motivatie' })).toHaveAccessibleDescription(
      'Motivatie moet minimaal 20 tekens bevatten',
    )
  })

  it('verstuurt niets zolang er fouten zijn', async () => {
    const user = renderForm()
    await user.click(submitButton())

    expect(mockedSubmitApplication).not.toHaveBeenCalled()
  })

  it('haalt een foutmelding weg nadat het veld is verbeterd', async () => {
    const user = renderForm()
    await user.click(submitButton())
    expect(screen.getByText('Naam is verplicht')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Naam' }), 'Sanne de Vries')
    await user.click(submitButton())

    expect(screen.queryByText('Naam is verplicht')).not.toBeInTheDocument()
    expect(screen.getByText('E-mail is verplicht')).toBeInTheDocument()
  })
})
