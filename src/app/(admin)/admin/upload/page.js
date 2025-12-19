"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/app/UserContext";
import authApi from "@/app/api/authApi";
import { musicApi } from "@/app/api/musicApi";
import { BACKEND_URL } from "@/config/api";
import { Music, Image as ImageIcon, Check, X, Loader2 } from "lucide-react";

function humanFileSize(bytes) {
    if (!bytes) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + ["B", "KB", "MB", "GB"][i];
}

export default function UploadPage() {
    const { user, hydrated, refreshUser } = useUser();
    const [forbidden, setForbidden] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [audioAsset, setAudioAsset] = useState(null);
    const [audioUploadProgress, setAudioUploadProgress] = useState(0);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverAsset, setCoverAsset] = useState(null);
    const [coverUploadProgress, setCoverUploadProgress] = useState(0);
    const [trackName, setTrackName] = useState("");
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);
    const [creatingAlbum, setCreatingAlbum] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState("");
    const [newAlbumArtistId, setNewAlbumArtistId] = useState(null);
    const [createAlbumLoading, setCreateAlbumLoading] = useState(false);
    const [creatingSong, setCreatingSong] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [albumDropdownOpen, setAlbumDropdownOpen] = useState(false);
    const [albumSearch, setAlbumSearch] = useState("");
    const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
    const [artistSearch, setArtistSearch] = useState("");

    const dropRef = useRef();
    const albumDropdownRef = useRef(null);
    const artistDropdownRef = useRef(null);

    useEffect(() => {
        if (!hydrated) return;
        if (!user) {
            setForbidden(true);
            return;
        }
        if (!user.is_admin) {
            setForbidden(true);
            return;
        }
        setForbidden(false);
        (async () => {
            try {
                const idx = await musicApi.getIndex();
                setAlbums(idx?.albums ?? []);
            } catch (e) {
                console.warn("Не удалось получить альбомы:", e);
                setAlbums([]);
            }

            try {
                const res = await musicApi.adminGetArtists(1);
                const items = res?.items ?? res?.artists ?? res;
                setArtists(Array.isArray(items) ? items : []);
            } catch (e) {
                console.warn("Не удалось получить исполнителей:", e);
                setArtists([]);
            }
        })();
    }, [hydrated, user]);

    useEffect(() => {
        return () => {
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [audioPreviewUrl]);

    useEffect(() => {
        function onOutside(e) {
            if (albumDropdownRef.current && !albumDropdownRef.current.contains(e.target)) {
                setAlbumDropdownOpen(false);
            }
            if (artistDropdownRef.current && !artistDropdownRef.current.contains(e.target)) {
                setArtistDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, []);

    const handleAudioSelect = async (file) => {
        setError(null);
        setSuccessMsg(null);

        if (!file.name.toLowerCase().endsWith(".mp3") || file.type !== "audio/mpeg") {
            setError("Допустим только формат MP3");
            return;
        }
        setAudioFile(file);
        setAudioAsset(null);
        setAudioUploadProgress(0);

        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        const url = URL.createObjectURL(file);
        setAudioPreviewUrl(url);

        try {
            const asset = await musicApi.uploadAssetWithProgress(
                file,
                setAudioUploadProgress,
                "audio/mpeg"
            );
            if (!asset || !asset.asset_id) throw new Error("Сервер не вернул asset_id");
            setAudioAsset(asset);
            setSuccessMsg("Аудиофайл успешно загружен");
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки аудио: " + (err.message || err));
            setAudioFile(null);
            setAudioPreviewUrl(null);
        }
    };

    const handleCoverSelect = async (file) => {
        setError(null);
        setSuccessMsg(null);
        if (!file.name.toLowerCase().endsWith(".png") || file.type !== "image/png") {
            setError("Допустим только формат PNG");
            return;
        }
        setCoverFile(file);
        setCoverUploadProgress(0);
        setCoverAsset(null);

        try {
            const asset = await musicApi.uploadAssetWithProgress(
                file,
                setCoverUploadProgress,
                "image/png"
            );
            if (!asset || !asset.asset_id) throw new Error("Сервер не вернул asset_id для обложки");
            setCoverAsset(asset);
            setSuccessMsg("Обложка загружена");
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки обложки: " + (err.message || err));
            setCoverFile(null);
        }
    };


    const handleCreateAlbum = async () => {
        setError(null);
        setSuccessMsg(null);

        if (!newAlbumName || newAlbumName.length < 4) {
            setError("Название альбома должно быть минимум 4 символа");
            return;
        }
        if (!newAlbumArtistId) {
            setError("Выберите исполнителя для альбома");
            return;
        }
        if (!coverAsset) {
            setError("Загрузите обложку альбома");
            return;
        }

        setCreateAlbumLoading(true);
        try {
            const payload = {
                name: newAlbumName,
                artist_id: Number(newAlbumArtistId),
                asset_id: Number(coverAsset.asset_id),
            };
            const res = await musicApi.adminCreateAlbum(payload);
            const album = res?.album ?? res;
            setAlbums((prev) => [album, ...prev]);
            setSelectedAlbumId(album?.album_id ?? null);
            setCreatingAlbum(false);
            setNewAlbumName("");
            setCoverFile(null);
            setCoverAsset(null);
            setSuccessMsg("Альбом создан");
        } catch (err) {
            console.error(err);
            setError("Ошибка создания альбома: " + (err.message || err));
        } finally {
            setCreateAlbumLoading(false);
        }
    };

    const handleCreateSong = async () => {
        setError(null);
        setSuccessMsg(null);

        if (!audioAsset?.asset_id) {
            setError("Сначала загрузите аудио-файл");
            return;
        }
        if (!trackName || trackName.length < 4) {
            setError("Название трека должно быть минимум 4 символа");
            return;
        }
        if (!selectedAlbumId) {
            setError("Выберите альбом или создайте новый");
            return;
        }

        setCreatingSong(true);
        try {
            const payload = {
                name: trackName,
                album_id: Number(selectedAlbumId),
                asset_id: Number(audioAsset.asset_id),
            };

            await musicApi.adminCreateSong(payload);

            setSuccessMsg("Трек создан успешно!");
            setAudioFile(null);
            setAudioAsset(null);
            setAudioPreviewUrl(null);
            setAudioUploadProgress(0);
            setTrackName("");
            await refreshUser();
        } catch (err) {
            console.error(err);
            setError("Ошибка создания трека: " + (err.message || err));
        } finally {
            setCreatingSong(false);
        }
    };

    useEffect(() => {
        const el = dropRef.current;
        if (!el) return;

        const onDragOver = (e) => {
            e.preventDefault();
            el.classList.add("ring-2", "ring-purple-300");
        };
        const onDragLeave = () => {
            el.classList.remove("ring-2", "ring-purple-300");
        };
        const onDrop = (e) => {
            e.preventDefault();
            el.classList.remove("ring-2", "ring-purple-300");
            const f = e.dataTransfer.files?.[0];
            if (f) handleAudioSelect(f);
        };

        el.addEventListener("dragover", onDragOver);
        el.addEventListener("dragleave", onDragLeave);
        el.addEventListener("drop", onDrop);
        return () => {
            el.removeEventListener("dragover", onDragOver);
            el.removeEventListener("dragleave", onDragLeave);
            el.removeEventListener("drop", onDrop);
        };
    }, [dropRef.current, audioPreviewUrl]);

    if (!hydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="rounded-3xl p-12 shadow-lg bg-[#826d9d]/80 backdrop-blur-md">
                    <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin text-white mr-3" size={24} />
                        <span className="text-white">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (forbidden) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="rounded-3xl p-12 shadow-lg bg-[#826d9d]/80 backdrop-blur-md">
                    <h2 className="text-2xl font-semibold mb-4 text-white">Доступ запрещён</h2>
                    <p className="text-purple-200">Страница доступна только администраторам.</p>
                </div>
            </div>
        );
    }

    const filteredAlbums = albums.filter(a =>
        a.name?.toLowerCase().includes(albumSearch.trim().toLowerCase())
    );

    const filteredArtists = artists.filter(a =>
        a.name?.toLowerCase().includes(artistSearch.trim().toLowerCase())
    );

    return (
        <div
            className="flex items-center justify-center p-4"
            style={{
                height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
            }}>
            <div className="w-full max-w-7xl p-6 rounded-3xl bg-[#826d9d]/80 backdrop-blur-md">
                <h1 className="text-2xl font-bold mb-6 text-white">Загрузка трека</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/90">Аудиофайл</label>

                        <div
                            ref={dropRef}
                            className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center cursor-pointer hover:border-white/50 hover:bg-white/5 transition"
                        >
                            {!audioFile ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                            <Music className="text-white" size={28} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-white mb-2">Перетащите аудио сюда</p>
                                        <p className="text-purple-200 text-sm mb-4">или</p>
                                    </div>
                                    <input
                                        id="audio-input"
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleAudioSelect(f);
                                        }}
                                    />
                                    <label
                                        htmlFor="audio-input"
                                        className="inline-block px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 cursor-pointer transition"
                                    >
                                        Выбрать файл
                                    </label>
                                    <p className="text-xs text-purple-200 mt-3">В формате mp3</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between text-left">
                                        <div className="flex-1">
                                            <div className="font-semibold text-white">{audioFile.name}</div>
                                            <div className="text-sm text-purple-200">{humanFileSize(audioFile.size)}</div>
                                        </div>
                                        {audioUploadProgress === 100 ? (
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <Check className="text-green-300" size={18} />
                                            </div>
                                        ) : (
                                            <div className="text-white font-medium">{audioUploadProgress}%</div>
                                        )}
                                    </div>

                                    {audioPreviewUrl && (
                                        <audio controls src={audioPreviewUrl} className="w-full" />
                                    )}

                                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${audioUploadProgress}%` }}
                                            className="h-2 bg-purple-300 transition-all duration-300"
                                        />
                                    </div>

                                    <button
                                        className="px-4 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition flex items-center gap-2 mx-auto"
                                        onClick={() => {
                                            setAudioFile(null);
                                            setAudioAsset(null);
                                            setAudioPreviewUrl(null);
                                            setAudioUploadProgress(0);
                                        }}
                                    >
                                        <X size={16} />
                                        Отменить
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/90">Название трека</label>
                            <input
                                value={trackName}
                                onChange={(e) => setTrackName(e.target.value)}
                                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-purple-200 focus:outline-none focus:border-white/40 focus:bg-white/15 transition"
                                placeholder="Введите название трека"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/90">Альбом</label>

                        <div className="relative" ref={albumDropdownRef}>
                            <button
                                onClick={() => setAlbumDropdownOpen(v => !v)}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:border-white/40 hover:bg-white/15 transition"
                            >
                                <span className="truncate">
                                    {selectedAlbumId ? (albums.find(a => a.album_id === selectedAlbumId)?.name ?? `ID ${selectedAlbumId}`) : "— Выбрать альбом —"}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" className={`${albumDropdownOpen ? 'rotate-180' : ''} transition-transform`} fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {albumDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-full rounded-lg shadow-lg bg-[#6b547f]/95 border border-white/10">
                                    <div className="p-2">
                                        <input
                                            value={albumSearch}
                                            onChange={(e) => setAlbumSearch(e.target.value)}
                                            placeholder="Поиск альбома..."
                                            className="w-full px-3 py-2 rounded-md bg-[#5b486a] text-white placeholder-white/60 focus:outline-none"
                                        />
                                    </div>
                                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                        {filteredAlbums.length === 0 ? (
                                            <div className="px-3 py-2 text-white/60">Ничего не найдено</div>
                                        ) : (
                                            filteredAlbums.slice(0, 50).map((a) => (
                                                <button
                                                    key={a.album_id ?? a.id}
                                                    onClick={() => {
                                                        setSelectedAlbumId(a.album_id ?? a.id);
                                                        setAlbumDropdownOpen(false);
                                                        setAlbumSearch("");
                                                    }}
                                                    className="w-full text-left px-3 py-2 bg-[#826d9d]/80 hover:bg-[#533f63] transition text-white flex items-center gap-2"
                                                >
                                                    <span className="truncate">{a.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                            onClick={() => setCreatingAlbum((v) => !v)}
                        >
                            {creatingAlbum ? "Отменить создание" : "Создать новый альбом"}
                        </button>

                        {creatingAlbum && (
                            <div className="p-5 rounded-2xl bg-white/10 border border-white/20 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-white/90">Название альбома</label>
                                    <input
                                        value={newAlbumName}
                                        onChange={(e) => setNewAlbumName(e.target.value)}
                                        className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-purple-200 focus:outline-none focus:border-white/40 transition"
                                        placeholder="Название альбома"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-white/90">Исполнитель</label>
                                    <div className="relative" ref={artistDropdownRef}>
                                        <button
                                            onClick={() => setArtistDropdownOpen(v => !v)}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:border-white/40 transition"
                                        >
                                            <span className="truncate">
                                                {newAlbumArtistId ? (artists.find(a => a.artist_id === Number(newAlbumArtistId))?.name ?? `ID ${newAlbumArtistId}`) : "— Выбрать исполнителя —"}
                                            </span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" className={`${artistDropdownOpen ? 'rotate-180' : ''} transition-transform`} fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </button>

                                        {artistDropdownOpen && (
                                            <div className="absolute z-50 mt-2 w-full rounded-lg shadow-lg bg-[#6b547f]/95 border border-white/10">
                                                <div className="p-2">
                                                    <input
                                                        value={artistSearch}
                                                        onChange={(e) => setArtistSearch(e.target.value)}
                                                        placeholder="Поиск исполнителя..."
                                                        className="w-full px-3 py-2 rounded-md bg-[#5b486a] text-white placeholder-white/60 focus:outline-none"
                                                    />
                                                </div>
                                                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                                    {filteredArtists.length === 0 ? (
                                                        <div className="px-3 py-2 text-white/60">Ничего не найдено</div>
                                                    ) : (
                                                        filteredArtists.slice(0, 50).map((ar) => (
                                                            <button
                                                                key={ar.artist_id ?? ar.id}
                                                                onClick={() => {
                                                                    setNewAlbumArtistId(ar.artist_id ?? ar.id);
                                                                    setArtistDropdownOpen(false);
                                                                    setArtistSearch("");
                                                                }}
                                                                className="w-full text-left px-3 py-2 bg-[#826d9d]/80 hover:bg-[#533f63] transition text-white flex items-center gap-2"
                                                            >
                                                                <span className="truncate">{ar.name}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-white/90">Обложка альбома</label>
                                    <div className="border-2 border-dashed border-white/30 rounded-lg p-4 hover:border-white/50 transition">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="cover-input"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) handleCoverSelect(f);
                                            }}
                                        />
                                        {!coverFile ? (
                                            <label htmlFor="cover-input" className="flex flex-col items-center cursor-pointer">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                                                    <ImageIcon className="text-white" size={20} />
                                                </div>
                                                <span className="text-white text-sm">Выбрать изображение</span>
                                            </label>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-white">{coverFile.name}</div>
                                                    {coverUploadProgress === 100 && (
                                                        <Check className="text-green-300" size={18} />
                                                    )}
                                                </div>
                                                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                                    <div style={{ width: `${coverUploadProgress}%` }} className="h-1.5 bg-purple-300 transition-all" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    disabled={createAlbumLoading}
                                    onClick={handleCreateAlbum}
                                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                >
                                    {createAlbumLoading && <Loader2 className="animate-spin" size={16} />}
                                    {createAlbumLoading ? "Создаём..." : "Создать альбом"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-3 flex-wrap">
                    <button
                        disabled={creatingSong || !audioAsset}
                        onClick={handleCreateSong}
                        className="px-6 py-3 rounded-full bg-purple-500/30 text-white hover:bg-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
                    >
                        {creatingSong && <Loader2 className="animate-spin" size={18} />}
                        {creatingSong ? "Создаём трек..." : "Создать трек"}
                    </button>

                    <button
                        onClick={() => {
                            setAudioFile(null);
                            setAudioAsset(null);
                            setAudioPreviewUrl(null);
                            setTrackName("");
                            setSelectedAlbumId(null);
                            setError(null);
                            setSuccessMsg(null);
                        }}
                        className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    >
                        Очистить форму
                    </button>

                    {audioAsset && (
                        <div className="ml-auto text-sm text-purple-200">
                            Asset ID: <span className="text-white font-medium">{audioAsset.asset_id}</span>
                        </div>
                    )}
                </div>

                {(error || successMsg) && (
                    <div className="mt-6">
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg">
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 text-green-200 rounded-lg">
                                {successMsg}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}