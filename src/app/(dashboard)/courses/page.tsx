import { PageHeader } from "@/components/ui";
import { CoursesManager } from "@/components/courses/courses-manager";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const { courses, settings } = await getDb();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="Courses & fees"
        description="Set the actual fee and the final discounted fee for every course. Invoices pick these prices automatically."
      />
      <CoursesManager courses={courses} currency={settings.currency} />
    </div>
  );
}
