/**
 * Fetch with exponential-backoff retry.
 *
 * Retries on network errors or 5xx responses. Never retries on 4xx
 * (bad request, rate limit, auth failure) since those won't resolve on retry.
 *
 * @param input  - Same as fetch's first argument
 * @param init   - Same as fetch's second argument
 * @param opts   - { attempts: max tries (default 3), baseDelay: first delay ms (default 1000) }
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts: { attempts?: number; baseDelay?: number } = {},
): Promise<Response> {
  const { attempts = 3, baseDelay = 1000 } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(input, init);
      // Retry on server errors only
      if (res.status >= 500 && attempt < attempts - 1) {
        await delay(baseDelay * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < attempts - 1) {
        await delay(baseDelay * 2 ** attempt);
      }
    }
  }
  throw lastErr;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
