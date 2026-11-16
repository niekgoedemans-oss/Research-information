export type Vacancy = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
};

export type ApplicationInput = {
  name: string;
  email: string;
  phone: string;
  motivation: string;
  consent: boolean;
};

export type Application = ApplicationInput & {
  vacancyId: string;
};

export type ApplicationErrors = Partial<Record<keyof ApplicationInput, string>>;
