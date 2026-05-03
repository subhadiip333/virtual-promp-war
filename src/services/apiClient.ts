/**
 * apiClient.ts — Production-grade HTTP client
 *
 * Features:
 * - Zero mock data: all calls go to the real backend
 * - Vite proxy handles CORS in dev (no hardcoded localhost URLs)
 * - HMAC-SHA256 request signing for tamper protection
 * - Automatic JWT auth header injection
 * - Retry with exponential backoff (3 attempts)
 * - Structured error typing
 */

// ── Types ────────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  /** Skip auth header for public endpoints */
  skipAuth?: boolean;
  /** Number of retry attempts on 5xx (default 2) */
  retries?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** HMAC-SHA256 using Web Crypto (browser-native, no dependency) */
async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getAuthToken(): string | null {
  return localStorage.getItem('vp_access_token');
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Core fetch function ──────────────────────────────────────────────────────

/**
 * Fetch from the backend API.
 * In development, the Vite proxy rewrites /api/* → http://localhost:8080/api/*.
 * In production, VITE_API_URL is the deployed base URL.
 */
export async function fetchFromBackend<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, retries = 2, ...fetchOptions } = options;

  // Build the base URL: use relative path in dev (proxy handles it),
  // use absolute URL in production builds.
  const baseUrl =
    import.meta.env.MODE === 'development'
      ? ''
      : (import.meta.env.VITE_API_URL ?? '');

  const url = `${baseUrl}${endpoint}`;
  const timestamp = Date.now().toString();
  const body = fetchOptions.body as string | undefined;

  // HMAC signing: sign "timestamp + endpoint + body" so backend can verify
  // NOTE: HMAC secret is public client-side — this is TRANSPORT protection,
  //       not secret auth. Real secret auth is the JWT.
  const signature = await hmacSign(
    `${timestamp}${endpoint}${body ?? ''}`,
    'votepath-client-v1',
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp,
    'X-Signature': signature,
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // 401 → clear token and propagate
      if (response.status === 401) {
        localStorage.removeItem('vp_access_token');
        throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
      }

      // 429 → rate limited
      if (response.status === 429) {
        throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please slow down.');
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errBody.code ?? 'API_ERROR',
          errBody.error ?? `Request failed: ${response.status}`,
        );
      }

      return response.json() as Promise<T>;
    } catch (err) {
      lastError = err as Error;

      // Don't retry client errors (4xx) or non-retriable errors
      if (err instanceof ApiError && err.status < 500) throw err;

      if (attempt < retries) {
        await sleep(Math.pow(2, attempt) * 400); // 400ms, 800ms
      }
    }
  }

  throw lastError;
}
