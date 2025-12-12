"use client";

import React, { useEffect, useRef, useState } from "react";
import { Slider } from "@mui/material";
import { useMusic } from "@/app/MusicContext";
import { formatSeconds } from '@/app/utils/time';
import "@/app/components/PlayerBar.css";

export default function PlayerBar({ currentSong, isPlaying, onTogglePlay, onPrev, onNext }) {
    const [progress, setProgress] = useState(0);
    const [volume, setVolumeState] = useState(80);
    const prevVolumeRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);

    const { seekTo, setVolume: setAudioVolume, currentTime } = useMusic();

    const [repeatState, setRepeatState] = useState(0);
    const [shuffleActive, setShuffleActive] = useState(false);

    const toggleRepeat = () => {
        setRepeatState((prev) => (prev + 1) % 3);
    };

    const toggleShuffle = () => {
        setShuffleActive((prev) => !prev);
    };

    useEffect(() => {
        if (setAudioVolume) {
            setAudioVolume(volume);
        }
    }, [volume, setAudioVolume]);

    useEffect(() => {
        if (!currentSong || isSeeking) return;

        const totalSec = currentSong.duration || 0;
        if (totalSec <= 0) return;

        const pct = (currentTime / totalSec) * 100;

        // Обновляем прогресс только если разница значительная
        // Это предотвращает "прыгание" ползунка назад
        setProgress(pct);
    }, [currentTime, currentSong?.id, isSeeking]);

    const formatTotal = () => {
        if (!currentSong) return "0:00";
        return formatSeconds(currentSong.duration);
    };

    const repeatIcons = {
        off: 'music/repeat-off.svg',
        playlist: 'music/repeat-on.svg',
        track: 'music/repeat-one.svg',
    };

    const shuffleIcons = {
        off: 'music/shuffle-off.svg',
        on: 'music/shuffle-on.svg',
    };

    const toggleMute = () => {
        if (!isMuted && volume > 0) {
            prevVolumeRef.current = volume;
            setVolumeState(0);
            setIsMuted(true);
        } else {
            const restore = prevVolumeRef.current ?? 80;
            setVolumeState(restore);
            setIsMuted(false);
            prevVolumeRef.current = null;
        }
    };

    // ИСПРАВЛЕНО: Обработка перемотки
    const handleSeekChange = (_, val) => {
        setIsSeeking(true);
        setProgress(Number(val));
    };

    const handleSeekCommit = (_, val) => {
        if (!currentSong) return;

        const totalSec = currentSong.duration || 0;
        const newSec = (val / 100) * totalSec;

        setProgress(val);
        expectedTimeRef.current = newSec;

        seekTo(newSec);
    };

    const handleVolumeChange = (_, val) => {
        const v = Number(val);
        setVolumeState(v);
        if (v === 0) {
            setIsMuted(true);
        } else {
            setIsMuted(false);
            prevVolumeRef.current = null;
        }
    };

    return (
        <div className="player-bar">
            <div className="player-bg">
                <div className="player-inner">
                    {/* Left controls */}
                    <div className="player-controls">
                        <div className="transport">
                            <button onClick={onPrev} aria-label="Previous" className="icon-btn">
                                <img src="/music/skip-back.svg" alt="Previous" width={22} height={22} />
                            </button>

                            <button
                                onClick={onTogglePlay}
                                aria-label={isPlaying ? "Pause" : "Play"}
                                className="icon-btn play-btn"
                            >
                                <img
                                    src={isPlaying ? "music/pause.svg" : "music/play.svg"}
                                    alt={isPlaying ? "Pause" : "Play"}
                                    width={32}
                                    height={32}
                                />
                            </button>

                            <button onClick={onNext} aria-label="Next" className="icon-btn">
                                <img src="/music/skip-forward.svg" alt="Next" width={22} height={22} />
                            </button>
                        </div>

                        <div className="extras">
                            <button onClick={toggleRepeat} aria-label="Repeat" className="icon-btn">
                                <img
                                    src={repeatIcons[ repeatState === 2 ? 'track' : repeatState === 1 ? 'playlist' : 'off' ]}
                                    alt="Repeat"
                                    width={22}
                                    height={22}
                                />
                            </button>

                            <button onClick={toggleShuffle} aria-label="Shuffle" className="icon-btn">
                                <img
                                    src={shuffleIcons[shuffleActive ? 'on' : 'off']}
                                    alt="Shuffle"
                                    width={23}
                                    height={23}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Center section */}
                    <div className="player-center">
                        <div className="song-info">
                            <div
                                className="song-cover"
                                style={{
                                    background: currentSong?.cover
                                        ? `url(${currentSong.cover}) center/cover`
                                        : "rgba(255,255,255,0.1)",
                                }}
                            />
                            <div>
                                <div className="song-title">{currentSong ? currentSong.title : "Не выбрана песня"}</div>
                                <div className="song-artist">{currentSong ? currentSong.artist : ""}</div>
                            </div>
                        </div>

                        <div className="progress-wrapper">
                            <Slider
                                value={progress}
                                onChange={handleSeekChange}
                                onChangeCommitted={handleSeekCommit}
                                min={0}
                                max={100}
                                disabled={!currentSong}
                                aria-label="Track progress"
                                className="track-slider"
                            />
                            <div className="time-text">
                                {currentSong
                                    ? `${formatCurrent()} / ${formatTotal()}`
                                    : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="player-volume">
                        <button
                            onClick={toggleMute}
                            aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                            className="icon-btn"
                            style={{ marginRight: 8 }}
                        >
                            <img
                                src={ (isMuted || volume === 0) ? "/music/volume-mute.svg" : "/music/volume.svg" }
                                alt={ (isMuted || volume === 0) ? "Muted" : "Volume" }
                                width={18}
                                height={18}
                            />
                        </button>

                        <Slider
                            value={volume}
                            onChange={handleVolumeChange}
                            min={0}
                            max={100}
                            aria-label="Volume"
                            className="volume-slider"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}