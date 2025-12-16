"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/UserContext";
import { musicApi } from "@/app/api/musicApi";
import { Loader2, Users, Music, Album, Plus, Edit, Trash2, X, Check, Upload } from "lucide-react";

const TABS = [
    { id: "users", label: "Пользователи", icon: Users },
    { id: "artists", label: "Исполнители", icon: Music },
    { id: "albums", label: "Альбомы", icon: Album },
];

export default function AdminManagePage() {
    const { user } = useUser();

    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [artists, setArtists] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formState, setFormState] = useState({});
    const [coverFile, setCoverFile] = useState(null);
    const [coverProgress, setCoverProgress] = useState(0);
    const [coverAsset, setCoverAsset] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadData();
        if (activeTab === "albums") loadArtists();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            let res;
            if (activeTab === "users") {
                res = await musicApi.adminGetUsers(1);
            } else if (activeTab === "artists") {
                res = await musicApi.adminGetArtists(1);
            } else if (activeTab === "albums") {
                res = await musicApi.adminGetAlbums(1);
            }
            setData(res.items || res || []);
        } catch (e) {
            setError(e.message || "Ошибка загрузки");
        } finally {
            setLoading(false);
        }
    };

    const [showMessage, setShowMessage] = useState(false);

    const loadArtists = async () => {
        try {
            const res = await musicApi.adminGetArtists(1);
            setArtists(res.items || []);
        } catch (e) {
            console.warn("Не удалось загрузить исполнителей для альбомов");
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
        setFormState({});
        setCoverFile(null);
        setCoverAsset(null);
        setCoverProgress(0);
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormState({ ...item });
        setCoverAsset(item.asset_id ? { asset_id: item.asset_id } : null);
        setCoverFile(null);
        setCoverProgress(0);
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");
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
            }

            setSuccess(editingItem ? "Изменено успешно" : "Создано успешно");
            setModalOpen(false);
            loadData();
        } catch (e) {
            setError(e.message || "Ошибка операции");
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Удалить ${item.name || item.username || "элемент"}?`)) return;

        try {
            if (activeTab === "users") {
                await musicApi.adminDeleteUser(item.user_id);
            } else if (activeTab === "artists") {
                await musicApi.adminDeleteArtist(item.artist_id);
            } else if (activeTab === "albums") {
                await musicApi.adminDeleteAlbum(item.album_id);
            }
            loadData();
        } catch (e) {
            setError(e.message || "Не удалось удалить");
        }
    };

    const handleCoverUpload = async () => {
        if (!coverFile) return;
        setCoverProgress(1);
        try {
            const asset = await musicApi.uploadAssetWithProgress(coverFile, setCoverProgress);
            setCoverAsset(asset);
            setCoverProgress(100);
        } catch (e) {
            setError("Ошибка загрузки обложки: " + e.message);
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

    return (
        <div className="max-w-6xl mx-auto py-8 px-6">
            {/* Вкладки */}
            <div className="flex gap-2 mb-8 flex-wrap">
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

            {/* Кнопка создания */}
            <div className="mb-6">
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-purple-700 font-semibold hover:scale-105 transition shadow-lg"
                >
                    <Plus size={20} />
                    Создать {activeTab === "users" ? "пользователя" : activeTab === "artists" ? "исполнителя" : "альбом"}
                </button>
            </div>

            {/* Сообщения */}
            {(error || success) && (
                <div className={`mb-6 transition-opacity duration-500 ${showMessage ? 'opacity-100' : 'opacity-0'}`}>
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-500/20 border border-green-500/30 text-green-200 rounded-lg">
                            {success}
                        </div>
                    )}
                </div>
            )}

            {/* Таблица */}
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
                                <th className="py-3 px-4">
                                    {activeTab === "users" ? "Имя пользователя" : "Название"}
                                </th>
                                {activeTab === "users" && <th className="py-3 px-4">Админ</th>}
                                {activeTab === "artists" && <th className="py-3 px-4">Биография</th>}
                                {activeTab === "albums" && <th className="py-3 px-4">Исполнитель</th>}
                                <th className="py-3 px-4 text-center">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-white/5">
                                        Нет данных
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.user_id || item.artist_id || item.album_id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-4 px-4 text-white">
                                            {item.user_id || item.artist_id || item.album_id}
                                        </td>
                                        <td className="py-4 px-4 font-medium">
                                            {item.username || item.name}
                                        </td>
                                        {activeTab === "users" && (
                                            <td className="py-4 px-4">
                                                {item.is_admin ? "Да" : "Нет"}
                                            </td>
                                        )}
                                        {activeTab === "artists" && (
                                            <td className="py-4 px-4 text-white max-w-md truncate">
                                                {item.biography || "—"}
                                            </td>
                                        )}
                                        {activeTab === "albums" && (
                                            <td className="py-4 px-4 text-white/70">
                                                {artists.find(a => a.artist_id === item.artist_id)?.name || "ID " + item.artist_id}
                                            </td>
                                        )}
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 rounded-full hover:bg-white/10 transition"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-2 rounded-full hover:bg-red-500/20 transition text-red-300"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Модальное окно */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    />
                    <div className="relative bg-[#826d9d]/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-lg p-8 text-white">
                        <button
                            onClick={() => setModalOpen(false)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white"
                        >
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
                                        <input
                                            value={formState.username || ""}
                                            onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition"
                                            placeholder="username"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Пароль {editingItem && "(оставьте пустым, чтобы не менять)"}
                                        </label>
                                        <input
                                            type="password"
                                            value={formState.password || ""}
                                            onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_admin"
                                            checked={formState.is_admin ?? false}
                                            onChange={(e) => setFormState({ ...formState, is_admin: e.target.checked })}
                                            className="w-5 h-5 rounded"
                                        />
                                        <label htmlFor="is_admin" className="text-lg">
                                            Администратор
                                        </label>
                                    </div>
                                </>
                            )}

                            {(activeTab === "artists" || activeTab === "albums") && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Название</label>
                                        <input
                                            value={formState.name || ""}
                                            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition"
                                            placeholder="Название"
                                        />
                                    </div>

                                    {activeTab === "artists" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Биография</label>
                                            <textarea
                                                value={formState.biography || ""}
                                                onChange={(e) => setFormState({ ...formState, biography: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition"
                                            />
                                        </div>
                                    )}

                                    {activeTab === "albums" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Исполнитель</label>
                                            <select
                                                value={formState.artist_id || ""}
                                                onChange={(e) => setFormState({ ...formState, artist_id: e.target.value })}
                                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-white/40 focus:outline-none transition"
                                            >
                                                <option value="">— Выберите —</option>
                                                {artists.map((a) => (
                                                    <option key={a.artist_id} value={a.artist_id}>
                                                        {a.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Обложка</label>

                                        {coverUrl && (
                                            <div className="mb-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={coverUrl}
                                                    alt="preview"
                                                    className="w-32 h-32 object-cover rounded-lg"
                                                />
                                            </div>
                                        )}

                                        <label className="flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer">
                                            <Upload size={20} />
                                            <span>Выбрать файл</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files[0] && setCoverFile(e.target.files[0])}
                                                className="hidden"
                                            />
                                        </label>

                                        {coverFile && (
                                            <div className="mt-3">
                                                <div className="text-sm mb-1">{coverFile.name}</div>
                                                {coverProgress > 0 && coverProgress < 100 && (
                                                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            style={{ width: `${coverProgress}%` }}
                                                            className="h-full bg-purple-300 transition-all"
                                                        />
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
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-3 rounded-full bg-white text-purple-700 font-semibold hover:scale-105 transition"
                                >
                                    {editingItem ? "Сохранить" : "Создать"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
