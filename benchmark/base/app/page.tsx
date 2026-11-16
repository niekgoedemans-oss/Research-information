import ApplicationForm from "@/components/ApplicationForm";
import VacancyLoader from "@/components/VacancyLoader";

// Server Component (synchroon). Wordt bewust niet getest: zie README.
export default function Home() {
  return (
    <main>
      <h1>Vacatures</h1>
      <VacancyLoader />
      <h2>Open sollicitatie</h2>
      <ApplicationForm vacancyId="open" vacancyTitle="Open sollicitatie" />
    </main>
  );
}
