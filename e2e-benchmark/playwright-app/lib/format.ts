function withThousandsSeparator(amount: number): string {
  const rounded = Math.round(Math.abs(amount)).toString();
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Bewust zonder Intl: de uitvoer hangt dan niet af van de ICU-versie van Node.
export function formatSalary(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new Error("Salaris moet een eindig getal zijn");
  }
  const sign = amount < 0 ? "-" : "";
  return `${sign}€ ${withThousandsSeparator(amount)}`;
}

export function formatSalaryRange(min: number, max: number): string {
  if (min > max) {
    throw new Error("Minimumsalaris mag niet hoger zijn dan maximumsalaris");
  }
  if (min === max) {
    return `${formatSalary(min)} per maand`;
  }
  return `${formatSalary(min)} – ${formatSalary(max)} per maand`;
}
