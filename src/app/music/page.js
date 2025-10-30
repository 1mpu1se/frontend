"use client";

import React, { useState } from 'react';
import { Search, Play, MoreVertical } from 'lucide-react';

export default function MusicPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const songs = [
        { id: 1, title: 'Я твой номер один', artist: 'Дима Билан', duration: '3:09' },
        { id: 2, title: 'Moscow In Da Club', artist: 'Тимати', duration: '2:05' },
        { id: 3, title: 'Небеса', artist: 'Владимир Меладзе', duration: '3:56' },
        { id: 4, title: 'П.М.М.Л', artist: 'Земфира', duration: '3:37' },
        { id: 5, title: 'sweater weather', artist: 'NovaKing', duration: '3:31' },
        { id: 6, title: 'Меня не будет', artist: 'ANIKV, SALUKI', duration: '4:15' },
        { id: 7, title: 'ГИМН КАЧКОВ', artist: 'maxxytren, bulk_machine', duration: '2:21' },
        { id: 8, title: 'Душа, кайфуй', artist: 'Vuska Zippo', duration: '2:56' },
        { id: 9, title: 'Radio', artist: 'Rammstein', duration: '4:37' },
    ];

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Поиск музыки"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#826d9d]"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                    />
                </div>
            </div>

            {/* Song List */}
            <div className="max-w-6xl mx-auto">
                <div className="rounded-3xl p-6 shadow-lg" style={{ backgroundColor: '#826d9d' }}>
                    <div className="space-y-1">
                        {filteredSongs.map((song) => (
                            <div
                                key={song.id}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-purple-400 hover:bg-opacity-30 transition cursor-pointer group"
                            >
                                <button className="text-white hover:scale-110 transition">
                                    <Play size={20} fill="white" />
                                </button>

                                <div className="flex-1">
                                    <h3 className="text-white font-medium">{song.title}</h3>
                                    <p className="text-purple-200 text-sm">{song.artist}</p>
                                </div>

                                <span className="text-white text-sm">{song.duration}</span>

                                <button className="text-white opacity-0 group-hover:opacity-100 transition">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}