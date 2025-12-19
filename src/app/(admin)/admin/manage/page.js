"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/app/UserContext";
import { musicApi } from "@/app/api/musicApi";
import { Loader2, Users, Music, Album, Plus, Edit, Trash2, X, Check, Upload, Eye, EyeOff } from "lucide-react";

const TABS = [
    { id: "users", label: "Пользователи", icon: Users },
    { id: "artists", label: "Исполнители", icon: Music },
    { id: "albums", label: "Альбомы", icon: Album },
];

function normalizeItems(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.items) return res.items;
    if (res.artists) return res.artists;
    if (res.albums) return res.albums;
    if (res.users) return res.users;
    if (res.songs) return res.songs;
    return [];
}

export default function AdminManagePage() {
    const { user } = useUser();

    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albumsForArtist, setAlbumsForArtist] = useState([]);
    const [selectedArtistId, setSelectedArtistId] = useState(null);

    const [selectedAlbumId, setSelectedAlbumId] = useState(null);
    const [albumsDropdownOpen, setAlbumsDropdownOpen] = useState(false);
    const [albumSearch, setAlbumSearch] = useState("");

    const [tracks, setTracks] = useState([]);
    const [tracksLoading, setTracksLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formState, setFormState] = useState({});
    const [coverFile, setCoverFile] = useState(null);
    const [coverProgress, setCoverProgress] = useState(0);
    const [coverAsset, setCoverAsset] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
    const [artistSearch, setArtistSearch] = useState("");

    const [modalArtistDropdownOpen, setModalArtistDropdownOpen] = useState(false);
    const [modalArtistSearch, setModalArtistSearch] = useState("");
    const [songModalOpen, setSongModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [songForm, setSongForm] = useState({ name: "", asset_id: null });
    const [audioFile, setAudioFile] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);

    const requestIdRef = useRef(0);
    const artistDropdownRef = useRef(null);
    const albumsDropdownRef = useRef(null);
    const modalArtistDropdownRef = useRef(null);

    useEffect(() => {
        (async () => {
            await loadInitial();
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (activeTab === "artists") {
                await loadArtists();
                await loadData();
            } else if (activeTab === "users") {
                await loadData();
            } else if (activeTab === "albums") {
                await loadArtists();
                setAlbumsForArtist([]);
                setSelectedArtistId(null);
                setSelectedAlbumId(null);
                setTracks([]);
                setData([]);
                setLoading(false);
            }
        })();
    }, [activeTab]);

    useEffect(() => {
        if (selectedArtistId) {
            loadAlbumsForArtist(selectedArtistId);
            setSelectedAlbumId(null);
            setTracks([]);
        } else {
            setAlbumsForArtist([]);
            setSelectedAlbumId(null);
            setTracks([]);
        }
    }, [selectedArtistId]);

    useEffect(() => {
        if (selectedAlbumId) {
            loadTracksForAlbum(selectedAlbumId);
        } else {
            setTracks([]);
        }
    }, [selectedAlbumId]);

    useEffect(() => {
        function onOutside(e) {
            if (artistDropdownRef.current && !artistDropdownRef.current.contains(e.target)) {
                setArtistDropdownOpen(false);
            }
            if (albumsDropdownRef.current && !albumsDropdownRef.current.contains(e.target)) {
                setAlbumsDropdownOpen(false);
            }
            if (modalArtistDropdownRef.current && !modalArtistDropdownRef.current.contains(e.target)) {
                setModalArtistDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, []);

    const loadInitial = async () => {
        setLoading(true);
        try {
            await loadArtists();
            await loadData();
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        requestIdRef.current += 1;
        const callId = requestIdRef.current;
        setLoading(true);
        setError("");
        setData([]);

        try {
            let res;
            if (activeTab === "users") {
                res = await musicApi.adminGetUsers(1);
            } else if (activeTab === "artists") {
                res = await musicApi.adminGetArtists(1);
            } else {
                res = [];
            }

            if (callId !== requestIdRef.current) return;
            const items = normalizeItems(res);
            setData(items);
        } catch (e) {
            if (callId !== requestIdRef.current) return;
            setError(e?.message || "Ошибка загрузки");
            setData([]);
        } finally {
            if (callId === requestIdRef.current) setLoading(false);
        }
    };

    const loadArtists = async () => {
        requestIdRef.current += 1;
        const callId = requestIdRef.current;
        try {
            const res = await musicApi.adminGetArtists(1);
            if (callId !== requestIdRef.current) return;
            const items = normalizeItems(res);
            setArtists(items);
        } catch (e) {
            if (callId !== requestIdRef.current) return;
            setArtists([]);
            console.warn("Не удалось получить список исполнителей", e);
        }
    };

    const loadAlbumsForArtist = async (artistId) => {
        requestIdRef.current += 1;
        const callId = requestIdRef.current;
        setLoading(true);
        setError("");
        setAlbumsForArtist([]);
        try {
            const res = await musicApi.adminGetArtistAlbums(artistId, 1);
            if (callId !== requestIdRef.current) return;
            const items = normalizeItems(res);
            setAlbumsForArtist(items);
        } catch (e) {
            if (callId !== requestIdRef.current) return;
            setError(e?.message || "Ошибка загрузки альбомов");
            setAlbumsForArtist([]);
        } finally {
            if (callId === requestIdRef.current) setLoading(false);
        }
    };

    const loadTracksForAlbum = async (albumId) => {
        setTracksLoading(true);
        setError("");
        setTracks([]);
        try {
            const res = await musicApi.getAlbumSongs(albumId, 1);
            const items = normalizeItems(res);
            setTracks(items);
        } catch (e) {
            setError(e?.message || "Ошибка загрузки треков");
            setTracks([]);
        } finally {
            setTracksLoading(false);
        }
    };

    useEffect(() => {
        if (success || error) {
            setShowMessage(true);
            const timer = setTimeout(() => {
                setShowMessage(false);
                setSuccess("");
                setError("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const openCreateModal = () => {
        setEditingItem(null);
        setFormState(activeTab === "albums" ? { artist_id: selectedArtistId ?? "" } : {});
        setCoverFile(null);
        setCoverAsset(null);
        setCoverProgress(0);
        setFormErrors({});
        setShowPassword(false);
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        if (activeTab === "albums") {
            setFormState({ ...item });
            setCoverAsset(item.asset_id ? { asset_id: item.asset_id } : null);
        } else {
            setFormState({ ...item, password: "" });
            setCoverAsset(item.asset_id ? { asset_id: item.asset_id } : null);
        }
        setCoverFile(null);
        setCoverProgress(0);
        setFormErrors({});
        setShowPassword(false);
        setModalOpen(true);
    };

    const validateField = (name, value) => {
        let msg = "";
        if (name === "username") {
            if (!value || value.trim().length < 4) msg = "Логин должен содержать минимум 4 символа";
        }
        if (name === "password") {
            if (!editingItem) {
                if (!value || value.length < 8) msg = "Пароль должен содержать минимум 8 символов";
            } else {
                if (value && value.length > 0 && value.length < 8) msg = "Пароль должен содержать минимум 8 символов";
            }
        }
        if (name === "biography") {
            if (!value || value.trim().length < 8) msg = "Биография должна содержать минимум 8 символов";
        }
        setFormErrors((s) => ({ ...s, [name]: msg }));
        return msg === "";
    };

    const handleChange = (key, value) => {
        setFormState((s) => ({ ...s, [key]: value }));
        if (key === "username" || key === "password" || key === "biography") {
            validateField(key, value);
        }
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");
        const errors = {};

        if (activeTab === "users") {
            if (!validateField("username", formState.username)) errors.username = true;
            if (!validateField("password", formState.password || "")) errors.password = true;
        }

        if (activeTab === "artists") {
            if (!validateField("biography", formState.biography || "")) errors.biography = true;
        }

        if (activeTab === "albums") {
            if (!formState.name || formState.name.trim().length < 4) {
                setError("Название альбома должно быть минимум 4 символа");
                return;
            }
            if (!formState.artist_id) {
                setError("Выберите исполнителя для альбома");
                return;
            }
        }

        if (Object.keys(errors).length > 0) {
            setError("Пожалуйста, исправьте ошибки в форме");
            return;
        }

        try {
            if (activeTab === "users") {
                const body = {
                    username: formState.username,
                    password: formState.password || undefined,
                    is_admin: formState.is_admin ?? false,
                };
                if (editingItem) {
                    await musicApi.adminUpdateUser(editingItem.user_id, body);
                } else {
                    await musicApi.adminCreateUser(body);
                }
                await loadData();
            }

            if (activeTab === "artists") {
                const body = {
                    name: formState.name,
                    biography: formState.biography,
                    asset_id: coverAsset?.asset_id || null,
                };
                if (editingItem) {
                    await musicApi.adminUpdateArtist(editingItem.artist_id, body);
                } else {
                    await musicApi.adminCreateArtist(body);
                }
                await loadData();
                await loadArtists();
            }

            if (activeTab === "albums") {
                const body = {
                    name: formState.name,
                    artist_id: Number(formState.artist_id),
                    asset_id: coverAsset?.asset_id || null,
                };
                if (editingItem) {
                    await musicApi.adminUpdateAlbum(editingItem.album_id, body);
                } else {
                    await musicApi.adminCreateAlbum(body);
                }
                if (formState.artist_id) await loadAlbumsForArtist(formState.artist_id);
            }

            setSuccess(editingItem ? "Изменено успешно" : "Создано успешно");
            setModalOpen(false);
        } catch (e) {
            setError(e?.message || "Ошибка операции");
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Удалить ${item.name || item.username || "элемент"}?`)) return;
        try {
            if (activeTab === "users") {
                await musicApi.adminDeleteUser(item.user_id);
                await loadData();
            } else if (activeTab === "artists") {
                await musicApi.adminDeleteArtist(item.artist_id);
                await loadData();
                await loadArtists();
            } else if (activeTab === "albums") {
                await musicApi.adminDeleteAlbum(item.album_id);
                if (selectedArtistId) await loadAlbumsForArtist(selectedArtistId);
                setSelectedAlbumId(null);
                setTracks([]);
            }
            setSuccess("Удалено");
        } catch (e) {
            setError(e?.message || "Не удалось удалить");
        }
    };

    const handleCoverUpload = async () => {
        if (!coverFile) return;
        setCoverProgress(1);
        try {
            const asset = await musicApi.uploadAssetWithProgress(coverFile, setCoverProgress, "image/png");
            setCoverAsset(asset);
            setCoverProgress(100);
        } catch (e) {
            setError("Ошибка загрузки обложки: " + (e?.message || e));
            setCoverProgress(0);
        }
    };

    useEffect(() => {
        if (coverFile) handleCoverUpload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coverFile]);

    const coverUrl = coverAsset?.asset_id ? musicApi.getAssetUrl(coverAsset.asset_id) : null;

    if (!user?.is_admin) {
        return <div className="text-center py-20 text-white">Доступ запрещён</div>;
    }

    const tableItems = activeTab === "albums" ? (selectedAlbumId ? tracks : albumsForArtist) : data;

    const filteredArtists = artists.filter(a =>
        a.name?.toLowerCase().includes(artistSearch.trim().toLowerCase())
    );

    const filteredAlbums = albumsForArtist.filter(al =>
        al.name?.toLowerCase().includes(albumSearch.trim().toLowerCase())
    );

    const filteredModalArtists = artists.filter(a =>
        a.name?.toLowerCase().includes(modalArtistSearch.trim().toLowerCase())
    );

    const openEditSongModal = (song) => {
        setEditingSong(song);
        setSongForm({ name: song.name || "", asset_id: song.asset_id ?? null, album_id: song.album_id });
        setAudioFile(null);
        setAudioProgress(0);
        setSongModalOpen(true);
    };

    const uploadAudioFile = async (file) => {
        if (!file) return null;
        if (!file.name.toLowerCase().endsWith(".mp3") && file.type !== "audio/mpeg") {
            throw new Error("Допустим только формат MP3");
        }
        const asset = await musicApi.uploadAssetWithProgress(file, setAudioProgress, "audio/mpeg");
        return asset;
    };

    const handleSongSave = async () => {
        setError("");
        setSuccess("");
        if (!songForm.name || songForm.name.trim().length < 1) { setError("Введите название трека"); return; }
        if (!songForm.album_id) { setError("Альбом не выбран"); return; }

        try {
            let assetId = songForm.asset_id ?? null;
            if (audioFile) {
                const asset = await uploadAudioFile(audioFile);
                assetId = asset?.asset_id ?? null;
            }

            const payload = { name: songForm.name, album_id: Number(songForm.album_id), asset_id: assetId ? Number(assetId) : null };

            if (editingSong) {
                await musicApi.adminUpdateSong(editingSong.song_id, payload);
            } else {
                await musicApi.adminCreateSong(payload);
            }

            setSongModalOpen(false);
            if (songForm.album_id) await loadTracksForAlbum(songForm.album_id);
            setSuccess(editingSong ? "Трек обновлён" : "Трек создан");
        } catch (e) {
            setError(e?.message || "Ошибка сохранения трека");
        } finally {
            setAudioProgress(0);
            setAudioFile(null);
        }
    };

    const handleSongDelete = async (song) => {
        if (!confirm(`Удалить трек "${song.name}"?`)) return;
        try {
            await musicApi.adminDeleteSong(song.song_id);
            if (selectedAlbumId) await loadTracksForAlbum(selectedAlbumId);
            setSuccess("Трек удалён");
        } catch (e) {
            setError(e?.message || "Ошибка удаления трека");
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-6">
            <div className="flex gap-2 mb-4 flex-wrap">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full transition ${
                            activeTab === tab.id
                                ? "bg-white text-purple-700 font-semibold"
                                : "bg-white/25 text-white hover:bg-white/20"
                        }`}
                    >
                        <tab.icon size={20} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "albums" && (
                <div className="mb-6 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <label className="text-white/80">Исполнитель:</label>

                        <div className="relative" ref={artistDropdownRef} style={{ minWidth: 260 }}>
                            <button
                                onClick={() => setArtistDropdownOpen(v => !v)}
                                className="w-64 flex items-center justify-between gap-3 px-4 py-2 rounded-lg bg-[#826d9d]/80 text-white hover:bg-[#6b547f]/80 transition"
                            >
                                <span className="truncate">
                                    {selectedArtistId ? (artists.find(a => a.artist_id === selectedArtistId)?.name ?? `ID ${selectedArtistId}`) : "— Выберите исполнителя —"}
                                </span>
                                <div className="flex items-center gap-1">
                                    {selectedArtistId && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); setSelectedArtistId(null); }}
                                            className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                                        >
                                            <X size={14} />
                                        </span>
                                    )}
                                    <svg width="16" height="16" viewBox="0 0 24 24" className={`${artistDropdownOpen ? 'rotate-180' : ''} transition-transform`} fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </button>

                            {artistDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-64 rounded-lg shadow-lg bg-[#6b547f]/95 border border-white/10">
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
                                            filteredArtists.slice(0, 50).map((a) => (
                                                <button
                                                    key={a.artist_id}
                                                    onClick={() => { setSelectedArtistId(a.artist_id); setArtistDropdownOpen(false); setArtistSearch(""); }}
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
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-white/80">Альбом:</label>

                        <div className="relative" ref={albumsDropdownRef} style={{ minWidth: 260 }}>
                            <button
                                onClick={() => setAlbumsDropdownOpen(v => !v)}
                                disabled={!selectedArtistId}
                                className={`w-64 flex items-center justify-between gap-3 px-4 py-2 rounded-lg ${selectedArtistId ? 'bg-[#826d9d]/80 hover:bg-[#6b547f]/80' : 'bg-white/10 cursor-not-allowed'} text-white transition`}
                            >
                                <span className="truncate">
                                    {selectedAlbumId ? (albumsForArtist.find(al => al.album_id === selectedAlbumId)?.name ?? `ID ${selectedAlbumId}`) : "— Выберите альбом —"}
                                </span>
                                <div className="flex items-center gap-1">
                                    {selectedAlbumId && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); setSelectedAlbumId(null); }}
                                            className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                                        >
                                            <X size={14} />
                                        </span>
                                    )}
                                    <svg width="16" height="16" viewBox="0 0 24 24" className={`${albumsDropdownOpen ? 'rotate-180' : ''} transition-transform`} fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </button>

                            {albumsDropdownOpen && selectedArtistId && (
                                <div className="absolute z-50 mt-2 w-64 rounded-lg shadow-lg bg-[#6b547f]/95 border border-white/10">
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
                                            filteredAlbums.slice(0, 50).map((al) => (
                                                <button
                                                    key={al.album_id}
                                                    onClick={() => { setSelectedAlbumId(al.album_id); setAlbumsDropdownOpen(false); setAlbumSearch(""); }}
                                                    className="w-full text-left px-3 py-2 bg-[#826d9d]/80 hover:bg-[#533f63] transition text-white flex items-center gap-2"
                                                >
                                                    <span className="truncate">{al.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-purple-700 font-semibold hover:scale-105 transition shadow-lg"
                            disabled={!selectedArtistId}
                        >
                            <Plus size={16} />
                            Создать альбом
                        </button>
                    </div>
                </div>
            )}

            {activeTab !== "albums" && (
                <div className="mb-6">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-purple-700 font-semibold hover:scale-105 transition shadow-lg"
                    >
                        <Plus size={20} />
                        Создать {activeTab === "users" ? "пользователя" : "исполнителя"}
                    </button>
                </div>
            )}

            {(error || success) && (
                <div className={`mb-6 transition-opacity duration-500 ${showMessage ? "opacity-100" : "opacity-0"}`}>
                    {error && <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg">{error}</div>}
                    {success && <div className="p-4 bg-green-500/20 border border-green-500/30 text-green-200 rounded-lg">{success}</div>}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-white" size={32} />
                    <span className="ml-3 text-white">Загрузка...</span>
                </div>
            ) : (
                <div className="rounded-2xl bg-[#826d9d]/80 backdrop-blur-sm p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-white">
                            <thead>
                            <tr className="text-left border-b border-white/50">
                                <th className="py-3 px-4">ID</th>
                                <th className="py-3 px-4">Название</th>
                                {activeTab === "users" && <th className="py-3 px-4">Админ</th>}
                                {activeTab === "artists" && <th className="py-3 px-4">Биография</th>}
                                {activeTab === "albums" && !selectedAlbumId && <th className="py-3 px-4">Исполнитель</th>}
                                {activeTab === "albums" && selectedAlbumId && <th className="py-3 px-4">Вложение</th>}
                                <th className="py-3 px-4 text-center">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(!tableItems || tableItems.length === 0) ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-white/70">
                                        {activeTab === "albums" && !selectedArtistId ? "Выберите исполнителя, чтобы увидеть альбомы" :
                                            activeTab === "albums" && selectedArtistId && !selectedAlbumId ? "Альбомы не найдены" :
                                                activeTab === "albums" && selectedAlbumId && tracksLoading ? "Загрузка треков..." : "Нет данных"}
                                    </td>
                                </tr>
                            ) : (
                                tableItems.map((item, index) => {
                                    const rawId = item.user_id ?? item.artist_id ?? item.album_id ?? item.song_id ?? item.id;
                                    const rowKey =
                                        activeTab === "users"
                                            ? `user-${rawId}-${index}`
                                            : activeTab === "artists"
                                                ? `artist-${rawId}-${index}`
                                                : activeTab === "albums" && selectedAlbumId
                                                    ? `track-${rawId}-${selectedAlbumId}-${index}`
                                                    : `album-${rawId}-${index}`;

                                    const title = item.username ?? item.name ?? item.title ?? item.name;

                                    return (
                                        <tr key={rowKey} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-4 px-4 text-white">{rawId}</td>
                                            <td className="py-4 px-4 font-medium">{title}</td>

                                            {activeTab === "users" && <td className="py-4 px-4">{item.is_admin ? "Да" : "Нет"}</td>}

                                            {activeTab === "artists" && (
                                                <td className="py-4 px-4 text-white max-w-md truncate">{item.biography || "—"}</td>
                                            )}

                                            {activeTab === "albums" && !selectedAlbumId && (
                                                <td className="py-4 px-4 text-white/70">
                                                    {artists.find((a) => a.artist_id === item.artist_id)?.name || `ID ${item.artist_id}`}
                                                </td>
                                            )}

                                            {activeTab === "albums" && selectedAlbumId && (
                                                <td className="py-4 px-4 text-white/70">
                                                    {item.duration ? `${Math.round(item.duration)}s` : `Asset ${item.asset_id ?? "—"}`}
                                                </td>
                                            )}

                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    {activeTab === "albums" && selectedAlbumId ? (
                                                        <>
                                                            <button onClick={() => openEditSongModal(item)} className="p-2 rounded-full hover:bg-white/10 transition">
                                                                <Edit size={18} />
                                                            </button>
                                                            <button onClick={() => handleSongDelete(item)} className="p-2 rounded-full hover:bg-red-500/20 transition text-red-300">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => openEditModal(item)} className="p-2 rounded-full hover:bg-white/10 transition">
                                                                <Edit size={18} />
                                                            </button>
                                                            <button onClick={() => handleDelete(item)} className="p-2 rounded-full hover:bg-red-500/20 transition text-red-300">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-[#826d9d]/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-lg p-8 text-white">
                        <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6">
                            {editingItem ? "Редактировать" : "Создать"}{" "}
                            {activeTab === "users" ? "пользователя" : activeTab === "artists" ? "исполнителя" : "альбом"}
                        </h2>

                        <div className="space-y-5">
                            {activeTab === "users" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Имя пользователя</label>
                                        <input value={formState.username || ""} onChange={(e) => handleChange("username", e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition" placeholder="username" />
                                        {formErrors.username && <div className="mt-1 text-sm text-red-300">{formErrors.username}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Пароль {editingItem && "(оставьте пустым, чтобы не менять)"}</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={formState.password || ""} onChange={(e) => handleChange("password", e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition pr-12" />
                                            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {formErrors.password && <div className="mt-1 text-sm text-red-300">{formErrors.password}</div>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="is_admin" checked={formState.is_admin ?? false} onChange={(e) => setFormState({ ...formState, is_admin: e.target.checked })} className="w-5 h-5 rounded" />
                                        <label htmlFor="is_admin" className="text-lg">Администратор</label>
                                    </div>
                                </>
                            )}

                            {(activeTab === "artists" || activeTab === "albums") && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Название</label>
                                        <input value={formState.name || ""} onChange={(e) => setFormState({ ...formState, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition" placeholder="Название" />
                                    </div>

                                    {activeTab === "artists" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Биография</label>
                                            <textarea value={formState.biography || ""} onChange={(e) => handleChange("biography", e.target.value)} rows={4} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition" />
                                            {formErrors.biography && <div className="mt-1 text-sm text-red-300">{formErrors.biography}</div>}
                                        </div>
                                    )}

                                    {activeTab === "albums" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Исполнитель</label>
                                            <div className="relative" ref={modalArtistDropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setModalArtistDropdownOpen(v => !v)}
                                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 text-white transition"
                                                >
                                                    <span className="truncate">
                                                        {formState.artist_id ? (artists.find(a => a.artist_id === Number(formState.artist_id))?.name ?? `ID ${formState.artist_id}`) : "— Выберите исполнителя —"}
                                                    </span>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" className={`${modalArtistDropdownOpen ? 'rotate-180' : ''} transition-transform`} fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </button>

                                                {modalArtistDropdownOpen && (
                                                    <div className="absolute z-[60] mt-2 w-full rounded-lg shadow-lg bg-[#6b547f]/95 border border-white/10">
                                                        <div className="p-2">
                                                            <input
                                                                value={modalArtistSearch}
                                                                onChange={(e) => setModalArtistSearch(e.target.value)}
                                                                placeholder="Поиск исполнителя..."
                                                                className="w-full px-3 py-2 rounded-md bg-[#5b486a] text-white placeholder-white/60 focus:outline-none"
                                                            />
                                                        </div>
                                                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                                            {filteredModalArtists.length === 0 ? (
                                                                <div className="px-3 py-2 text-white/60">Ничего не найдено</div>
                                                            ) : (
                                                                filteredModalArtists.slice(0, 50).map((a) => (
                                                                    <button
                                                                        key={a.artist_id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormState({ ...formState, artist_id: a.artist_id });
                                                                            setModalArtistDropdownOpen(false);
                                                                            setModalArtistSearch("");
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
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Обложка</label>

                                        {coverUrl && (
                                            <div className="mb-3 relative inline-block">
                                                <img src={coverUrl} alt="preview" className="w-32 h-32 object-cover rounded-lg" />
                                                <button type="button" className="absolute -top-2 -right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition" aria-label="Удалить изображение" onClick={() => { setCoverAsset(null); }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}

                                        <label className="flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer">
                                            <Upload size={20} />
                                            <span>Выбрать файл</span>
                                            <input type="file" accept="image/png" onChange={(e) => e.target.files[0] && setCoverFile(e.target.files[0])} className="hidden" />
                                        </label>

                                        {coverFile && (
                                            <div className="mt-3">
                                                <div className="text-sm mb-1">{coverFile.name}</div>
                                                {coverProgress > 0 && coverProgress < 100 && (
                                                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                                        <div style={{ width: `${coverProgress}%` }} className="h-full bg-purple-300 transition-all" />
                                                    </div>
                                                )}
                                                {coverProgress === 100 && (
                                                    <div className="text-green-300 flex items-center gap-2">
                                                        <Check size={18} /> Загружено
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition">Отмена</button>
                                <button onClick={handleSubmit} className="px-6 py-3 rounded-full bg-white text-purple-700 font-semibold hover:scale-105 transition">{editingItem ? "Сохранить" : "Создать"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {songModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSongModalOpen(false)} />
                    <div className="relative bg-[#826d9d]/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-lg p-8 text-white">
                        <button onClick={() => setSongModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6">{editingSong ? "Редактировать трек" : "Создать трек"}</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2">Название</label>
                                <input value={songForm.name || ""} onChange={(e) => setSongForm(s => ({ ...s, name: e.target.value }))} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition" placeholder="Название трека" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Аудиофайл (MP3)</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer">
                                        <input type="file" accept="audio/mpeg" className="hidden" onChange={(e) => setAudioFile(e.target.files[0])} />
                                        <span>Выбрать MP3</span>
                                    </label>
                                    {audioFile && <div className="text-white/80">{audioFile.name}</div>}
                                    {audioProgress > 0 && audioProgress < 100 && (
                                        <div className="w-40 bg-white/20 h-2 rounded-full overflow-hidden">
                                            <div style={{ width: `${audioProgress}%` }} className="h-full bg-purple-300 transition-all" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setSongModalOpen(false)} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition">Отмена</button>
                                <button onClick={handleSongSave} className="px-6 py-3 rounded-full bg-white text-purple-700 font-semibold hover:scale-105 transition">{editingSong ? "Сохранить" : "Создать"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}