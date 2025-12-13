"use client";

import { useUser } from "@/app/UserContext";
import { Loader2 } from "lucide-react";

/**
 * HOC для защиты страниц
 * @param {Component} Component - Компонент страницы
 * @param {Object} options - Опции доступа
 * @param {boolean} options.requireAuth - Требуется авторизация (по умолчанию true)
 * @param {boolean} options.requireAdmin - Требуется админ (по умолчанию false)
 * @param {string} options.redirectMessage - Сообщение при отказе в доступе
 */
export function withAuth(Component, options = {}) {
    const {
        requireAuth = true,
        requireAdmin = false,
        redirectMessage = "У вас нет доступа к этой странице"
    } = options;

    return function ProtectedComponent(props) {
        const { user, hydrated } = useUser();

        // Показываем загрузчик пока идет проверка
        if (!hydrated) {
            return (
                <div
                    className="flex items-center justify-center"
                    style={{
                        height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
                    }}
                >
                    <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin text-white" size={32} />
                        <span className="text-white text-lg">Загрузка...</span>
                    </div>
                </div>
            );
        }

        // Проверка: требуется авторизация, но пользователь не авторизован
        if (requireAuth && !user) {
            return (
                <div
                    className="flex items-center justify-center"
                    style={{
                        height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
                    }}
                >
                    <div className="rounded-3xl p-12 shadow-lg bg-[#826d9d]/80 backdrop-blur-md text-center">
                        <h2 className="text-2xl font-semibold mb-4 text-white">Требуется авторизация</h2>
                        <p className="text-purple-200">Войдите в аккаунт для доступа к этой странице.</p>
                    </div>
                </div>
            );
        }

        // Проверка: требуется админ, но пользователь не админ
        if (requireAdmin && (!user || !user.is_admin)) {
            return (
                <div
                    className="flex items-center justify-center"
                    style={{
                        height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
                    }}
                >
                    <div className="rounded-3xl p-12 shadow-lg bg-[#826d9d]/80 backdrop-blur-md text-center">
                        <h2 className="text-2xl font-semibold mb-4 text-white">Доступ запрещён</h2>
                        <p className="text-purple-200">{redirectMessage}</p>
                    </div>
                </div>
            );
        }

        // Все проверки прошли - рендерим компонент
        return <Component {...props} />;
    };
}

// Экспорт готовых вариантов для удобства
export const withRequireAuth = (Component) => withAuth(Component, { requireAuth: true });
export const withRequireAdmin = (Component) => withAuth(Component, { requireAdmin: true });