"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import ArtistCard from "@/components/ArtistCard";
import AlbumCard from "@/components/AlbumCard";
import TrackItem from "@/components/TrackItem";
import { musicApi } from "@/app/api/musicApi";
import { useMusic } from "@/app/MusicContext";
import { useRouter } from "next/navigation";

export default function HomePage() {
    useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);

    // Используем треки из MusicContext вместо загрузки отдельно
    const { songs: allSongs, loading: songsLoading, deleteTrack } = useMusic();
    const songs = allSongs.slice(0, 10);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await musicApi.getIndex();

            const artistsData = (data?.artists || []).slice(0, 5).map(artist => ({
                ...artist,
                coverUrl: artist.asset_id ? musicApi.getAudioUrl(artist.asset_id) : null,
            }));

            const artistsById = {};
            (data?.artists || []).forEach(a => {
                artistsById[a.artist_id] = a;
            });

            const albumsData = (data?.albums || []).slice(0, 5).map(album => {
                const artist = artistsById[album.artist_id];
                return {
                    ...album,
                    coverUrl: album.asset_id ? musicApi.getAudioUrl(album.asset_id) : null,
                    artistName: artist?.name || "Неизвестный",
                };
            });

            setArtists(artistsData);
            setAlbums(albumsData);
            setError(null);
        } catch (err) {
            if (err?.code === "NO_TOKEN" || err?.message === "NO_TOKEN") {
                setArtists([]);
                setAlbums([]);
                setError(null);
                return;
            }
            console.error(err);
            setError("Ошибка загрузки данных");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (song) => {
        if (confirm(`Удалить трек "${song.title}"?`)) {
            try {
                await deleteTrack(song.id);
            } catch (err) {
                alert('Не удалось удалить трек');
            }
        }
    };

    if (loading || songsLoading) {
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
                <p className="text-red-300 mb-4">Ошибка загрузки: {error}</p>
                <button
                    onClick={loadData}
                    className="px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
                >
                    Повторить
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto mt-12">
            {artists.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Свежие исполнители:</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {artists.map(artist => (
                            <ArtistCard
                                key={artist.artist_id}
                                artist={artist}
                                coverUrl={artist.coverUrl}
                            />
                        ))}
                    </div>
                </section>
            )}

            {albums.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Свежие альбомы:</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {albums.map(album => (
                            <AlbumCard
                                key={album.album_id}
                                album={album}
                                coverUrl={album.coverUrl}
                                artistName={album.artistName}
                            />
                        ))}
                    </div>
                </section>
            )}

            {songs.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Свежие треки:</h2>
                    <div className="rounded-3xl p-6 shadow-lg bg-[#826d9d]/80 backdrop-blur-md">
                        <div className="space-y-1 mx-4">
                            {songs.map((song, index) => (
                                <TrackItem
                                    key={song.id}
                                    song={song}
                                    playlist={songs}
                                    currentIndex={index}
                                    index={index}
                                    onDelete={handleDelete}
                                    hideCover={false}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {artists.length === 0 && albums.length === 0 && songs.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-white/70 text-lg">Контент пока не добавлен</p>
                </div>
            )}
        </div>
    );
}