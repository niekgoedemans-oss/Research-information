import type { Vacancy } from "./types";

export type VacancyFilter = {
  query: string;
  location: string;
};

export const ALL_LOCATIONS = "";

export function filterVacancies(vacancies: Vacancy[], filter: VacancyFilter): Vacancy[] {
  const query = filter.query.trim().toLowerCase();

  return vacancies.filter((vacancy) => {
    const matchesQuery =
      query === "" ||
      vacancy.title.toLowerCase().includes(query) ||
      vacancy.company.toLowerCase().includes(query);
    const matchesLocation =
      filter.location === ALL_LOCATIONS || vacancy.location === filter.location;
    return matchesQuery && matchesLocation;
  });
}

export function uniqueLocations(vacancies: Vacancy[]): string[] {
  return Array.from(new Set(vacancies.map((vacancy) => vacancy.location))).sort((a, b) =>
    a.localeCompare(b, "nl"),
  );
}
