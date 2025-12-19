"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Music } from "lucide-react";
import AlbumCard from "@/components/AlbumCard";
import { musicApi } from "@/app/api/musicApi";

export default function ArtistPage() {
    const params = useParams();
    const router = useRouter();
    const artistId = params.artistId;

    const [loading, setLoading] = useState(true);
    const [artist, setArtist] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadArtistData();
    }, [artistId]);

    const loadArtistData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Загружаем информацию об артисте
            const artistData = await musicApi.getArtist(artistId);
            setArtist(artistData.artist);

            // Загружаем альбомы артиста
            const albumsData = await musicApi.getArtistAlbums(artistId);

            // Обрабатываем альбомы
            const processedAlbums = (albumsData.items || []).map(album => ({
                ...album,
                coverUrl: album.asset_id ? musicApi.getAudioUrl(album.asset_id) : null,
                artistName: artistData.artist.name,
            }));

            setAlbums(processedAlbums);
        } catch (err) {
            console.error("Error loading artist:", err);
            setError("Ошибка загрузки данных артиста");
        } finally {
            setLoading(false);
        }
    };

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
                    onClick={loadArtistData}
                    className="px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
                >
                    Повторить
                </button>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="text-center py-12">
                <p className="text-white/70">Артист не найден</p>
            </div>
        );
    }

    const coverUrl = artist.asset_id ? musicApi.getAudioUrl(artist.asset_id) : null;

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="rounded-3xl p-6 md:p-10 shadow-2xl bg-gradient-to-br from-[#826d9d]/90 to-[#9b8ab1]/80 backdrop-blur-md mt-20">
                <button
                    onClick={() => router.back()}
                    className="relative z-10 w-10 h-10 mb-5 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all hover:scale-110 shadow-xl"
                >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    {/* Обложка артиста */}
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden bg-white/10 flex-shrink-0 shadow-2xl">
                        {coverUrl ? (
                            <img
                                src={coverUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                                <Music size={80} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>

                    {/* Информация */}
                    <div className="flex-1">
                        <p className="text-purple-200 text-sm font-medium mb-2 uppercase tracking-wider">
                            Исполнитель
                        </p>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            {artist.name}
                        </h1>
                        {artist.biography && (
                            <p className="text-purple-100 text-lg leading-relaxed max-w-3xl">
                                {artist.biography}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Альбомы */}
            {albums.length > 0 ? (
                <section>
                    <h2 className="text-3xl font-bold text-white mt-8 mb-8">
                        Альбомы
                        <span className="ml-3 text-purple-200 text-xl font-normal">
                            {albums.length}
                        </span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
            ) : (
                <div className="text-center py-20 rounded-3xl bg-white/5 backdrop-blur-sm">
                    <Music className="mx-auto mb-4 text-white/30" size={64} strokeWidth={1.5} />
                    <p className="text-white/70 text-lg">У этого артиста пока нет альбомов</p>
                </div>
            )}
        </div>
    );
}