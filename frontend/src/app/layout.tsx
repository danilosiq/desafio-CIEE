import type { Metadata } from "next";
import type { ReactNode } from "react";
import "tailwindcss/index.css";
import { AppProviders } from "@/core/providers/AppProviders";
import { AppShell } from "@/core/components/AppShell";
export const metadata: Metadata = {
  title: "Banco de candidatos | Desafio CIEE",
  description:
    "Cadastro e consulta de candidatos — demonstração do desafio CIEE.",
};
type RootLayoutProps = { children: ReactNode };
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className="m-0 font-sans antialiased [&_button:not(:disabled)]:cursor-pointer">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
