import { Suspense } from "react";
import { ResumeDetailsPage } from "@/core/pages/resumes/ResumeDetailsPage";
type PageProps = { params: Promise<{ id: string }> };
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense>
      <ResumeDetailsPage id={id} />
    </Suspense>
  );
}
