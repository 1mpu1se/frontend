"use client";

import React, { useEffect, useRef, useState } from "react";
import { Slider } from "@mui/material";
import { useMusic } from "@/app/MusicContext";
import { formatSeconds } from '@/app/utils/time';
import "@/components/PlayerBar.css";

export default function PlayerBar({ currentSong, isPlaying, onTogglePlay, onPrev, onNext }) {
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(80);
    const prevVolumeRef = useRef(80);

    const { seekTo, setVolume: setAudioVolume, currentTime } = useMusic();

    const [repeatState, setRepeatState] = useState(0);
    const [shuffleActive, setShuffleActive] = useState(false);

    const isUserSeekingRef = useRef(false);
    const seekingValueRef = useRef(0);

    useEffect(() => {
        setAudioVolume?.(volume);
    }, [volume, setAudioVolume]);

    const toggleMute = () => {
        if (volume > 0) {
            prevVolumeRef.current = volume;
            setVolume(0);
        } else {
            setVolume(prevVolumeRef.current || 80);
        }
    };

    useEffect(() => {
        if (!currentSong) {
            setProgress(0);
            return;
        }
        const duration = currentSong.duration || 0;
        if (duration <= 0) return;

        if (isUserSeekingRef.current) {
            const target = seekingValueRef.current;
            if (typeof target === "number" && Math.abs(currentTime - target) < 0.6) {
                isUserSeekingRef.current = false;
                seekingValueRef.current = 0;
                const pct = (currentTime / duration) * 100;
                setProgress(pct);
            }
        } else {
            const pct = (currentTime / duration) * 100;
            setProgress(pct);
        }
    }, [currentTime, currentSong?.id, currentSong?.duration]);

    const handleSeekStart = () => {
        isUserSeekingRef.current = true;
    };

    const handleSeekChange = (_, value) => {
        const val = Number(value);
        setProgress(val);
        seekingValueRef.current = val;
    };

    const handleSeekEnd = (_, value) => {
        if (!currentSong) {
            isUserSeekingRef.current = false;
            return;
        }
        const duration = currentSong.duration || 0;
        const newTime = (Number(value) / 100) * duration;

        seekingValueRef.current = newTime;

        seekTo(newTime);

        setTimeout(() => {
            if (isUserSeekingRef.current) isUserSeekingRef.current = false;
        }, 1500);
    };

    const formatCurrent = () => formatSeconds(currentTime);
    const formatTotal = () => currentSong ? formatSeconds(currentSong.duration) : "0:00";

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

                            <button onClick={onTogglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="icon-btn play-btn">
                                <img src={isPlaying ? "/music/pause.svg" : "/music/play.svg"} alt="Play/Pause" width={32} height={32} />
                            </button>

                            <button onClick={onNext} aria-label="Next" className="icon-btn">
                                <img src="/music/skip-forward.svg" alt="Next" width={22} height={22} />
                            </button>
                        </div>

                        <div className="extras">
                            <button onClick={() => setRepeatState((s) => (s + 1) % 3)} className="icon-btn">
                                <img src={repeatState === 2 ? "/music/repeat-one.svg" : repeatState === 1 ? "/music/repeat-on.svg" : "/music/repeat-off.svg"} width={22} height={22} />
                            </button>
                            <button onClick={() => setShuffleActive(s => !s)} className="icon-btn">
                                <img src={shuffleActive ? "/music/shuffle-on.svg" : "/music/shuffle-off.svg"} width={23} height={23} />
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
                                onMouseDown={handleSeekStart}
                                onTouchStart={handleSeekStart}
                                onChange={handleSeekChange}
                                onChangeCommitted={handleSeekEnd}
                                min={0}
                                max={100}
                                step={0.1}
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
                        <button onClick={toggleMute} className="icon-btn" style={{ marginRight: 8 }}>
                            <img src={(volume === 0) ? "/music/volume-mute.svg" : "/music/volume.svg"} width={18} height={18} />
                        </button>

                        <Slider
                            value={volume}
                            onChange={(_, v) => setVolume(Number(v))}
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