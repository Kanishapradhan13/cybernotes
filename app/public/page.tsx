import { getPublicNotes } from "@/lib/notes";
import Navbar from "@/components/Navbar";
import PublicDashboardClient from "./PublicDashboardClient";

export default async function PublicPage() {
  const notes = await getPublicNotes();

  return (
    <>
      <Navbar />
      <PublicDashboardClient notes={notes} />
    </>
  );
}
