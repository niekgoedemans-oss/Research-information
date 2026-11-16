"use client";

import { useState } from "react";
import { ALL_LOCATIONS, filterVacancies, uniqueLocations } from "@/lib/filter";
import type { Vacancy } from "@/lib/types";
import VacancyCard from "./VacancyCard";

type Props = {
  vacancies: Vacancy[];
  onApply?: (vacancy: Vacancy) => void;
};

export default function VacancyList({ vacancies, onApply }: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(ALL_LOCATIONS);

  const visible = filterVacancies(vacancies, { query, location });
  const locations = uniqueLocations(vacancies);

  return (
    <section aria-label="Vacatures">
      <label htmlFor="vacancy-search">Zoeken</label>
      <input
        id="vacancy-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <label htmlFor="vacancy-location">Locatie</label>
      <select
        id="vacancy-location"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
      >
        <option value={ALL_LOCATIONS}>Alle locaties</option>
        {locations.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <p role="status">
        {visible.length === 1 ? "1 vacature gevonden" : `${visible.length} vacatures gevonden`}
      </p>

      {visible.length === 0 ? (
        <p>Geen vacatures gevonden. Probeer een andere zoekterm.</p>
      ) : (
        <ul>
          {visible.map((vacancy) => (
            <li key={vacancy.id}>
              <VacancyCard vacancy={vacancy} onApply={onApply} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
