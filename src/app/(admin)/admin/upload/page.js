"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/app/UserContext";
import authApi from "@/app/api/authApi";
import { BACKEND_URL } from "@/config/api";
import { Music, Check, X } from "lucide-react";

function humanFileSize(bytes) {
    if (!bytes) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + ["B", "KB", "MB", "GB"][i];
}

async function fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
    }
    return res.json();
}

function uploadFileWithProgress(url, file, onProgress) {
    return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText || "{}");
                    resolve(data);
                } catch (err) {
                    reject(new Error("Не удалось разобрать ответ сервера"));
                }
            } else {
                reject(new Error(xhr.responseText || xhr.statusText || `HTTP ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
    });
}

function UploadPage() {
    const { user, refreshUser } = useUser();
    const tokenQuery = authApi.authQuery();

    // audio upload state
    const [audioFile, setAudioFile] = useState(null);
    const [audioAsset, setAudioAsset] = useState(null);
    const [audioUploadProgress, setAudioUploadProgress] = useState(0);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);

    // cover upload state (for album creation)
    const [coverFile, setCoverFile] = useState(null);
    const [coverAsset, setCoverAsset] = useState(null);
    const [coverUploadProgress, setCoverUploadProgress] = useState(0);

    // artist cover upload state
    const [artistCoverFile, setArtistCoverFile] = useState(null);
    const [artistCoverAsset, setArtistCoverAsset] = useState(null);
    const [artistCoverUploadProgress, setArtistCoverUploadProgress] = useState(0);

    // metadata
    const [trackName, setTrackName] = useState("");
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);

    // album creation
    const [creatingAlbum, setCreatingAlbum] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState("");
    const [newAlbumArtistId, setNewAlbumArtistId] = useState(null);
    const [createAlbumLoading, setCreateAlbumLoading] = useState(false);

    // artist creation
    const [creatingArtist, setCreatingArtist] = useState(false);
    const [newArtistName, setNewArtistName] = useState("");
    const [newArtistBio, setNewArtistBio] = useState("");
    const [createArtistLoading, setCreateArtistLoading] = useState(false);

    const [creatingSong, setCreatingSong] = useState(false);

    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const dropRef = useRef();

    useEffect(() => {
        // fetch albums and artists
        (async () => {
            try {
                const u = await fetchJson(`${BACKEND_URL}/user/${tokenQuery}`);
                setAlbums(u?.albums || []);
            } catch (e) {
                console.warn("Не удалось получить альбомы:", e);
                setAlbums([]);
            }

            try {
                const res = await fetchJson(`${BACKEND_URL}/admin/artists${tokenQuery}&page=1`);
                const items = res?.items ?? res?.artists ?? res;
                setArtists(Array.isArray(items) ? items : []);
            } catch (e) {
                console.warn("Не удалось получить исполнителей:", e);
                setArtists([]);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return () => {
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [audioPreviewUrl]);

    // Все остальные функции остаются без изменений...
    const handleAudioSelect = async (file) => {
        setError(null);
        setSuccessMsg(null);
        setAudioFile(file);
        setAudioAsset(null);
        setAudioUploadProgress(0);

        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        const url = URL.createObjectURL(file);
        setAudioPreviewUrl(url);

        try {
            const ensureType = file.type || "audio/mpeg";
            const uploadUrl = `${BACKEND_URL}/admin/upload${tokenQuery}&ensure_type=${encodeURIComponent(ensureType)}`;
            const res = await uploadFileWithProgress(uploadUrl, file, setAudioUploadProgress);
            const asset = res?.asset ?? null;
            if (!asset || !asset.asset_id) {
                throw new Error("Сервер не вернул asset_id");
            }
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
        setCoverFile(file);
        setCoverUploadProgress(0);
        setCoverAsset(null);

        try {
            const ensureType = file.type || "image/jpeg";
            const uploadUrl = `${BACKEND_URL}/admin/upload${tokenQuery}&ensure_type=${encodeURIComponent(ensureType)}`;
            const res = await uploadFileWithProgress(uploadUrl, file, setCoverUploadProgress);
            const asset = res?.asset ?? null;
            if (!asset || !asset.asset_id) throw new Error("Сервер не вернул asset_id для обложки");
            setCoverAsset(asset);
            setSuccessMsg("Обложка загружена");
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки обложки: " + (err.message || err));
            setCoverFile(null);
        }
    };

    const handleArtistCoverSelect = async (file) => {
        setError(null);
        setSuccessMsg(null);
        setArtistCoverFile(file);
        setArtistCoverUploadProgress(0);
        setArtistCoverAsset(null);

        try {
            const ensureType = file.type || "image/jpeg";
            const uploadUrl = `${BACKEND_URL}/admin/upload${tokenQuery}&ensure_type=${encodeURIComponent(ensureType)}`;
            const res = await uploadFileWithProgress(uploadUrl, file, setArtistCoverUploadProgress);
            const asset = res?.asset ?? null;
            if (!asset || !asset.asset_id) throw new Error("Сервер не вернул asset_id для обложки исполнителя");
            setArtistCoverAsset(asset);
            setSuccessMsg("Обложка исполнителя загружена");
        } catch (err) {
            console.error(err);
            setError("Ошибка загрузки обложки исполнителя: " + (err.message || err));
            setArtistCoverFile(null);
        }
    };

    const handleCreateArtist = async () => {
        setError(null);
        setSuccessMsg(null);

        if (!newArtistName || newArtistName.length < 4) {
            setError("Имя исполнителя должно быть минимум 4 символа");
            return;
        }
        if (!newArtistBio || newArtistBio.length < 8) {
            setError("Биография должна быть минимум 8 символов");
            return;
        }
        if (!artistCoverAsset) {
            setError("Загрузите обложку исполнителя");
            return;
        }

        setCreateArtistLoading(true);
        try {
            const payload = {
                name: newArtistName,
                biography: newArtistBio,
                asset_id: Number(artistCoverAsset.asset_id),
            };
            const res = await fetchJson(`${BACKEND_URL}/admin/artists${tokenQuery}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const artist = res?.artist ?? res;
            setArtists((prev) => [artist, ...prev]);
            setNewAlbumArtistId(artist?.artist_id ?? null);
            setCreatingArtist(false);
            setNewArtistName("");
            setNewArtistBio("");
            setArtistCoverFile(null);
            setArtistCoverAsset(null);
            setSuccessMsg("Исполнитель создан");
        } catch (err) {
            console.error(err);
            setError("Ошибка создания исполнителя: " + (err.message || err));
        } finally {
            setCreateArtistLoading(false);
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
            const res = await fetchJson(`${BACKEND_URL}/admin/albums${tokenQuery}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
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

        if (!audioAsset || !audioAsset.asset_id) {
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
            const res = await fetchJson(`${BACKEND_URL}/admin/songs${tokenQuery}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const song = res?.song ?? res;
            setSuccessMsg("Трек создан успешно!");
            setAudioFile(null);
            setAudioAsset(null);
            setAudioPreviewUrl(null);
            setAudioUploadProgress(0);
            setTrackName("");
            try { await refreshUser(); } catch {}
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropRef.current, audioPreviewUrl]);

    return (
        <div
            className="flex items-center justify-center p-4"
            style={{
                height: `calc(95vh - var(--header-height, 64px) - var(--player-height, 0px))`
            }}>
            <div className="w-full max-w-7xl p-6 rounded-3xl bg-[#826d9d]/80 backdrop-blur-md">
                <h1 className="text-2xl font-bold mb-6 text-white">Загрузка трека</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Audio uploader */}
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

                    {/* Right: Album selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/90">Альбом</label>

                        <select
                            value={selectedAlbumId ?? ""}
                            onChange={(e) => setSelectedAlbumId(e.target.value || null)}
                            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/15 transition"
                        >
                            <option value="" className="bg-[#826d9d]">— Выбрать альбом —</option>
                            {albums.map((a) => (
                                <option key={a.album_id ?? a.id} value={a.album_id ?? a.id} className="bg-[#826d9d]">
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Сообщения об ошибках/успехе */}
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

export default UploadPage;