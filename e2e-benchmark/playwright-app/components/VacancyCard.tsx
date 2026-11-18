"use client";

import { formatSalaryRange } from "@/lib/format";
import type { Vacancy } from "@/lib/types";

type Props = {
  vacancy: Vacancy;
  onApply?: (vacancy: Vacancy) => void;
};

export default function VacancyCard({ vacancy, onApply }: Props) {
  return (
    <article aria-labelledby={`vacancy-${vacancy.id}-title`}>
      <h3 id={`vacancy-${vacancy.id}-title`}>{vacancy.title}</h3>
      <p>{vacancy.company}</p>
      <p>Locatie: {vacancy.location}</p>
      <p>Salaris: {formatSalaryRange(vacancy.salaryMin, vacancy.salaryMax)}</p>
      {onApply ? (
        <button type="button" onClick={() => onApply(vacancy)}>
          Solliciteer op {vacancy.title}
        </button>
      ) : null}
    </article>
  );
}
