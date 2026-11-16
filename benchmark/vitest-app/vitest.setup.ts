import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Afwijking van de Next.js-gids (zie SETUP.md):
// React Testing Library ruimt alleen automatisch op als er een globale afterEach is.
// Jest heeft die; Vitest zonder `globals: true` niet.
afterEach(() => {
  cleanup()
})
