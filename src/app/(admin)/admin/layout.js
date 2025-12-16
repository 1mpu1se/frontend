"use client";

import { useUser } from "@/app/UserContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }) {
    const { user, checked } = useUser();

    if (!checked) {
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

    if (!user) {
        return (
            <div
                className="flex items-center justify-center"
                style={{
                    height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
                }}
            >
                <div className="rounded-3xl p-12 shadow-lg bg-[#826d9d]/80 backdrop-blur-md text-center">
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        Требуется авторизация
                    </h2>
                    <p className="text-purple-200">
                        Войдите в аккаунт для доступа к панели администратора.
                    </p>
                </div>
            </div>
        );
    }

    if (!user.is_admin) {
        return (
            <div
                className="flex items-center justify-center"
                style={{
                    height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
                }}
            >
                <div className="rounded-3xl p-12 shadow-lg bg-[#826d9d]/80 backdrop-blur-md text-center">
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        Доступ запрещён
                    </h2>
                    <p className="text-purple-200">
                        У вас нет прав администратора для доступа к этой странице.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
