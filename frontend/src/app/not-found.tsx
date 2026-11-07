import Link from "next/link";
import { Column, Text, Title } from "@/core/components/Primitives";
import { Button } from "@/components/ui/Button";
export default function NotFound() {
  return (
    <Column className="items-center gap-4 py-20">
      <Title className="text-2xl">Página não encontrada</Title>
      <Text>Este endereço não está disponível.</Text>
      <Button asChild>
        <Link href="/">Voltar aos candidatos</Link>
      </Button>
    </Column>
  );
}
