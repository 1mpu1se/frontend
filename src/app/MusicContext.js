"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { musicApi } from "@/app/api/musicApi";
import authApi from "@/app/api/authApi";

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const audioRef = useRef(null);
    const [songs, setSongs] = useState([]);
    const [currentSongId, setCurrentSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentSong = songs.find(s => s.id === currentSongId) || null;

    const playingSongId = currentSongId;

    // загрузка треков
    const loadSongs = async () => {
        const token = authApi.getToken();
        if (!token) {
            console.log("Токен отсутствует, пропускаем загрузку треков");
            setSongs([]);
            setError(null);
            return;
        }

        setLoading(true);
        try {
            const data = await musicApi.getTracks();
            console.log("Songs from server:", data);

            const songsWithDuration = await Promise.all(
                data.map(song => new Promise(resolve => {
                    const audio = new Audio();
                    audio.src = song.audioUrl;
                    audio.onloadedmetadata = () => {
                        resolve({ ...song, duration: audio.duration });
                    };
                    audio.onerror = () => {
                        resolve({ ...song, duration: 0 });
                    };
                }))
            );

            setSongs(songsWithDuration);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Ошибка загрузки треков");
            setSongs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Загружаем треки при инициализации только если есть токен
        const token = authApi.getToken();
        if (token) {
            loadSongs();
        }

        // Слушаем событие изменения авторизации
        const handleAuthChange = (event) => {
            const user = event.detail;
            if (user) {
                // Пользователь авторизовался - загружаем треки
                loadSongs();
            } else {
                // Пользователь вышел - очищаем треки
                setSongs([]);
                setCurrentSongId(null);
                setIsPlaying(false);
                setCurrentTime(0);
                setError(null);
            }
        };

        window.addEventListener("authChange", handleAuthChange);
        return () => {
            window.removeEventListener("authChange", handleAuthChange);
        };
    }, []);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = 0.8;
        }
    }, []);

    // управление воспроизведением
    useEffect(() => {
        if (!currentSong || !audioRef.current) return;

        const url = currentSong.audioUrl;

        if (audioRef.current.src !== url) {
            audioRef.current.src = url;
            audioRef.current.load();
        }

        const handleTimeUpdate = () => {
            setCurrentTime(audioRef.current.currentTime);
        };

        const handleEnded = () => {
            selectNext();
        };

        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.addEventListener('ended', handleEnded);

        // Управление воспроизведением
        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error("Play error:", e);
                    setIsPlaying(false);
                });
            }
        } else {
            audioRef.current.pause();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                audioRef.current.removeEventListener('ended', handleEnded);
            }
        };
    }, [currentSongId, isPlaying, currentSong]);

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    const selectOrToggle = (id) => {
        if (currentSongId === id) {
            togglePlay();
        } else {
            setCurrentSongId(id);
            setIsPlaying(true);
        }
    };

    const selectNext = () => {
        if (!songs.length) return;
        const idx = songs.findIndex(s => s.id === currentSongId);
        const nextIdx = (idx + 1) % songs.length;
        setCurrentSongId(songs[nextIdx].id);
        setIsPlaying(true);
    };

    const selectPrev = () => {
        if (!songs.length) return;
        const idx = songs.findIndex(s => s.id === currentSongId);
        const prevIdx = (idx - 1 + songs.length) % songs.length;
        setCurrentSongId(songs[prevIdx].id);
        setIsPlaying(true);
    };

    const seekTo = (seconds) => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        const safeNumber = Number(seconds) || 0;

        const bounded = Math.max(0, Math.min(safeNumber, Number(audio.duration) || safeNumber));

        if (audio.readyState < 1) {
            const onMeta = () => {
                try {
                    audio.currentTime = Math.min(bounded, audio.duration || bounded);
                } catch (e) {
                    console.warn("seek after loadedmetadata failed:", e);
                }
                audio.removeEventListener("loadedmetadata", onMeta);
                setCurrentTime(audio.currentTime);
            };
            audio.addEventListener("loadedmetadata", onMeta);
        } else {
            try {
                audio.currentTime = bounded;
            } catch (e) {
                console.warn("seek failed:", e);
            }
            setCurrentTime(bounded);
        }
    };

    const setVolume = (volumePercent) => {
        if (!audioRef.current) return;
        audioRef.current.volume = Math.max(0, Math.min(1, volumePercent / 100));
    };

    const deleteTrack = async (id) => {
        await musicApi.deleteTrack(id);
        setSongs(prev => prev.filter(s => s.id !== id));
        if (currentSongId === id) {
            setCurrentSongId(null);
            setIsPlaying(false);
            setCurrentTime(0);
        }
    };

    return (
        <MusicContext.Provider value={{
            songs,
            loading,
            error,
            currentSong,
            currentTime,
            isPlaying,
            playingSongId,
            togglePlay,
            selectOrToggle,
            selectNext,
            selectPrev,
            seekTo,
            setVolume,
            deleteTrack,
            loadSongs,
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => useContext(MusicContext);