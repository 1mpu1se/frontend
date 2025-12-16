"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import authApi from "@/app/api/authApi";

const UserContext = createContext({
    user: null,
    hydrated: false,
    checked: false,
    setUser: () => {},
    refreshUser: async () => {},
    logout: async () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
    const isMountedRef = useRef(true);
    const ongoingRef = useRef(null);
    const [user, setUserState] = useState(null);
    const [hydrated, setHydrated] = useState(false);
    const [checked, setChecked] = useState(false);

    const setUser = (u) => {
        if (u) {
            authApi.setUser(u);
        } else {
            authApi.clearUser();
        }

        if (isMountedRef.current) {
            setUserState(u);
        }
    };

    const refreshUser = async () => {
        if (ongoingRef.current) return ongoingRef.current;

        const p = (async () => {
            try {
                const u = await authApi.whoAmI();
                setUser(u || null);
                return u || null;
            } catch (err) {
                console.warn("refreshUser error", err);
                setUser(null);
                return null;
            } finally {
                ongoingRef.current = null;
            }
        })();

        ongoingRef.current = p;
        return p;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.warn("logout error", err);
        } finally {
            setUser(null);
            if (isMountedRef.current) {
                setChecked(true);
            }
        }
    };

    useEffect(() => {
        let mounted = true;
        setHydrated(true);

        (async () => {
            try {
                if (!mounted) return;
                await refreshUser();
            } finally {
                if (mounted) setChecked(true);
            }
        })();

        return () => { mounted = false; };
    }, []);

    const value = useMemo(() => ({
        user,
        hydrated,
        checked,
        setUser,
        refreshUser,
        logout
    }), [user, hydrated, checked]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}
