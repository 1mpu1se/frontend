"use client";

import Link from "next/link";

export default function ArtistCard({ artist, coverUrl }) {
    return (
        <Link href={`/artists/${artist.artist_id}`}>
            <div className="group cursor-pointer">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white/10 mb-3 relative">
                    {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={coverUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                                <path d="M12 14c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/>
                            </svg>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                <h3 className="text-white font-medium text-center truncate px-2 group-hover:text-purple-200 transition-colors">
                    {artist.name}
                </h3>
            </div>
        </Link>
    );
}