"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/app/UserContext";
import authApi from "@/app/api/auth";
import { BACKEND_URL } from "@/config/api";
import { Music, Image as ImageIcon, Check, X, Loader2, User } from "lucide-react";


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

export default function UploadPage() {
    const { user, hydrated, refreshUser } = useUser();
    const tokenQuery = authApi.authQuery(); // ?token=...

    // access control
    const [forbidden, setForbidden] = useState(false);

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

    // song create
    const [creatingSong, setCreatingSong] = useState(false);

    // UI messages
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // refs for drag/drop
    const dropRef = useRef();

    useEffect(() => {
        // access control: wait for hydrated
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

        // fetch albums (we use /user/ endpoint that returns albums list)
        (async () => {
            try {
                const u = await fetchJson(`${BACKEND_URL}/user/${tokenQuery}`);
                setAlbums(u?.albums || []);
            } catch (e) {
                // fallback: try to fetch albums via admin artist endpoints or ignore
                console.warn("Не удалось получить альбомы:", e);
                setAlbums([]);
            }

            // fetch artists for album creation (admin endpoint)
            try {
                const res = await fetchJson(`${BACKEND_URL}/admin/artists${tokenQuery}&page=1`);
                // Respects format { total, page, per_page, items: [...] } OR simple list.
                const items = res?.items ?? res?.artists ?? res;
                setArtists(Array.isArray(items) ? items : []);
            } catch (e) {
                console.warn("Не удалось получить исполнителей:", e);
                setArtists([]);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, user]);

    useEffect(() => {
        return () => {
            // cleanup preview url
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [audioPreviewUrl]);

    // handle file selection (audio)
    const handleAudioSelect = async (file) => {
        setError(null);
        setSuccessMsg(null);
        setAudioFile(file);
        setAudioAsset(null);
        setAudioUploadProgress(0);

        // create preview
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        const url = URL.createObjectURL(file);
        setAudioPreviewUrl(url);

        // start upload immediately
        try {
            const ensureType = file.type || "audio/mpeg";
            const uploadUrl = `${BACKEND_URL}/admin/upload${tokenQuery}&ensure_type=${encodeURIComponent(ensureType)}`;
            const res = await uploadFileWithProgress(uploadUrl, file, setAudioUploadProgress);
            // expect { asset: { asset_id, content_type, is_uploaded } }
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

    // handle cover upload
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

    // handle artist cover upload
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

    // create new artist
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
            // add to artists list and select it
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

    // create new album
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
            // add to albums list and select it
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

    // create song
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
            // clean form
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

    // drag & drop handlers
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
                                    <p className="text-xs text-purple-200 mt-3">mp3, m4a, wav и другие форматы</p>
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
                                    <select
                                        value={newAlbumArtistId ?? ""}
                                        onChange={(e) => setNewAlbumArtistId(e.target.value || null)}
                                        className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:outline-none focus:border-white/40 transition"
                                    >
                                        <option value="" className="bg-[#826d9d]">— Выбрать исполнителя —</option>
                                        {artists.map((ar) => (
                                            <option key={ar.artist_id ?? ar.id} value={ar.artist_id ?? ar.id} className="bg-[#826d9d]">
                                                {ar.name}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        className="mt-2 text-xs text-purple-200 hover:text-white underline"
                                        onClick={() => setCreatingArtist((v) => !v)}
                                    >
                                        {creatingArtist ? "Отменить создание исполнителя" : "Создать нового исполнителя"}
                                    </button>
                                </div>

                                {creatingArtist && (
                                    <div className="p-4 rounded-lg bg-white/10 border border-white/20 space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1 text-white/90">Имя исполнителя</label>
                                            <input
                                                value={newArtistName}
                                                onChange={(e) => setNewArtistName(e.target.value)}
                                                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white text-sm placeholder-purple-200 focus:outline-none focus:border-white/40 transition"
                                                placeholder="Имя исполнителя"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1 text-white/90">Биография</label>
                                            <textarea
                                                value={newArtistBio}
                                                onChange={(e) => setNewArtistBio(e.target.value)}
                                                className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white text-sm placeholder-purple-200 focus:outline-none focus:border-white/40 transition resize-none"
                                                placeholder="Краткая биография исполнителя"
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1 text-white/90">Обложка исполнителя</label>
                                            <div className="border-2 border-dashed border-white/30 rounded-lg p-3 hover:border-white/50 transition">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id="artist-cover-input"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleArtistCoverSelect(f);
                                                    }}
                                                />
                                                {!artistCoverFile ? (
                                                    <label htmlFor="artist-cover-input" className="flex flex-col items-center cursor-pointer">
                                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1">
                                                            <User className="text-white" size={18} />
                                                        </div>
                                                        <span className="text-white text-xs">Выбрать фото</span>
                                                    </label>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-white">{artistCoverFile.name}</div>
                                                            {artistCoverUploadProgress === 100 && (
                                                                <Check className="text-green-300" size={16} />
                                                            )}
                                                        </div>
                                                        <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                                                            <div style={{ width: `${artistCoverUploadProgress}%` }} className="h-1 bg-purple-300 transition-all" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            disabled={createArtistLoading}
                                            onClick={handleCreateArtist}
                                            className="w-full px-3 py-2 rounded-lg bg-white/20 text-white text-sm hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                        >
                                            {createArtistLoading && <Loader2 className="animate-spin" size={14} />}
                                            {createArtistLoading ? "Создаём..." : "Создать исполнителя"}
                                        </button>
                                    </div>
                                )}

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

                {/* Bottom controls */}
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

                {/* Messages */}
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