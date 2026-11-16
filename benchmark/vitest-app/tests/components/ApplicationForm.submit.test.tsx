import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationForm from '@/components/ApplicationForm'
import { submitApplication } from '@/lib/api'
import { validInput } from '../fixtures'

vi.mock('@/lib/api')

const mockedSubmitApplication = vi.mocked(submitApplication)

type User = ReturnType<typeof userEvent.setup>

async function fillValidForm(user: User, { consent = true } = {}) {
  await user.type(screen.getByRole('textbox', { name: 'Naam' }), validInput.name)
  await user.type(screen.getByRole('textbox', { name: 'E-mail' }), validInput.email)
  await user.type(screen.getByRole('textbox', { name: 'Telefoonnummer' }), validInput.phone)
  await user.type(screen.getByRole('textbox', { name: 'Motivatie' }), validInput.motivation)
  if (consent) {
    await user.click(screen.getByRole('checkbox', { name: 'Ik ga akkoord met de voorwaarden' }))
  }
}

function renderForm() {
  render(<ApplicationForm vacancyId="v1" vacancyTitle="Frontend developer" />)
  return userEvent.setup()
}

const submitButton = () => screen.getByRole('button', { name: 'Verstuur sollicitatie' })

describe('ApplicationForm – versturen', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('verstuurt de ingevulde gegevens met het vacature-id', async () => {
    mockedSubmitApplication.mockResolvedValue({ id: 'a1' })
    const user = renderForm()
    await fillValidForm(user)
    await user.click(submitButton())

    expect(mockedSubmitApplication).toHaveBeenCalledTimes(1)
    expect(mockedSubmitApplication).toHaveBeenCalledWith({ vacancyId: 'v1', ...validInput })
  })

  it('toont een bedankmelding na succesvol versturen', async () => {
    mockedSubmitApplication.mockResolvedValue({ id: 'a1' })
    const user = renderForm()
    await fillValidForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Bedankt voor je sollicitatie op Frontend developer!',
    )
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('schakelt de knop uit tijdens het versturen', async () => {
    let resolveSubmit: (value: { id: string }) => void = () => {}
    mockedSubmitApplication.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve
      }),
    )
    const user = renderForm()
    await fillValidForm(user)
    await user.click(submitButton())

    expect(screen.getByRole('button', { name: 'Bezig met versturen…' })).toBeDisabled()

    resolveSubmit({ id: 'a1' })
    expect(await screen.findByRole('status')).toBeInTheDocument()
  })

  it('toont een foutmelding als versturen mislukt', async () => {
    mockedSubmitApplication.mockRejectedValue(new Error('Serverfout'))
    const user = renderForm()
    await fillValidForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Versturen is mislukt. Probeer het later opnieuw.',
    )
  })

  it('bewaart de invoer na een mislukte poging', async () => {
    mockedSubmitApplication.mockRejectedValue(new Error('Serverfout'))
    const user = renderForm()
    await fillValidForm(user)
    await user.click(submitButton())

    await screen.findByRole('alert')
    expect(screen.getByRole('textbox', { name: 'Naam' })).toHaveValue(validInput.name)
    expect(submitButton()).toBeEnabled()
  })

  it('verstuurt niet zonder akkoord met de voorwaarden', async () => {
    const user = renderForm()
    await fillValidForm(user, { consent: false })
    await user.click(submitButton())

    expect(mockedSubmitApplication).not.toHaveBeenCalled()
    expect(
      screen.getByRole('checkbox', { name: 'Ik ga akkoord met de voorwaarden' }),
    ).toHaveAccessibleDescription('Je moet akkoord gaan met de voorwaarden')
  })
})
