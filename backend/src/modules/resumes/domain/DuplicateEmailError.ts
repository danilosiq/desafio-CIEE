export class DuplicateEmailError extends Error {
  constructor() {
    super("A resume with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}
