"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { musicApi } from "@/app/api";

const MusicContext = createContext();

export function MusicProvider({ children }) {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [playingSongId, setPlayingSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const accMsRef = useRef(0);
    const [seekTrigger, setSeekTrigger] = useState(0);

    const endedRef = useRef(false);
    const currentSong = songs.find(s => s.id === playingSongId);

    useEffect(() => {
        loadTracks();
    }, []);

    const loadTracks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await musicApi.getTracks();
            setSongs(response.data || []);
        } catch (err) {
            console.error('Failed to load tracks:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const playSongByIndex = useCallback((index) => {
        if (!songs || songs.length === 0) return;
        const normalized = ((index % songs.length) + songs.length) % songs.length;
        const song = songs[normalized];
        if (!song) return;

        setPlayingSongId(song.id);
        setIsPlaying(true);
        setCurrentTime(0);
        accMsRef.current = 0;
        endedRef.current = false;
    }, [songs]);

    const navigate = useCallback((offset) => {
        if (!songs || songs.length === 0) return;

        const currentIdx = songs.findIndex(s => s.id === playingSongId);
        const base = currentIdx === -1 ? (offset > 0 ? 0 : songs.length - 1) : currentIdx;
        const nextIdx = base + offset;
        playSongByIndex(nextIdx);
    }, [songs, playingSongId, playSongByIndex]);

    const handlePrev = useCallback(() => navigate(-1), [navigate]);
    const handleNext = useCallback(() => navigate(1), [navigate]);

    // Обновление времени трека и автоматический переход на следующий
    useEffect(() => {
        endedRef.current = false;
        if (!playingSongId) return;

        const song = songs.find(s => s.id === playingSongId);
        if (!song) return;

        const [min = 0, sec = 0] = song.duration.split(":").map(Number);
        const totalSeconds = (min || 0) * 60 + (sec || 0);

        if (!isPlaying) {
            setCurrentTime(Math.floor(accMsRef.current / 1000));
            return;
        }

        const startTime = Date.now() - accMsRef.current;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const seconds = Math.floor(elapsed / 1000);

            if (seconds >= totalSeconds) {
                setCurrentTime(totalSeconds);
                accMsRef.current = totalSeconds * 1000;
                clearInterval(interval);

                if (!endedRef.current) {
                    endedRef.current = true;
                    setTimeout(() => {
                        handleNext();
                    }, 50);
                }
            } else {
                setCurrentTime(seconds);
                accMsRef.current = elapsed;
            }
        }, 100);

        return () => clearInterval(interval);
    }, [playingSongId, isPlaying, songs, seekTrigger, handleNext]);

    const selectOrToggle = (id) => {
        if (playingSongId === id) {
            setIsPlaying(p => !p);
        } else {
            const idx = songs.findIndex(s => s.id === id);
            playSongByIndex(idx === -1 ? 0 : idx);
        }
    };

    const handlePlayToggle = () => {
        setIsPlaying(p => !p);
    };

    const seekTo = (milliseconds) => {
        accMsRef.current = milliseconds;
        setCurrentTime(Math.floor(milliseconds / 1000));
        setSeekTrigger(prev => prev + 1);
    };

    // Методы для работы с треками через API
    const deleteTrack = async (id) => {
        try {
            await musicApi.deleteTrack(id);
            setSongs(prev => prev.filter(s => s.id !== id));

            if (playingSongId === id) {
                setPlayingSongId(null);
                setIsPlaying(false);
                setCurrentTime(0);
            }
        } catch (err) {
            console.error('Failed to delete track:', err);
            throw err;
        }
    };

    const searchTracks = async (query) => {
        try {
            setLoading(true);
            const response = await musicApi.searchTracks(query);
            return response.data || [];
        } catch (err) {
            console.error('Failed to search tracks:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        songs,
        loading,
        error,
        playingSongId,
        isPlaying,
        currentTime,
        currentSong,
        accMsRef,
        selectOrToggle,
        handlePlayToggle,
        handlePrev,
        handleNext,
        setCurrentTime,
        seekTo,
        loadTracks,
        deleteTrack,
        searchTracks,
    };

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
}

export function useMusic() {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error("useMusic must be used within MusicProvider");
    }
    return context;
}