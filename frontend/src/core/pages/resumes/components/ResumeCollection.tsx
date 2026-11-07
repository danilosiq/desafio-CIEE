import Link from "next/link";
import { Mail, Phone, ChevronRight, UserRound } from "lucide-react";
import type { Resume } from "@/core/types/Resume";
import { formatPhone } from "@/core/lib/ResumeValidation";
export type ResumeCollectionProps = { rows: Resume[]; view: "list" | "grid" };
export function ResumeCollection({ rows, view }: ResumeCollectionProps) {
  return (
    <div
      data-testid="resume-collection"
      data-view={view}
      className={
        view === "grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-3"
      }
    >
      {rows.map((resume) => (
        <Link
          href={`/candidatos/${resume.id}`}
          aria-label={resume.fullName}
          data-testid="resume-item"
          key={resume.id}
          className={
            view === "grid"
              ? "block cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 transition hover:border-blue-300 hover:shadow-md"
              : "block cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 transition hover:border-blue-300 sm:px-5"
          }
        >
          <div
            className={
              view === "grid"
                ? "flex flex-col gap-4"
                : "grid items-center gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_minmax(0,.9fr)_minmax(0,1fr)_24px] sm:gap-4"
            }
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0">
                <span className="break-words text-sm font-semibold text-blue-950">
                  {resume.fullName}
                </span>
                {view === "grid" && (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {resume.interestArea || "Área não informada"}
                  </p>
                )}
              </div>
            </div>
            {view === "grid" ? (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <p className="flex items-start gap-2 break-all text-xs leading-5 text-slate-500">
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0"
                  />
                  {resume.email}
                </p>
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone aria-hidden="true" className="size-3.5" />
                  {formatPhone(resume.phone) || "Telefone não informado"}
                </p>
              </div>
            ) : (
              <>
                <span className="break-all text-xs text-slate-500">
                  {resume.email}
                </span>
                <span className="text-xs text-slate-500">
                  {formatPhone(resume.phone) || "Não informado"}
                </span>
                <span className="w-fit max-w-full rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-900">
                  {resume.interestArea || "Área não informada"}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden p-1 text-slate-400 sm:block"
                >
                  <ChevronRight className="size-4" />
                </span>
              </>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
