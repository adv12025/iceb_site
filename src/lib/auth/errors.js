/* One error type for every auth provider, so the UI never depends on a specific backend's error format.
   `code` is for the program, `message` is shown to the user, `field` (optional) says which input to highlight. */
export class AuthError extends Error {
  constructor(code, message, field) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.field = field;
  }
}

/* Codes the UI knows about. A new provider should map its own errors onto these. */
export const CODES = {
  EMAIL_TAKEN: "EMAIL_TAKEN",
  BAD_CREDENTIALS: "BAD_CREDENTIALS",
  INVALID: "INVALID",
  UNAVAILABLE: "UNAVAILABLE", // network down, storage blocked, crypto missing...
};
