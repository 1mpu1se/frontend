"use client";

import Link from "next/link";
import { Music } from "lucide-react";

export default function AlbumCard({ album, coverUrl, artistName }) {
    return (
        <Link href={`/album/${album.album_id}`}>
            <div className="group cursor-pointer">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white/10 mb-3 relative">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={album.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                            <Music size={60} strokeWidth={1.5} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                <h3 className="text-white font-medium text-center truncate px-2 group-hover:text-purple-200 transition-colors">
                    {album.name}
                </h3>
                {artistName && (
                    <p className="text-purple-200 text-sm text-center truncate px-2 mt-1">
                        {artistName}
                    </p>
                )}
            </div>
        </Link>
    );
}