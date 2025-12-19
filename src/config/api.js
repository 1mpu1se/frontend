const runtimeBackend = (typeof window !== "undefined" && window.__RUNTIME_ENV && window.__RUNTIME_ENV.NEXT_PUBLIC_BACKEND_URL)
    ? window.__RUNTIME_ENV.NEXT_PUBLIC_BACKEND_URL
    : undefined;

export const BACKEND_URL = runtimeBackend
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:8080";