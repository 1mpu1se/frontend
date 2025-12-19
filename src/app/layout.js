"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, LogOut, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { MusicProvider, useMusic } from "@/app/MusicContext";
import PlayerBar from "@/components/PlayerBar";
import AuthModal from "@/components/AuthModal";
import "@/app/globals.css";
import { UserProvider, useUser } from "@/app/UserContext";

function LayoutContent({ children }) {
    const pathname = usePathname();
    const { playingSongId, currentSong, isPlaying, togglePlay, selectOrToggle: handlePlayToggle, selectPrev: handlePrev, selectNext: handleNext } = useMusic();
    const playerVisible = playingSongId !== null;

    const { user, hydrated, checked, setUser, logout } = useUser();

    useEffect(() => {
        let rafId = null;
        const setPlayerVars = () => {
            const header = document.querySelector("header");
            if (!header) return;
            const rect = header.getBoundingClientRect();
            document.documentElement.style.setProperty("--player-top", `${Math.floor(rect.bottom)}px`);
            document.documentElement.style.setProperty("--header-height", `${Math.ceil(rect.height)}px`);
            document.documentElement.style.setProperty("--player-height", playerVisible ? "64px" : "0px");
        };

        const onScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(setPlayerVars);
        };
        setPlayerVars();
        window.addEventListener("resize", setPlayerVars);
        window.addEventListener("scroll", onScroll, { passive: true });
        const obs = new MutationObserver(setPlayerVars);
        obs.observe(document.body, { childList: true, subtree: true });
        return () => {
            window.removeEventListener("resize", setPlayerVars);
            window.removeEventListener("scroll", onScroll);
            obs.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [playerVisible]);

    const handleAuth = (userData) => {
        setUser(userData);
    };

    const handleLogout = async () => {
        await logout();
    };

    if (!hydrated) {
        return (
            <div className="min-h-screen relative overflow-visible bg-purple-300 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 1780 900" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <filter id="blur">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
                        </filter>
                    </defs>
                    <g className="blob" filter="url(#blur)" opacity="0.6">
                        <path d="M 465.328 0.293411 C 356.813 5.68961 306.978 144.397 295.625 213.075 C 283.674 318.547 450.389 224.726 495.206 191 C 540.022 157.274 740.797 301.377 780.236 243.736 C 819.674 186.094 807.125 143.17 664.311 124.161 C 521.498 105.151 600.971 -6.45184 465.328 0.293411 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.6">
                        <path d="M 1136.97 582.225 C 1016.03 649.923 971.849 554.017 964.878 497.602 C 949.342 428.488 943.486 276.538 1044.35 221.66 C 1077.81 213.075 1193.74 168.925 1196.73 99.0194 C 1199.71 29.1141 1459.05 -40.7913 1548.68 37.6989 C 1638.31 116.189 1478.77 228.406 1409.45 191 C 1340.14 153.595 1230.19 262.132 1256.48 362.697 C 1282.77 463.263 1288.15 497.602 1136.97 582.225 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.56">
                        <path d="M 611.13 582.225 C 478.474 536.234 543.01 713.451 410.354 691.375 C 381.074 698.12 324.188 691.62 330.88 611.659 C 339.246 511.706 161.774 497.602 75.1297 497.602 C -11.5147 497.602 -42.5871 609.819 88.2758 649.064 C 219.139 688.309 179.701 757.601 203.005 833.025 C 226.309 908.45 410.354 897.412 433.658 822.601 C 456.963 747.79 611.13 766.186 627.861 812.176 C 644.593 858.167 897.953 822.601 850.149 730.62 C 802.345 638.64 743.786 628.215 611.13 582.225 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.5">
                        <path d="M 1753.04 635.573 C 1808.02 669.913 1776.35 812.176 1681.34 863.686 C 1652 881.5 1611.66 869.45 1571.99 892.506 C 1522.39 921.327 1397.5 863.686 1397.5 776.611 C 1397.5 689.536 1548.68 730.62 1548.68 667.46 C 1548.68 604.3 1698.07 601.234 1753.04 635.573 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.5">
                        <path d="M 1773 387 C 1785.5 438.5 1720.5 477 1659 438.5 C 1629.5 395.5 1516 438.5 1494 395.5 C 1472 352.5 1591 314.5 1631.5 351 C 1672 387.5 1760.5 335.5 1773 387 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.55">
                        <path d="M 107 243.736 C 146 225.471 139 191 39.9999 168.5 C 23.4999 164.418 15.9999 191 56.4999 221.66 C 96.9999 252.321 -58.0001 258 -35.5001 291.5 C -13.0001 325 67.9999 262 107 243.736 Z" fill="#E8E19A" />
                    </g>
                </svg>
                <div className="relative z-10 flex items-center gap-3">
                    <Loader2 className="animate-spin text-white" size={32} />
                    <span className="text-white text-lg">Загрузка...</span>
                </div>
            </div>
        );
    }

    const showAuthPage = checked && !user;

    if (showAuthPage) {
        return (
            <div className="min-h-screen relative overflow-visible bg-purple-300">
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 1780 900" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <filter id="blur">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
                        </filter>
                    </defs>
                    <g className="blob" filter="url(#blur)" opacity="0.6">
                        <path d="M 465.328 0.293411 C 356.813 5.68961 306.978 144.397 295.625 213.075 C 283.674 318.547 450.389 224.726 495.206 191 C 540.022 157.274 740.797 301.377 780.236 243.736 C 819.674 186.094 807.125 143.17 664.311 124.161 C 521.498 105.151 600.971 -6.45184 465.328 0.293411 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.6">
                        <path d="M 1136.97 582.225 C 1016.03 649.923 971.849 554.017 964.878 497.602 C 949.342 428.488 943.486 276.538 1044.35 221.66 C 1077.81 213.075 1193.74 168.925 1196.73 99.0194 C 1199.71 29.1141 1459.05 -40.7913 1548.68 37.6989 C 1638.31 116.189 1478.77 228.406 1409.45 191 C 1340.14 153.595 1230.19 262.132 1256.48 362.697 C 1282.77 463.263 1288.15 497.602 1136.97 582.225 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.56">
                        <path d="M 611.13 582.225 C 478.474 536.234 543.01 713.451 410.354 691.375 C 381.074 698.12 324.188 691.62 330.88 611.659 C 339.246 511.706 161.774 497.602 75.1297 497.602 C -11.5147 497.602 -42.5871 609.819 88.2758 649.064 C 219.139 688.309 179.701 757.601 203.005 833.025 C 226.309 908.45 410.354 897.412 433.658 822.601 C 456.963 747.79 611.13 766.186 627.861 812.176 C 644.593 858.167 897.953 822.601 850.149 730.62 C 802.345 638.64 743.786 628.215 611.13 582.225 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.5">
                        <path d="M 1753.04 635.573 C 1808.02 669.913 1776.35 812.176 1681.34 863.686 C 1652 881.5 1611.66 869.45 1571.99 892.506 C 1522.39 921.327 1397.5 863.686 1397.5 776.611 C 1397.5 689.536 1548.68 730.62 1548.68 667.46 C 1548.68 604.3 1698.07 601.234 1753.04 635.573 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.5">
                        <path d="M 1773 387 C 1785.5 438.5 1720.5 477 1659 438.5 C 1629.5 395.5 1516 438.5 1494 395.5 C 1472 352.5 1591 314.5 1631.5 351 C 1672 387.5 1760.5 335.5 1773 387 Z" fill="#E8E19A" />
                    </g>
                    <g className="blob" filter="url(#blur)" opacity="0.55">
                        <path d="M 107 243.736 C 146 225.471 139 191 39.9999 168.5 C 23.4999 164.418 15.9999 191 56.4999 221.66 C 96.9999 252.321 -58.0001 258 -35.5001 291.5 C -13.0001 325 67.9999 262 107 243.736 Z" fill="#E8E19A" />
                    </g>
                </svg>
                <AuthModal
                    isOpen={true}
                    onClose={() => {}}
                    onAuth={handleAuth}
                />
            </div>
        );
    }

    const isActive = (path) => {
        if (path === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen relative overflow-visible bg-purple-300">
            {/* SVG Background Blobs */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 1780 900" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <filter id="blur">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
                    </filter>
                </defs>

                <g className="blob" filter="url(#blur)" opacity="0.6">
                    <path d="M 465.328 0.293411 C 356.813 5.68961 306.978 144.397 295.625 213.075 C 283.674 318.547 450.389 224.726 495.206 191 C 540.022 157.274 740.797 301.377 780.236 243.736 C 819.674 186.094 807.125 143.17 664.311 124.161 C 521.498 105.151 600.971 -6.45184 465.328 0.293411 Z" fill="#E8E19A" />
                </g>

                <g className="blob" filter="url(#blur)" opacity="0.6">
                    <path d="M 1136.97 582.225 C 1016.03 649.923 971.849 554.017 964.878 497.602 C 949.342 428.488 943.486 276.538 1044.35 221.66 C 1077.81 213.075 1193.74 168.925 1196.73 99.0194 C 1199.71 29.1141 1459.05 -40.7913 1548.68 37.6989 C 1638.31 116.189 1478.77 228.406 1409.45 191 C 1340.14 153.595 1230.19 262.132 1256.48 362.697 C 1282.77 463.263 1288.15 497.602 1136.97 582.225 Z" fill="#E8E19A" />
                </g>

                <g className="blob" filter="url(#blur)" opacity="0.56">
                    <path d="M 611.13 582.225 C 478.474 536.234 543.01 713.451 410.354 691.375 C 381.074 698.12 324.188 691.62 330.88 611.659 C 339.246 511.706 161.774 497.602 75.1297 497.602 C -11.5147 497.602 -42.5871 609.819 88.2758 649.064 C 219.139 688.309 179.701 757.601 203.005 833.025 C 226.309 908.45 410.354 897.412 433.658 822.601 C 456.963 747.79 611.13 766.186 627.861 812.176 C 644.593 858.167 897.953 822.601 850.149 730.62 C 802.345 638.64 743.786 628.215 611.13 582.225 Z" fill="#E8E19A" />
                </g>

                <g className="blob" filter="url(#blur)" opacity="0.5">
                    <path d="M 1753.04 635.573 C 1808.02 669.913 1776.35 812.176 1681.34 863.686 C 1652 881.5 1611.66 869.45 1571.99 892.506 C 1522.39 921.327 1397.5 863.686 1397.5 776.611 C 1397.5 689.536 1548.68 730.62 1548.68 667.46 C 1548.68 604.3 1698.07 601.234 1753.04 635.573 Z" fill="#E8E19A" />
                </g>

                <g className="blob" filter="url(#blur)" opacity="0.5">
                    <path d="M 1773 387 C 1785.5 438.5 1720.5 477 1659 438.5 C 1629.5 395.5 1516 438.5 1494 395.5 C 1472 352.5 1591 314.5 1631.5 351 C 1672 387.5 1760.5 335.5 1773 387 Z" fill="#E8E19A" />
                </g>

                <g className="blob" filter="url(#blur)" opacity="0.55">
                    <path d="M 107 243.736 C 146 225.471 139 191 39.9999 168.5 C 23.4999 164.418 15.9999 191 56.4999 221.66 C 96.9999 252.321 -58.0001 258 -35.5001 291.5 C -13.0001 325 67.9999 262 107 243.736 Z" fill="#E8E19A" />
                </g>
            </svg>

            {/* Header */}
            <header className="relative z-10 bg-[#826d9d]/80 backdrop-blur-sm text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
                    <div className="flex items-center justify-between py-2">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/logo-mobile.svg"
                                alt="impulS mobile logo"
                                width={100}
                                height={100}
                                className="block sm:hidden h-8 w-auto transition"
                                priority
                            />
                            <Image
                                src="/logo.svg"
                                alt="impulS logo"
                                width={150}
                                height={150}
                                className="hidden sm:block h-9 lg:h-10 w-auto transition"
                                priority
                            />
                        </Link>

                        <nav className="hidden md:flex gap-4 absolute left-1/2 transform -translate-x-1/2 pointer-events-auto">
                            <Link
                                href="/"
                                className={`px-4 py-2 rounded-full transition ${
                                    isActive('/')
                                        ? 'bg-white/25'
                                        : 'hover:bg-white/10'
                                }`}
                            >
                                Главная
                            </Link>
                            <Link
                                href="/music"
                                className={`px-4 py-2 rounded-full transition ${
                                    isActive('/music')
                                        ? 'bg-white/25'
                                        : 'hover:bg-white/10'
                                }`}
                            >
                                Музыка
                            </Link>
                            {user && user.is_admin && (
                                <>
                                    <Link
                                        href="/admin/upload"
                                        className={`px-4 py-2 rounded-full transition ${
                                            isActive('/admin/upload')
                                                ? 'bg-white/25'
                                                : 'hover:bg-white/10'
                                        }`}
                                    >
                                        Загрузка
                                    </Link>
                                    <Link
                                        href="/admin/manage"
                                        className={`px-4 py-2 rounded-full transition ${
                                            isActive('/admin/manage')
                                                ? 'bg-white/25'
                                                : 'hover:bg-white/10'
                                        }`}
                                    >
                                        Админ-панель
                                    </Link>
                                </>
                            )}
                        </nav>

                        <div className="flex items-center gap-3">
                            {user && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 min-h-[44px]">
                                        <User size={18} />
                                        <span className="text-sm font-medium">{user.username}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-full hover:bg-white/10 transition"
                                        title="Выйти"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 px-6 py-8" style={{ paddingTop: `calc(var(--player-top, var(--header-height, 64px)) - var(--header-height, 64px) + var(--player-height, 0px))` }}>
                {children}
            </main>

            {/* Global Player */}
            {playerVisible && (
                <PlayerBar
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />
            )}
        </div>
    );
}

export default function RootLayout({ children }) {
    return (
        <html lang="ru">
            <body>
                <MusicProvider>
                    <UserProvider>
                        <LayoutContent>{children}</LayoutContent>
                    </UserProvider>
                </MusicProvider>
            </body>
        </html>
    );
}