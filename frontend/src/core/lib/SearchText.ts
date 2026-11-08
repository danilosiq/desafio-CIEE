function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

export function matchesSearch(value: string, search: string): boolean {
  return normalizeSearch(value).includes(normalizeSearch(search));
}
