"use client";
import React, { useEffect, useRef, useState } from "react";
import { Slider } from "@mui/material";
import { useMusic } from "@/app/MusicContext";
import "@/app/components/PlayerBar.css";

export default function PlayerBar({ currentSong, isPlaying, onPlayToggle, onPrev, onNext }) {
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(80);
    const accMsRef = useRef(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const { seekTo } = useMusic();

    const [repeatState, setRepeatState] = useState(0);
    const [shuffleActive, setShuffleActive] = useState(false);

    const toggleRepeat = () => {
        setRepeatState((prev) => (prev + 1) % 3);
    };

    const toggleShuffle = () => {
        setShuffleActive((prev) => !prev);
    };

    useEffect(() => {
        accMsRef.current = 0;
        setProgress(0);
    }, [currentSong?.id]);

    useEffect(() => {
        if (!currentSong) return;
        const totalMs = parseDuration(currentSong.duration) * 1000;
        let intervalId = null;
        if (isPlaying) {
            const startTime = Date.now() - accMsRef.current;
            intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const pct = Math.min((elapsed / totalMs) * 100, 100);
                if (!isSeeking) setProgress(pct);
                if (pct >= 100) {
                    accMsRef.current = totalMs;
                    clearInterval(intervalId);
                }
            }, 100);
        }
        return () => intervalId && clearInterval(intervalId);
    }, [isPlaying, currentSong?.id, isSeeking]);

    const formatCurrent = (durationStr) => {
        const total = parseDuration(durationStr);
        const curSec = Math.min(Math.floor((progress / 100) * total), total);
        const m = Math.floor(curSec / 60);
        const s = curSec % 60;
        return `${m}:${twoDigits(s)}`;
    };

    const formatTotal = (durationStr) => {
        const total = parseDuration(durationStr);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${twoDigits(s)}`;
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
                                onClick={() => onPlayToggle(null)}
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
                                onChange={(_, val) => {
                                    setIsSeeking(true);
                                    setProgress(Number(val));
                                }}
                                onChangeCommitted={(_, val) => {
                                    if (!currentSong) return setIsSeeking(false);
                                    const totalMs = parseDuration(currentSong.duration) * 1000;
                                    const newMs = (val / 100) * totalMs;
                                    accMsRef.current = newMs;
                                    seekTo(newMs);
                                    setIsSeeking(false);
                                }}
                                min={0}
                                max={100}
                                disabled={!currentSong}
                                aria-label="Track progress"
                                className="track-slider"
                            />
                            <div className="time-text">
                                {currentSong
                                    ? `${formatCurrent(currentSong.duration)} / ${formatTotal(currentSong.duration)}`
                                    : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="player-volume">
                        <img src="/music/volume.svg" alt="Volume" width={18} height={18} />
                        <Slider
                            value={volume}
                            onChange={(_, val) => setVolume(Number(val))}
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

function parseDuration(str) {
    if (!str) return 0;
    const [min, sec] = String(str).split(":").map(Number);
    return (min || 0) * 60 + (sec || 0);
}
function twoDigits(n) {
    return n.toString().padStart(2, "0");
}