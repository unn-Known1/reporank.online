export class GitHubApiError extends Error {
  public readonly status: number;
  public readonly retryable: boolean;
  public readonly retryAfterSec?: number;

  constructor(message: string, status: number, options?: { retryable?: boolean; retryAfterSec?: number }) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.retryable = options?.retryable ?? (status !== 401 && status !== 404);
    this.retryAfterSec = options?.retryAfterSec;
  }
}
