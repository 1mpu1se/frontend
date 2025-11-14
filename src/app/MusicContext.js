"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

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
        { id: 10, title: "Отпусти меня", artist: "SEREBRO", duration: "3:53", cover: "https://picsum.photos/48?random=10" },
        { id: 11, title: "Stress", artist: "NEWLIGHTCHILD feat. DONOR", duration: "1:53", cover: "https://picsum.photos/48?random=11" },
        { id: 12, title: "TRAPCITYLIFE", artist: "Миллион О'Войд", duration: "2:03", cover: "https://picsum.photos/48?random=12" },
        { id: 13, title: "liga la sosa", artist: "Платина", duration: "1:59", cover: "https://picsum.photos/48?random=13" },
        { id: 14, title: "Бэйбитрон", artist: "OG BUDA", duration: "2:41", cover: "https://picsum.photos/48?random=14" },
    ]);

    const [playingSongId, setPlayingSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const accMsRef = useRef(0);
    const [seekTrigger, setSeekTrigger] = useState(0);

    const endedRef = useRef(false);
    const currentSong = songs.find(s => s.id === playingSongId);

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