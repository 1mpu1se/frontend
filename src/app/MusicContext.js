"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const MusicContext = createContext();

export function MusicProvider({ children }) {
    const [songs] = useState([
        { id: 1, title: "Я твой номер один", artist: "Дима Билан", duration: "3:09", cover: "https://picsum.photos/48?random=1" },
        { id: 2, title: "Moscow In Da Club", artist: "Тимати", duration: "2:05", cover: "https://picsum.photos/48?random=2" },
        { id: 3, title: "Небеса", artist: "Владимир Меладзе", duration: "3:56", cover: "https://picsum.photos/48?random=3" },
        { id: 4, title: "П.М.М.Л", artist: "Земфира", duration: "3:37", cover: "https://picsum.photos/48?random=4" },
        { id: 5, title: "sweater weather", artist: "NovaKing", duration: "3:31", cover: "https://picsum.photos/48?random=5" },
        { id: 6, title: "Меня не будет", artist: "ANIKV, SALUKI", duration: "4:15", cover: "https://picsum.photos/48?random=6" },
        { id: 7, title: "ГИМН КАЧКОВ", artist: "maxxytren, bulk_machine", duration: "2:21", cover: "https://picsum.photos/48?random=7" },
        { id: 8, title: "Душа, кайфуй", artist: "Vuska Zippo", duration: "2:56", cover: "https://picsum.photos/48?random=8" },
        { id: 9, title: "Radio", artist: "Rammstein", duration: "4:37", cover: "https://picsum.photos/48?random=9" },
    ]);

    const [playingSongId, setPlayingSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const accMsRef = useRef(0);
    const [seekTrigger, setSeekTrigger] = useState(0);

    const currentSong = songs.find(s => s.id === playingSongId);

    // Обновление времени трека
    useEffect(() => {
        if (!playingSongId) return;

        const song = songs.find(s => s.id === playingSongId);
        if (!song) return;

        const [min, sec] = song.duration.split(":").map(Number);
        const totalSeconds = min * 60 + sec;

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
            } else {
                setCurrentTime(seconds);
                accMsRef.current = elapsed;
            }
        }, 100);

        return () => clearInterval(interval);
    }, [playingSongId, isPlaying, songs, seekTrigger]);

    const selectOrToggle = (id) => {
        if (playingSongId === id) {
            setIsPlaying(p => !p);
        } else {
            setPlayingSongId(id);
            setIsPlaying(true);
            setCurrentTime(0);
            accMsRef.current = 0;
        }
    };

    const handlePlayToggle = () => {
        setIsPlaying(p => !p);
    };

    const handlePrev = () => {
        if (!playingSongId) {
            setPlayingSongId(songs[0].id);
            setIsPlaying(true);
            return;
        }
        const idx = songs.findIndex((s) => s.id === playingSongId);
        const prev = idx <= 0 ? songs[songs.length - 1].id : songs[idx - 1].id;
        setPlayingSongId(prev);
        setIsPlaying(true);
        setCurrentTime(0);
        accMsRef.current = 0;
    };

    const handleNext = () => {
        if (!playingSongId) {
            setPlayingSongId(songs[0].id);
            setIsPlaying(true);
            return;
        }
        const idx = songs.findIndex((s) => s.id === playingSongId);
        const next = idx >= songs.length - 1 ? songs[0].id : songs[idx + 1].id;
        setPlayingSongId(next);
        setIsPlaying(true);
        setCurrentTime(0);
        accMsRef.current = 0;
    };

    // Функция для обновления времени при перематывании
    const seekTo = (milliseconds) => {
        accMsRef.current = milliseconds;
        setCurrentTime(Math.floor(milliseconds / 1000));
        setSeekTrigger(prev => prev + 1);
    };

    const value = {
        songs,
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