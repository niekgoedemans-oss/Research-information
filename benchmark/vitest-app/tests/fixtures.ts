import type { ApplicationInput, Vacancy } from '@/lib/types'

// Fictieve vacatures en bedrijven.
export const vacancies: Vacancy[] = [
  {
    id: 'v1',
    title: 'Frontend developer',
    company: 'Pixelwerk Fictief BV',
    location: 'Utrecht',
    salaryMin: 3800,
    salaryMax: 5200,
  },
  {
    id: 'v2',
    title: 'Backend developer',
    company: 'Datafabriek Voorbeeld',
    location: 'Amsterdam',
    salaryMin: 4000,
    salaryMax: 5600,
  },
  {
    id: 'v3',
    title: 'Klantenservicemedewerker',
    company: 'Helpdesk Testbedrijf',
    location: 'Utrecht',
    salaryMin: 2600,
    salaryMax: 3000,
  },
  {
    id: 'v4',
    title: 'UX designer',
    company: 'Ontwerpstudio Verzonnen',
    location: 'Rotterdam',
    salaryMin: 3500,
    salaryMax: 4800,
  },
]

export const validInput: ApplicationInput = {
  name: 'Sanne de Vries',
  email: 'sanne@voorbeeld.example',
  phone: '06-12345678',
  motivation: 'Ik bouw graag toegankelijke interfaces voor echte gebruikers.',
  consent: true,
}
