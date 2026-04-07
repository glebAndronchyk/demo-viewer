export class DomainNotFoundError extends Error {
  readonly domainCode = "NOT_FOUND" as const;
  constructor(message: string) {
    super(message);
    this.name = "DomainNotFoundError";
  }
}

export class DomainConflictError extends Error {
  readonly domainCode = "CONFLICT" as const;
  constructor(message: string) {
    super(message);
    this.name = "DomainConflictError";
  }
}

export class DomainUnavailableError extends Error {
  readonly domainCode = "UNAVAILABLE" as const;
  constructor(message: string) {
    super(message);
    this.name = "DomainUnavailableError";
  }
}
