"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Music, Play, Clock } from "lucide-react";
import TrackItem from "@/components/TrackItem";
import { musicApi } from "@/app/api/musicApi";
import { formatSeconds } from '@/app/utils/time';
import { useMusic } from "@/app/MusicContext";

export default function AlbumPage() {
    const params = useParams();
    const router = useRouter();
    const albumId = params.albumId;

    const [loading, setLoading] = useState(true);
    const [album, setAlbum] = useState(null);
    const [artist, setArtist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [error, setError] = useState(null);

    const { selectOrTogglePlaylist } = useMusic();

    useEffect(() => {
        loadAlbumData();
    }, [albumId]);

    const loadAlbumData = async () => {
        setLoading(true);
        setError(null);

        try {
            const albumData = await musicApi.getAlbum(albumId);
            setAlbum(albumData.album);

            const songsData = await musicApi.getAlbumSongs(albumId);

            const index = await musicApi.getIndex();
            const artistsById = {};
            (index?.artists || []).forEach(a => { artistsById[a.artist_id] = a; });

            const albumArtist = artistsById[albumData.album.artist_id];
            setArtist(albumArtist);

            const coverAssetId = albumData.album.asset_id || (albumArtist?.asset_id);
            const processedSongs = (songsData.items || []).map(s => ({
                id: s.song_id,
                title: s.name,
                album_id: s.album_id,
                artist: albumArtist?.name || "Неизвестный",
                rawArtistName: albumArtist?.name || "Неизвестный",
                duration: s.duration || 0,
                cover: coverAssetId ? musicApi.getAudioUrl(coverAssetId) : null,
                audioUrl: s.asset_id ? musicApi.getAudioUrl(s.asset_id) : null,
                raw: s,
            }));

            setSongs(processedSongs);
        } catch (err) {
            console.error("Error loading album:", err);
            setError("Ошибка загрузки данных альбома");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (song) => {
        if (confirm(`Удалить трек "${song.title}"?`)) {
            try {
                await musicApi.deleteTrack(song.id);
                setSongs(prev => prev.filter(s => s.id !== song.id));
            } catch (err) {
                alert('Не удалось удалить трек');
            }
        }
    };

    const handlePlayAll = () => {
        if (songs.length > 0) {
            selectOrTogglePlaylist(songs, 0);
        }
    };

    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-white" size={32} />
                <span className="ml-3 text-white">Загрузка...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                    onClick={loadAlbumData}
                    className="px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
                >
                    Повторить
                </button>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="text-center py-12">
                <p className="text-white/70">Альбом не найден</p>
            </div>
        );
    }

    const coverUrl = album.asset_id ? musicApi.getAudioUrl(album.asset_id) : null;
    const artistAvatarUrl = artist?.asset_id ? musicApi.getAudioUrl(artist.asset_id) : null;

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/70 hover:text-white transition mb-8"
            >
                <ArrowLeft size={20} />
                <span>Назад</span>
            </button>

            <div className="rounded-3xl p-6 md:p-10 shadow-2xl bg-gradient-to-br from-[#826d9d]/90 to-[#9b8ab1]/80 backdrop-blur-md mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <div className="w-52 h-52 md:w-72 md:h-72 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 shadow-2xl">
                        {coverUrl ? (
                            <img
                                src={coverUrl}
                                alt={album.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                                <Music size={72} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <p className="text-purple-200 text-sm font-medium mb-1 uppercase tracking-wider">
                            Альбом
                        </p>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-1 leading-tight truncate">
                            {album.name}
                        </h1>

                        <div className="flex items-center gap-3 flex-wrap text-purple-100 text-sm mb-3">
                            {artist && (
                                <Link
                                    href={`/artists/${artist.artist_id}`}
                                    className="font-semibold hover:text-white transition hover:underline flex items-center gap-3"
                                >
                                    <span className="w-8 h-8 rounded-full overflow-hidden bg-white/10 inline-block mr-1 flex-shrink-0">
                                        {artistAvatarUrl ? (
                                            <img src={artistAvatarUrl} alt={artist.name} className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/30">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                                                </svg>
                                            </div>
                                        )}
                                    </span>

                                    <span className="truncate">{artist.name}</span>
                                </Link>
                            )}

                            {artist && <span className="text-purple-300">•</span>}

                            <span>{songs.length} {songs.length === 1 ? 'трек' : 'треков'}</span>

                            {totalDuration > 0 && (
                                <>
                                    <span className="text-purple-300">•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatSeconds(totalDuration)}
                                    </span>
                                </>
                            )}
                        </div>

                        {songs.length > 0 && (
                            <div className="mt-1">
                                <button
                                    onClick={handlePlayAll}
                                    className="flex items-center gap-3 px-5 mt-8 mb-10 py-2.5 rounded-full bg-white text-purple-700 font-semibold hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
                                >
                                    <Play size={16} fill="currentColor" />
                                    <span>Слушать</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 mt-6">
                    <div className="rounded-2xl p-0 bg-transparent">
                        {songs.length > 0 ? (
                            <div className="space-y-1 mx-0 md:mx-0">
                                {songs.map((song, index) => (
                                    <TrackItem
                                        key={song.id}
                                        song={song}
                                        playlist={songs}
                                        currentIndex={index}
                                        index={index}
                                        onDelete={handleDelete}
                                        hideCover={true}
                                        albumArtist={song.rawArtistName || artist?.name}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 rounded-lg bg-white/5 backdrop-blur-sm">
                                <Music className="mx-auto mb-4 text-white/30" size={64} strokeWidth={1.5} />
                                <p className="text-white/70 text-lg">В этом альбоме пока нет треков</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}