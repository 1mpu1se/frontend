"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import authApi from "@/app/api/auth";

const UserContext = createContext({
    user: null,
    hydrated: false,
    setUser: () => {},
    refreshUser: async () => {},
    logout: async () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [hydrated, setHydrated] = useState(false);

    const setUser = (u) => {
        setUserState(u);
        if (u) authApi.setUser(u);
        else authApi.clearUser();
    };

    const refreshUser = async () => {
        const u = await authApi.whoAmI();
        if (u) setUserState(u);
        return u;
    };

    const logout = async () => {
        await authApi.logout();
        setUserState(null);
        setHydrated(true);
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const local = authApi.getUser();
                if (mounted && local) {
                    setUserState(local);
                }

                const u = await authApi.whoAmI();
                if (mounted && u) {
                    setUserState(u);
                }
            } catch (err) {
                console.warn("UserProvider init error:", err);
            } finally {
                if (mounted) setHydrated(true);
            }
        })();

        return () => { mounted = false; };
    }, []);

    return (
        <UserContext.Provider value={{ user, hydrated, setUser, refreshUser, logout }}>
            {children}
        </UserContext.Provider>
    );
}
