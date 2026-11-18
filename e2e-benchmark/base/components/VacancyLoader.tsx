"use client";

import { useEffect, useState } from "react";
import { fetchVacancies } from "@/lib/api";
import type { Vacancy } from "@/lib/types";
import VacancyList from "./VacancyList";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; vacancies: Vacancy[] };

export default function VacancyLoader() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchVacancies()
      .then((vacancies) => {
        if (!cancelled) setState({ status: "loaded", vacancies });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p>Vacatures laden…</p>;
  }

  if (state.status === "error") {
    return <p role="alert">Vacatures konden niet worden geladen.</p>;
  }

  return <VacancyList vacancies={state.vacancies} />;
}
