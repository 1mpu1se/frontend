"use client";

import { useState } from "react";
import { X, User, Lock } from "lucide-react";
import Image from "next/image";
import authApi from "@/app/api/authApi";
import { useUser } from "@/app/UserContext";

export default function AuthModal({ isOpen, onClose, onAuth }) {
    const [mode, setMode] = useState("login"); // "login" или "register"
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { setUser } = useUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (mode === "register") {
            if (formData.username.length < 4) {
                setError("Имя пользователя должно содержать минимум 4 символа");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Пароли не совпадают");
                return;
            }
            if (formData.password.length < 8) {
                setError("Пароль должен содержать минимум 8 символов");
                return;
            }
        }

        setLoading(true);
        try {
            if (mode === "register") {
                await authApi.register({
                    username: formData.username,
                    password: formData.password,
                });
            } else {
                await authApi.login({
                    username: formData.username,
                    password: formData.password,
                });
            }

            const currentUser = await authApi.whoAmI();
            if (!currentUser) {
                throw new Error("Не удалось получить данные пользователя");
            }

            setUser(currentUser);

            onAuth && onAuth(currentUser);
            onClose && onClose();
        } catch (err) {
            console.error("Auth error:", err);
            let errorMessage = err?.message || "Ошибка авторизации";

            if (mode === "register") {
                if (err?.status === 409 || err?.status === 400) {
                    errorMessage = "Пользователь с таким именем уже существует";
                }
                else if (errorMessage.toLowerCase().includes("already exists") ||
                    errorMessage.toLowerCase().includes("уже существует") ||
                    errorMessage.toLowerCase().includes("already registered") ||
                    errorMessage.toLowerCase().includes("duplicate")) {
                    errorMessage = "Пользователь с таким именем уже существует";
                }
                else if (err?.data?.detail) {
                    const detail = typeof err.data.detail === 'string'
                        ? err.data.detail
                        : JSON.stringify(err.data.detail);

                    if (detail.toLowerCase().includes("already exists") ||
                        detail.toLowerCase().includes("уже существует") ||
                        detail.toLowerCase().includes("already registered") ||
                        detail.toLowerCase().includes("duplicate")) {
                        errorMessage = "Пользователь с таким именем уже существует";
                    } else {
                        errorMessage = detail;
                    }
                }
            } else {
                if (err?.status === 401 || err?.status === 403) {
                    errorMessage = "Неверное имя пользователя или пароль";
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError("");
    };

    const switchMode = () => {
        setMode(mode === "login" ? "register" : "login");
        setError("");
        setFormData({
            username: "",
            password: "",
            confirmPassword: ""
        });
    };

    if (!isOpen) return null;

    const isModal = !!onClose && onClose !== (() => {});

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${isModal ? 'cursor-pointer' : ''}`}
                onClick={isModal ? onClose : undefined}
            />

            <div className="relative bg-[#826d9d]/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md p-8 text-white">

                {isModal && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                    >
                        <X size={24} />
                    </button>
                )}

                <div className="flex justify-center mb-6">
                    <Image
                        src="/logo.svg"
                        alt="impulS logo"
                        width={150}
                        height={150}
                        className="h-12 w-auto"
                    />
                </div>

                <h2 className="text-2xl font-bold mb-5 text-center">
                    {mode === "login" ? "Вход в аккаунт" : "Регистрация"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {mode === "register" ? "Имя пользователя" : "Логин"}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" size={20} />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition placeholder-white/50"
                                placeholder={mode === "register" ? "Введите имя пользователя" : "Введите логин"}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Пароль
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" size={20} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition placeholder-white/50"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {mode === "register" && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Подтвердите пароль
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" size={20} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition placeholder-white/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-white text-purple-700 font-semibold hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? "Загрузка..."
                            : mode === "login" ? "Войти" : "Зарегистрироваться"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={switchMode}
                        className="text-white/70 hover:text-white transition text-sm"
                    >
                        {mode === "login"
                            ? "Нет аккаунта? Зарегистрируйтесь"
                            : "Уже есть аккаунт? Войдите"}
                    </button>
                </div>
            </div>
        </div>
    );
}