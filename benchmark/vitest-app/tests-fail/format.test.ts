import { describe, expect, it } from 'vitest'
import { formatSalary } from '@/lib/format'

// Faalt met opzet (meting C4): de verwachte waarde klopt niet.
describe('C4 – unittest die faalt', () => {
  it('formatteert 3500 als salaris', () => {
    expect(formatSalary(3500)).toBe('€ 3.000')
  })
})
