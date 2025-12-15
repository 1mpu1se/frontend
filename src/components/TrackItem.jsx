"use client";

import { useState, useEffect } from "react";
import Equalizer from "@/components/Equalizer";
import TrackMenu from "@/components/TrackMenu";
import { useMusic } from "@/app/MusicContext";
import { formatSeconds } from '@/app/utils/time';
import { useUser } from "@/app/UserContext";

export default function TrackItem({ song, onDelete, hideCover = false, albumArtist = null, index = 0 }) {
    const { playingSongId, isPlaying, currentTime, selectOrToggle } = useMusic();
    const [mounted, setMounted] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = playingSongId === song.id;
    const isSongPlaying = isActive && isPlaying;

    const shouldShowArtist = (() => {
        if (!albumArtist) return true;
        const baseAlbumArtist = albumArtist;
        const mainName = song.rawArtistName || song.artist || "";
        return mainName.trim() !== baseAlbumArtist.trim();
    })();

    return (
        <div
            className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition group ${isActive ? "bg-white/20" : ""}`}
        >
            {!hideCover && (
                <div
                    className="relative w-12 h-12 cursor-pointer flex-shrink-0"
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
                                src={isSongPlaying ? "/music/pause.svg" : "/music/play.svg"}
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
            )}

            {hideCover && (
                <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                    <button
                        onClick={() => selectOrToggle(song.id)}
                        className="relative w-10 h-10 flex items-center justify-center rounded-md focus:outline-none"
                    >
                        <span className={`text-white text-base md:text-lg font-semibold transition
                            ${isSongPlaying ? "opacity-0" : "opacity-100 group-hover:opacity-0"}`}>
                            {index + 1}
                        </span>

                        <img
                            src={isSongPlaying ? "/music/pause.svg" : "/music/play.svg"}
                            alt={isSongPlaying ? "Pause" : "Play"}
                            width={26}
                            height={26}
                            className={`absolute transition-all
                                ${isSongPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                                `}
                        />
                    </button>

                    {isSongPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:hidden">
                            <Equalizer />
                        </div>
                    )}
                </div>
            )}

            <div
                className="flex-1 cursor-pointer min-w-0"
                onClick={() => selectOrToggle(song.id)}
            >
                <h3 className="text-white font-medium truncate text-lg">{song.title}</h3>
                {shouldShowArtist && (
                    <p className="text-purple-200 text-sm truncate">{song.artist}</p>
                )}
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
                                onDelete={onDelete}
                                onAbout={(s) => {
                                    alert(`${s.title} – ${s.artist}\nДлительность: ${formatSeconds(s.duration)}`);
                                }}
                                isAdmin={user?.is_admin === true}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
