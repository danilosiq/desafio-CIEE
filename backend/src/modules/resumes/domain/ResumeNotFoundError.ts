export class ResumeNotFoundError extends Error {
  constructor() {
    super("Cadastro não encontrado.");
    this.name = "ResumeNotFoundError";
  }
}
