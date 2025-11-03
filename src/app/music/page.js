"use client";
import React, { useEffect, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import Equalizer from "./Equalizer";
import PlayerBar from "./PlayerBar";
export default function MusicPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [playingSongId, setPlayingSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

        const songs = [
        { id: 1, title: "Я твой номер один", artist: "Дима Билан", duration: "3:09", cover: "https://picsum.photos/48?random=1" },
        { id: 2, title: "Moscow In Da Club", artist: "Тимати", duration: "2:05", cover: "https://picsum.photos/48?random=2" },
        { id: 3, title: "Небеса", artist: "Владимир Меладзе", duration: "3:56", cover: "https://picsum.photos/48?random=3" },
        { id: 4, title: "П.М.М.Л", artist: "Земфира", duration: "3:37", cover: "https://picsum.photos/48?random=4" },
        { id: 5, title: "sweater weather", artist: "NovaKing", duration: "3:31", cover: "https://picsum.photos/48?random=5" },
        { id: 6, title: "Меня не будет", artist: "ANIKV, SALUKI", duration: "4:15", cover: "https://picsum.photos/48?random=6" },
        { id: 7, title: "ГИМН КАЧКОВ", artist: "maxxytren, bulk_machine", duration: "2:21", cover: "https://picsum.photos/48?random=7" },
        { id: 8, title: "Душа, кайфуй", artist: "Vuska Zippo", duration: "2:56", cover: "https://picsum.photos/48?random=8" },
        { id: 9, title: "Radio", artist: "Rammstein", duration: "4:37", cover: "https://picsum.photos/48?random=9" },
    ];

    const filteredSongs = songs.filter(
        (song) =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const playerVisible = playingSongId !== null;
    useEffect(() => {
        const setPlayerVars = () => {
            const header = document.querySelector("header");
            if (!header) return;
            const rect = header.getBoundingClientRect();
            document.documentElement.style.setProperty("--player-top", `${Math.floor(rect.bottom)}px`);
            document.documentElement.style.setProperty("--header-height", `${Math.ceil(rect.height)}px`);
            document.documentElement.style.setProperty("--player-height", playerVisible ? "64px" : "0px");
        };
        setPlayerVars();
        window.addEventListener("resize", setPlayerVars);
        const obs = new MutationObserver(setPlayerVars);
        obs.observe(document.body, { childList: true, subtree: true });
        return () => {
            window.removeEventListener("resize", setPlayerVars);
            obs.disconnect();
        };
    }, [playerVisible]);
    const selectOrToggle = (id) => {
        if (playingSongId === id) {
            setIsPlaying((p) => !p);
        } else {
            setPlayingSongId(id);
            setIsPlaying(true);
        }
    };
    const handlePlayToggle = (id) => {
        if (id === null) {
            setIsPlaying((p) => !p);
            return;
        }
        selectOrToggle(id);
    };
    const handlePrev = () => {
        if (!playingSongId) return setPlayingSongId(songs[0].id);
        const idx = songs.findIndex((s) => s.id === playingSongId);
        const prev = idx <= 0 ? songs[songs.length - 1].id : songs[idx - 1].id;
        setPlayingSongId(prev);
        setIsPlaying(true);
    };
    const handleNext = () => {
        if (!playingSongId) return setPlayingSongId(songs[0].id);
        const idx = songs.findIndex((s) => s.id === playingSongId);
        const next = idx >= songs.length - 1 ? songs[0].id : songs[idx + 1].id;
        setPlayingSongId(next);
        setIsPlaying(true);
    };
    return (
        <>
            <div style={{ paddingTop: `calc(var(--player-top, var(--header-height, 64px)) - var(--header-height, 64px) + var(--player-height, 0px))` }}>
                {/* Search Bar */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Поиск музыки"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none"
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
                        />
                    </div>
                </div>
                {/* Song List */}
                <div className="max-w-7xl mx-auto">
                    <div className="rounded-3xl p-6 shadow-lg bg-[#826d9d]/80 backdrop-blur-md">
                        <div className="space-y-1 mx-8">
                            {filteredSongs.map((song) => {
                                const isSongPlaying = playingSongId === song.id && isPlaying;
                                return (
                                    <div key={song.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition cursor-pointer group">
                                        <div className="relative w-12 h-12">
                                            <img
                                                src={song.cover}
                                                alt={`${song.title} cover`}
                                                className="w-12 h-12 rounded-md object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => selectOrToggle(song.id)}
                                                    aria-label={isSongPlaying ? "Pause" : "Play"}
                                                    className="text-white hover:scale-110 transition"
                                                >
                                                    <img
                                                        src={isSongPlaying ? "/pause.svg" : "/play.svg"}
                                                        alt={isSongPlaying ? "Pause" : "Play"}
                                                        width={26}
                                                        height={26}
                                                    />
                                                </button>
                                            </div>
                                            {isSongPlaying && (
                                                <div className="absolute inset-0 flex items-center justify-center group-hover:hidden">
                                                    <Equalizer />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium">{song.title}</h3>
                                            <p className="text-purple-200 text-sm">{song.artist}</p>
                                        </div>
                                        <div className="flex items-center gap-3 relative">
                                            <div className="relative w-12 flex justify-end">
                                                <span className="text-white text-sm group-hover:hidden">{song.duration}</span>
                                                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {playerVisible && <PlayerBar currentSong={songs.find((s) => s.id === playingSongId)} isPlaying={isPlaying} onPlayToggle={handlePlayToggle} onPrev={handlePrev} onNext={handleNext} />}
        </>
    );
}