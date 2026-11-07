export function requireTestDatabase(): void {
  const [address, ...parts] = (process.env.DATABASE_URL ?? "").split(";");
  const parameters = parts.filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    return [
      part.slice(0, separator).toLowerCase(),
      part.slice(separator + 1),
    ] as const;
  });
  const allowed = new Set([
    "database",
    "user",
    "password",
    "encrypt",
    "trustservercertificate",
  ]);
  const uniqueKeys = new Set(parameters.map(([key]) => key));
  const database = parameters.find(([key]) => key === "database")?.[1];
  if (
    process.env.NODE_ENV !== "test" ||
    !/^sqlserver:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(address) ||
    database !== "ciee_test" ||
    uniqueKeys.size !== parameters.length ||
    parameters.some(([key]) => !allowed.has(key))
  ) {
    throw new Error(
      "Tests require NODE_ENV=test and local database ciee_test.",
    );
  }
}
