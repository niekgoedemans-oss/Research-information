import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ApplicationForm from '@/components/ApplicationForm'

// Faalt met opzet (meting C4): de verwachte knoptekst klopt niet met de echte.
describe('C4 – componenttest die faalt', () => {
  it('toont de verstuurknop', () => {
    render(<ApplicationForm vacancyId="v1" vacancyTitle="Frontend developer" />)
    expect(screen.getByRole('button')).toHaveTextContent('Verzenden')
  })
})
