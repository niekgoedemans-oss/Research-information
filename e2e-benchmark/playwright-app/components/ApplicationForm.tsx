"use client";

import { useState, type FormEvent } from "react";
import { submitApplication } from "@/lib/api";
import type { ApplicationErrors, ApplicationInput } from "@/lib/types";
import { hasErrors, validateApplication } from "@/lib/validation";

type Props = {
  vacancyId: string;
  vacancyTitle: string;
};

type Status = "idle" | "sending" | "success" | "error";

const EMPTY_INPUT: ApplicationInput = {
  name: "",
  email: "",
  phone: "",
  motivation: "",
  consent: false,
};

export default function ApplicationForm({ vacancyId, vacancyTitle }: Props) {
  const [values, setValues] = useState<ApplicationInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  function update<K extends keyof ApplicationInput>(field: K, value: ApplicationInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateApplication(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }

    setStatus("sending");
    try {
      await submitApplication({ vacancyId, ...values });
      setStatus("success");
      setValues(EMPTY_INPUT);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p role="status">Bedankt voor je sollicitatie op {vacancyTitle}!</p>;
  }

  return (
    <form aria-label={`Solliciteren op ${vacancyTitle}`} noValidate onSubmit={handleSubmit}>
      <label htmlFor="application-name">Naam</label>
      <input
        id="application-name"
        type="text"
        value={values.name}
        aria-invalid={errors.name ? true : undefined}
        aria-describedby={errors.name ? "application-name-error" : undefined}
        onChange={(event) => update("name", event.target.value)}
      />
      {errors.name ? (
        <p id="application-name-error" className="error">
          {errors.name}
        </p>
      ) : null}

      <label htmlFor="application-email">E-mail</label>
      <input
        id="application-email"
        type="email"
        value={values.email}
        aria-invalid={errors.email ? true : undefined}
        aria-describedby={errors.email ? "application-email-error" : undefined}
        onChange={(event) => update("email", event.target.value)}
      />
      {errors.email ? (
        <p id="application-email-error" className="error">
          {errors.email}
        </p>
      ) : null}

      <label htmlFor="application-phone">Telefoonnummer</label>
      <input
        id="application-phone"
        type="tel"
        value={values.phone}
        aria-invalid={errors.phone ? true : undefined}
        aria-describedby={errors.phone ? "application-phone-error" : undefined}
        onChange={(event) => update("phone", event.target.value)}
      />
      {errors.phone ? (
        <p id="application-phone-error" className="error">
          {errors.phone}
        </p>
      ) : null}

      <label htmlFor="application-motivation">Motivatie</label>
      <textarea
        id="application-motivation"
        rows={5}
        value={values.motivation}
        aria-invalid={errors.motivation ? true : undefined}
        aria-describedby={errors.motivation ? "application-motivation-error" : undefined}
        onChange={(event) => update("motivation", event.target.value)}
      />
      {errors.motivation ? (
        <p id="application-motivation-error" className="error">
          {errors.motivation}
        </p>
      ) : null}

      <label>
        <input
          type="checkbox"
          checked={values.consent}
          aria-invalid={errors.consent ? true : undefined}
          aria-describedby={errors.consent ? "application-consent-error" : undefined}
          onChange={(event) => update("consent", event.target.checked)}
        />{" "}
        Ik ga akkoord met de voorwaarden
      </label>
      {errors.consent ? (
        <p id="application-consent-error" className="error">
          {errors.consent}
        </p>
      ) : null}

      {status === "error" ? (
        <p role="alert">Versturen is mislukt. Probeer het later opnieuw.</p>
      ) : null}

      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Bezig met versturen…" : "Verstuur sollicitatie"}
      </button>
    </form>
  );
}
