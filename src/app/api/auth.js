import { BACKEND_URL } from "@/config/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

async function request(path, options = {}) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const msg = extractErrorMessage(data) || res.statusText || "Ошибка запроса";
        throw new Error(msg);
    }

    return data;
}

function extractErrorMessage(data) {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data.detail && Array.isArray(data.detail)) {
        return data.detail
            .map((d) => d.msg || (d?.type ? `${d.type}` : JSON.stringify(d)))
            .join(", ");
    }
    if (data.message) return data.message;
    return null;
}

export function setToken(token) {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
    }
}
export function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
    }
}
export function isAuthenticated() {
    return !!getToken();
}

export function setUser(user) {
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {
        }
    }
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
    if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
    }
}

export async function register({ username, password }) {
    const data = await request("/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });

    const token = data?.token || (typeof data === "string" ? data : null);
    if (!token) throw new Error("Токен не получен от сервера");

    setToken(token);
    const user = { username };
    setUser(user);
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
    const user = { username };
    setUser(user);
    return { token, user };
}

export async function logout() {
    const token = getToken();
    if (token) {
        try {
            await request(`/user/logout?token=${encodeURIComponent(token)}`, {
                method: "GET",
            });
        } catch {
        }
    }
    clearToken();
    clearUser();
}

export function authQuery() {
    const t = getToken();
    return t ? `?token=${encodeURIComponent(t)}` : "";
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
    authQuery,
};

export default authApi;
