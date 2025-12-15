"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Equalizer from "@/components/Equalizer";
import TrackMenu from "@/components/TrackMenu";
import { useMusic } from "@/app/MusicContext";
import { formatSeconds } from '@/app/utils/time';
import { useUser } from "@/app/UserContext";
import SearchBar from "@/components/SearchBar";

export default function MusicPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { songs, loading, error, playingSongId, isPlaying, currentTime, selectOrToggle } = useMusic();
    const [mounted, setMounted] = useState(false);

    const { user } = useUser();

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredSongs = songs.filter(
        (song) =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (song) => {
        if (confirm(`Удалить трек "${song.title}"?`)) {
            try {
                await deleteTrack(song.id);
            } catch (err) {
                alert('Не удалось удалить трек');
            }
        }
    };

    return (
        <div>
            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Поиск музыки"
            />

            {/* Song List */}
            <div className="max-w-7xl mx-auto">
                <div className="rounded-3xl p-6 shadow-lg bg-[#826d9d]/80 backdrop-blur-md">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-white" size={32} />
                            <span className="ml-3 text-white">Загрузка треков...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-300 mb-4">Ошибка загрузки: {error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
                            >
                                Повторить
                            </button>
                        </div>
                    ) : filteredSongs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-white/70">
                                {searchQuery ? 'Ничего не найдено' : 'Нет треков'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1 mx-8">
                            {filteredSongs.map((song) => {
                                // ИСПРАВЛЕНО: проверяем активный трек и статус воспроизведения отдельно
                                const isActive = playingSongId === song.id;
                                const isSongPlaying = isActive && isPlaying;

                                return (
                                    <div
                                        key={song.id}
                                        className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition group ${isActive ? "bg-white/20" : ""}`}
                                    >
                                        <div
                                            className="relative w-12 h-12 cursor-pointer"
                                            onClick={() => selectOrToggle(song.id)}
                                        >
                                            <img
                                                src={song.cover}
                                                alt={`${song.title} cover`}
                                                className="w-12 h-12 rounded-md object-cover"
                                            />
                                            <div className={`absolute inset-0 rounded-md transition-opacity 
                                                  ${isActive ? "bg-black/50" : ""} 
                                                  ${!isActive ? "group-hover:bg-black/30 opacity-0 group-hover:opacity-100" : ""}`}>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="pointer-events-auto text-white transition transform hover:scale-110 opacity-0 group-hover:opacity-100">
                                                    <img
                                                        src={isSongPlaying ? "music/pause.svg" : "music/play.svg"}
                                                        alt={isSongPlaying ? "Pause" : "Play"}
                                                        width={26}
                                                        height={26}
                                                    />
                                                </div>
                                            </div>
                                            {isSongPlaying && (
                                                <div className="absolute inset-0 flex items-center justify-center group-hover:hidden">
                                                    <Equalizer />
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => selectOrToggle(song.id)}
                                        >
                                            <h3 className="text-white font-medium">{song.title}</h3>
                                            <p className="text-purple-200 text-sm">{song.artist}</p>
                                        </div>
                                        <div className="flex items-center gap-3 relative">
                                            <div className="relative w-12 flex justify-end">
                                                <span className="text-white text-sm group-hover:opacity-0 transition-opacity">
                                                    {isActive ? formatSeconds(currentTime) : formatSeconds(song.duration)}
                                                </span>
                                                <div
                                                    key={mounted ? "client" : "server"}
                                                    suppressHydrationWarning={true}
                                                    className="absolute right-0 top-1/2 transform -translate-y-1/2
                                                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                                    pointer-events-none group-hover:pointer-events-auto"
                                                >
                                                    {mounted && (
                                                        <TrackMenu
                                                            song={song}
                                                            onAddToPlaylist={(s) => {
                                                                console.log("Add to playlist", s);
                                                            }}
                                                            onDelete={handleDelete}
                                                            onAbout={(s) => {
                                                                alert(`${s.title} — ${s.artist}\nДлительность: ${formatSeconds(s.duration)}`);
                                                            }}
                                                            isAdmin={user?.is_admin === true}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}