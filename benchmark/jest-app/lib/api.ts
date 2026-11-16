import type { Application, Vacancy } from "./types";

// Fictieve, niet-bestaande API (.example is een gereserveerd domein).
export const API_BASE_URL = "https://api.vacaturebank.example/v1";

export async function fetchVacancies(): Promise<Vacancy[]> {
  const response = await fetch(`${API_BASE_URL}/vacancies`);
  if (!response.ok) {
    throw new Error(`Vacatures ophalen mislukt (${response.status})`);
  }
  return (await response.json()) as Vacancy[];
}

export async function submitApplication(application: Application): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(application),
  });
  if (!response.ok) {
    throw new Error(`Sollicitatie versturen mislukt (${response.status})`);
  }
  return (await response.json()) as { id: string };
}
