export class DuplicateEmailError extends Error {
  constructor(readonly existingId: string) {
    super("Este e-mail já possui um cadastro.");
    this.name = "DuplicateEmailError";
  }
}
