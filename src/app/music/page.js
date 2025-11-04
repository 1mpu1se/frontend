"use client";
import React, { useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import Equalizer from "@/app/components/Equalizer";
import { useMusic } from "@/app/MusicContext";
import { parseDuration, formatTime } from '@/app/utils/time';

export default function MusicPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { songs, playingSongId, isPlaying, currentTime, selectOrToggle } = useMusic();

    const filteredSongs = songs.filter(
        (song) =>
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-8 mt-10">
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
                            const isActive = playingSongId === song.id;

                            return (
                                <div
                                    key={song.id}
                                    className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition cursor-pointer group ${isActive ? "bg-white/10" : ""}`}
                                >
                                    <div className="relative w-12 h-12">
                                        <img
                                            src={song.cover}
                                            alt={`${song.title} cover`}
                                            className="w-12 h-12 rounded-md object-cover"
                                        />
                                        <div className={`absolute inset-0 rounded-md transition-opacity 
                                              ${isActive ? "bg-black/50" : ""} 
                                              ${!isActive ? "group-hover:bg-black/50 opacity-0 group-hover:opacity-100" : ""}`}>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <button
                                                onClick={() => selectOrToggle(song.id)}
                                                aria-label={isSongPlaying ? "Pause" : "Play"}
                                                className="pointer-events-auto text-white transition transform hover:scale-110 opacity-0 group-hover:opacity-100"
                                            >
                                                <img
                                                    src={isSongPlaying ? "music/pause.svg" : "music/play.svg"}
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
                                            {isActive ? (
                                                <span className="text-white text-sm">{formatTime(currentTime)}</span>
                                            ) : (
                                                <>
                                                    <span className="text-white text-sm">{formatTime(parseDuration(song.duration))}</span>
                                                    <button className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition">
                                                        <MoreHorizontal size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}