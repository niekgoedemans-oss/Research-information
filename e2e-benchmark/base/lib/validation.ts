import type { ApplicationErrors, ApplicationInput } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Nederlands nummer: 0, +31 of 0031, gevolgd door 9 cijfers (eerste cijfer geen 0).
const DUTCH_PHONE_PATTERN = /^(?:0|\+31|0031)[1-9]\d{8}$/;

export const MIN_MOTIVATION_LENGTH = 20;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidDutchPhone(value: string): boolean {
  return DUTCH_PHONE_PATTERN.test(normalizePhone(value.trim()));
}

export function validateApplication(input: ApplicationInput): ApplicationErrors {
  const errors: ApplicationErrors = {};

  if (input.name.trim() === "") {
    errors.name = "Naam is verplicht";
  }

  if (input.email.trim() === "") {
    errors.email = "E-mail is verplicht";
  } else if (!isValidEmail(input.email)) {
    errors.email = "Vul een geldig e-mailadres in";
  }

  if (input.phone.trim() === "") {
    errors.phone = "Telefoonnummer is verplicht";
  } else if (!isValidDutchPhone(input.phone)) {
    errors.phone = "Vul een geldig Nederlands telefoonnummer in";
  }

  if (input.motivation.trim().length < MIN_MOTIVATION_LENGTH) {
    errors.motivation = `Motivatie moet minimaal ${MIN_MOTIVATION_LENGTH} tekens bevatten`;
  }

  if (!input.consent) {
    errors.consent = "Je moet akkoord gaan met de voorwaarden";
  }

  return errors;
}

export function hasErrors(errors: ApplicationErrors): boolean {
  return Object.keys(errors).length > 0;
}
