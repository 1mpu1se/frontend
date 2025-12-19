import { BACKEND_URL } from "@/config/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const DEFAULT_TIMEOUT = 7000; // ms

export function setToken(token) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(TOKEN_KEY, token);
        if (localStorage.getItem("token")) localStorage.removeItem("token");
    } catch {}
}

export function getToken() {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token") || null;
    } catch {
        return null;
    }
}

export function clearToken() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("token");
    } catch {}
}

export function setUser(user) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
    try {
        window.dispatchEvent(new CustomEvent("authChange", { detail: user }));
    } catch {}
}

export function getUser() {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearUser() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(USER_KEY);
    } catch {}
    try {
        window.dispatchEvent(new CustomEvent("authChange", { detail: null }));
    } catch {}
}

export function isAuthenticated() {
    return !!getToken();
}

function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(() => controller.abort(), timeout);

    return fetch(url, { ...options, signal }).finally(() => clearTimeout(timer));
}

function extractErrorMessage(data) {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (typeof data === "object") {
        if (data.detail && Array.isArray(data.detail)) {
            return data.detail.map(d => d.msg || JSON.stringify(d)).join(", ");
        }
        if (data.message) return data.message;
        if (data.error) return data.error;
    }
    return null;
}

async function request(path, options = {}, timeout = DEFAULT_TIMEOUT) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetchWithTimeout(`${BACKEND_URL}${path}`, {
        credentials: "include",
        ...options,
        headers,
    }, timeout);

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const msg = extractErrorMessage(data) || res.statusText || "Ошибка запроса";
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function register({ username, password }) {
    const data = await request("/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
    const token = data?.token || (typeof data === "string" ? data : null);
    if (!token) throw new Error("Токен не получен от сервера");
    setToken(token);
    const user = data?.user ?? null;
    if (user) setUser(user);
    return { token, user };
}

export async function login({ username, password }) {
    const data = await request("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });

    const token = data?.token || (typeof data === "string" ? data : null);
    if (!token) throw new Error("Токен не получен от сервера");
    setToken(token);

    const user = data?.user ?? null;
    if (user) setUser(user);
    return { token, user };
}

export async function logout() {
    try {
        await request("/user/logout", { method: "POST" });
    } catch (err) {
        console.warn("logout request failed:", err);
    } finally {
        clearToken();
        clearUser();
    }
}

export async function whoAmI() {
    const token = getToken();
    if (!token) return null; // сразу возвращаем null, если нет токена

    try {
        const res = await fetch(`${BACKEND_URL}/user/me?token=${encodeURIComponent(token)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401 || res.status === 403) {
            clearToken();
            clearUser();
            return null;
        }

        if (!res.ok) {
            console.warn("whoAmI: server returned", res.status);
            return null;
        }

        const data = await res.json();
        const user = data?.user ?? null;
        if (user) setUser(user);
        return user;
    } catch (err) {
        console.warn("whoAmI network error:", err);
        return null;
    }
}

const authApi = {
    register,
    login,
    logout,
    setToken,
    getToken,
    clearToken,
    isAuthenticated,
    setUser,
    getUser,
    clearUser,
    whoAmI,
};

export default authApi;
