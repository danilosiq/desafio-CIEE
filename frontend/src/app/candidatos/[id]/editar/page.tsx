import { ResumeEditorPage } from "@/core/pages/resumes/ResumeEditorPage";
type PageProps = { params: Promise<{ id: string }> };
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ResumeEditorPage id={id} />;
}
