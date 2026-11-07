import type { Resume } from "@/core/types/Resume";
export const MOCK_STORAGE_KEY = "ciee-resumes-demo-v1";
export const resumeFixtures: Resume[] = [
  {
    id: "ana-pereira",
    fullName: "Ana Pereira",
    email: "ana.pereira@example.com",
    phone: "(11) 98765-4321",
    interestArea: "Design de produto",
    areaOfExpertiseId: "design",
    professionalSummary:
      "Designer com interesse em experiências digitais acessíveis e pesquisa com usuários.",
    createdAt: "2026-11-04T12:00:00.000Z",
    updatedAt: "2026-11-04T12:00:00.000Z",
  },
  {
    id: "lucas-oliveira",
    fullName: "Lucas Oliveira",
    email: "lucas.oliveira@example.com",
    phone: "(11) 97654-3210",
    interestArea: "Desenvolvimento frontend",
    areaOfExpertiseId: "frontend",
    professionalSummary:
      "Estudante de tecnologia com experiência em React e vontade de transformar ideias em produtos.",
    createdAt: "2026-11-03T14:00:00.000Z",
    updatedAt: "2026-11-03T14:00:00.000Z",
  },
  {
    id: "beatriz-santos",
    fullName: "Beatriz Santos",
    email: "beatriz.santos@example.com",
    phone: "(21) 96543-2109",
    interestArea: "Marketing e comunicação",
    areaOfExpertiseId: "marketing",
    professionalSummary:
      "Interesse em comunicação, produção de conteúdo e planejamento de campanhas.",
    createdAt: "2026-11-02T15:00:00.000Z",
    updatedAt: "2026-11-02T15:00:00.000Z",
  },
  {
    id: "rafael-costa",
    fullName: "Rafael Costa",
    email: "rafael.costa@example.com",
    phone: "",
    interestArea: "Análise de dados",
    areaOfExpertiseId: "dados",
    professionalSummary:
      "Estudante de administração com conhecimentos em análise de dados e visualização de informações.",
    createdAt: "2026-11-01T12:00:00.000Z",
    updatedAt: "2026-11-01T12:00:00.000Z",
  },
  {
    id: "julia-almeida",
    fullName: "Júlia Almeida",
    email: "julia.almeida@example.com",
    phone: "(31) 99876-5432",
    interestArea: "Recursos humanos",
    areaOfExpertiseId: "rh",
    professionalSummary:
      "Interesse em recrutamento, desenvolvimento de pessoas e cultura organizacional.",
    createdAt: "2026-10-30T12:00:00.000Z",
    updatedAt: "2026-10-30T12:00:00.000Z",
  },
];
