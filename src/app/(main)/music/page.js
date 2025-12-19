"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import TrackItem from "@/components/TrackItem";
import { useMusic } from "@/app/MusicContext";
import { useUser } from "@/app/UserContext";
import SearchBar from "@/components/SearchBar";

export default function MusicPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { songs, loading, error, deleteTrack } = useMusic();
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
                            {filteredSongs.map((song, index) => (
                                <TrackItem
                                    key={song.id}
                                    song={song}
                                    playlist={filteredSongs}
                                    currentIndex={index}
                                    index={index}
                                    onDelete={handleDelete}
                                    hideCover={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}