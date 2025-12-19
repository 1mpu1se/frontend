"use client";
import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { musicApi } from "@/app/api/musicApi";
import authApi from "@/app/api/authApi";
import {useUser} from "@/app/UserContext";

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const audioRef = useRef(null);
    const [songs, setSongs] = useState([]);
    const [currentSongId, setCurrentSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Новые состояния для повторения и перемешивания
    const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
    const [shuffleMode, setShuffleMode] = useState(false);
    const [originalPlaylist, setOriginalPlaylist] = useState([]); // Для shuffle

    const currentSong = songs.find(s => s.id === currentSongId) || null;
    const playingSongId = currentSongId;
    const { checked } = useUser();

    useEffect(() => {
        if (!checked) return;
        loadSongs();
    }, [checked]);

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
                (data || []).map(song => new Promise(resolve => {
                    if (!song.audioUrl) return resolve({ ...song, duration: 0 });

                    const audio = new Audio();
                    audio.src = song.audioUrl;
                    audio.onloadedmetadata = () => {
                        resolve({ ...song, duration: audio.duration });
                    };
                    audio.onerror = () => {
                        resolve({ ...song, duration: 0 });
                    };
                    setTimeout(() => resolve({ ...song, duration: 0 }), 5000);
                }))
            );

            setSongs(songsWithDuration);
            setError(null);
        } catch (err) {
            const isNoToken =
                err &&
                (err.code === "NO_TOKEN" ||
                    err.status === 401 ||
                    err.status === 403 ||
                    (err.data && (err.data.detail === "Unauthorized" || err.data.message === "Unauthorized")));

            if (isNoToken) {
                try { authApi.clearToken(); authApi.clearUser(); } catch (e) {}
                setSongs([]);
                setError(null);
                setLoading(false);
                return;
            }
            console.error("Ошибка загрузки треков:", err.message || err);
            setError(err.message || "Ошибка загрузки треков");
            setSongs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = authApi.getToken();
        if (token) {
            loadSongs();
        }

        const handleAuthChange = (event) => {
            const user = event.detail;
            if (user) {
                loadSongs();
            } else {
                setSongs([]);
                setCurrentSongId(null);
                setIsPlaying(false);
                setCurrentTime(0);
                setError(null);
                setOriginalPlaylist([]);
                setShuffleMode(false);
                setRepeatMode(0);
                // Останавливаем воспроизведение при выходе
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                }
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
            if (repeatMode === 2) {
                // Repeat one - повторить текущий трек
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            } else {
                // Переход к следующему треку
                selectNext();
            }
        };

        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.addEventListener('ended', handleEnded);

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
    }, [currentSongId, isPlaying, currentSong, repeatMode]);

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

    const selectOrTogglePlaylist = (playlist, idx) => {
        const selectedSong = playlist[idx];

        if (shuffleMode) {
            // Сохраняем оригинальный плейлист
            setOriginalPlaylist([...playlist]);

            // Создаем перемешанную копию
            const shuffled = [...playlist];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Убедимся что выбранный трек первый
            const selectedIdx = shuffled.findIndex(s => s.id === selectedSong.id);
            if (selectedIdx > 0) {
                [shuffled[0], shuffled[selectedIdx]] = [shuffled[selectedIdx], shuffled[0]];
            }

            setSongs(shuffled);
            setCurrentSongId(selectedSong.id);
        } else {
            // Обычный режим - очищаем originalPlaylist если он был
            if (originalPlaylist.length > 0) {
                setOriginalPlaylist([]);
            }
            setSongs([...playlist]);
            setCurrentSongId(selectedSong.id);
        }
        setIsPlaying(true);
    };

    const selectNext = () => {
        if (!songs.length) return;

        // Отключаем режим повторения одного трека при ручном переключении
        if (repeatMode === 2) {
            setRepeatMode(0);
        }

        const idx = songs.findIndex(s => s.id === currentSongId);

        if (repeatMode === 1) {
            // Repeat all - переход к следующему или к началу
            const nextIdx = (idx + 1) % songs.length;
            setCurrentSongId(songs[nextIdx].id);
            setIsPlaying(true);
        } else if (idx < songs.length - 1) {
            // Обычный режим - переход к следующему если не последний
            setCurrentSongId(songs[idx + 1].id);
            setIsPlaying(true);
        } else {
            // Последний трек и repeat off - остановка
            setIsPlaying(false);
        }
    };

    const selectPrev = () => {
        if (!songs.length) return;

        // Отключаем режим повторения одного трека при ручном переключении
        if (repeatMode === 2) {
            setRepeatMode(0);
        }

        const idx = songs.findIndex(s => s.id === currentSongId);
        const prevIdx = (idx - 1 + songs.length) % songs.length;
        setCurrentSongId(songs[prevIdx].id);
        setIsPlaying(true);
    };

    const toggleRepeat = () => {
        setRepeatMode(prev => (prev + 1) % 3);
    };

    const toggleShuffle = () => {
        setShuffleMode(prev => {
            if (!prev) {
                // Включаем shuffle - перемешиваем текущий плейлист
                if (songs.length > 0) {
                    setOriginalPlaylist([...songs]);

                    const currentIdx = songs.findIndex(s => s.id === currentSongId);
                    const currentSongData = currentIdx >= 0 ? songs[currentIdx] : null;

                    // Создаем перемешанную копию
                    const shuffled = [...songs];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }

                    // Если есть текущий трек, ставим его первым
                    if (currentSongData) {
                        const shuffledIdx = shuffled.findIndex(s => s.id === currentSongData.id);
                        if (shuffledIdx > 0) {
                            [shuffled[0], shuffled[shuffledIdx]] = [shuffled[shuffledIdx], shuffled[0]];
                        }
                    }

                    setSongs(shuffled);
                }
                return true;
            } else {
                // Выключаем shuffle - восстанавливаем оригинальный плейлист
                if (originalPlaylist.length > 0) {
                    setSongs([...originalPlaylist]);
                    setOriginalPlaylist([]);
                }
                return false;
            }
        });
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

    const stopPlayback = () => {
        setIsPlaying(false);
        setCurrentSongId(null);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
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
            repeatMode,
            shuffleMode,
            togglePlay,
            selectOrToggle,
            selectOrTogglePlaylist,
            selectNext,
            selectPrev,
            toggleRepeat,
            toggleShuffle,
            seekTo,
            setVolume,
            deleteTrack,
            loadSongs,
            stopPlayback,
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => useContext(MusicContext);