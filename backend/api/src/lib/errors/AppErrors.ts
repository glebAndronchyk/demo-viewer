export class UnauthorizedError extends Error {
  status = 401 as const;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ResourceNotFoundError extends Error {
  status = 404 as const;
  constructor(resource: string, id?: string) {
    super(id ? `${resource} not found: ${id}` : `${resource} not found`);
    this.name = "ResourceNotFoundError";
  }
}

export class BadRequestError extends Error {
  status = 400 as const;
  constructor(message = "Bad request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends Error {
  status = 409 as const;
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class ServiceUnavailableError extends Error {
  status = 503 as const;
  constructor(message = "Service unavailable") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}
