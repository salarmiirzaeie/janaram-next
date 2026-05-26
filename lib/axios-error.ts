/** Axios-like HTTP error without importing axios runtime types (version-safe). */
export type AxiosLikeError = Error & {
  response?: {
    data?: unknown;
    status?: number;
    statusText?: string;
  };
  config?: unknown;
  code?: string;
  isAxiosError?: boolean;
};

/** Duck-type guard — works across axios versions and type-only AxiosError exports. */
export function isAxiosError(err: unknown): err is AxiosLikeError {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  if (e.isAxiosError === true) return true;
  return (
    "response" in e &&
    e.response !== null &&
    typeof e.response === "object" &&
    "config" in e
  );
}

export function getAxiosResponseData<T = unknown>(err: unknown): T | undefined {
  if (!isAxiosError(err)) return undefined;
  return err.response?.data as T | undefined;
}
