import authApi from "@/app/api/auth";
import { BACKEND_URL } from "@/config/api";

const tokenQuery = () => authApi.authQuery();

function handleJsonResponse(res) {
    if (!res.ok) return res.text().then(t => { throw new Error(t || res.statusText || `HTTP ${res.status}`); });
    return res.json();
}

export function uploadAsset(file, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append("file", file);

        const ensureType = encodeURIComponent(file.type || "application/octet-stream");
        const url = `${BACKEND_URL}/admin/upload${tokenQuery()}&ensure_type=${ensureType}`;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const p = Math.round((e.loaded / e.total) * 100);
                onProgress(p);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    resolve(data);
                } catch (err) {
                    reject(new Error("Не удалось распарсить ответ сервера"));
                }
            } else {
                reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
    });
}

async function postJson(path, body) {
    const res = await fetch(`${BACKEND_URL}${path}${tokenQuery()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return handleJsonResponse(res);
}

export async function createSong({ name, album_id, asset_id }) {
    const body = { name, album_id: Number(album_id), asset_id: Number(asset_id) };
    const data = await postJson("/admin/songs", body);
    return data?.song ?? data;
}

export async function deleteSong(songId) {
    const res = await fetch(`${BACKEND_URL}/admin/songs/${encodeURIComponent(songId)}${tokenQuery()}`, {
        method: "DELETE",
    });
    return handleJsonResponse(res);
}

export async function getIndex() {
    const res = await fetch(`${BACKEND_URL}/user/${tokenQuery()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return handleJsonResponse(res);
}

export function getAssetUrl(assetId) {
    if (!assetId) return null;
    return `${BACKEND_URL}/user/asset/${encodeURIComponent(assetId)}${tokenQuery()}`;
}

export async function getTracksMapped() {
    const idx = await getIndex();

    console.log('Songs from server:', idx.songs);

    const artists = idx?.artists ?? [];
    const albums = idx?.albums ?? [];
    const songs = idx?.songs ?? [];

    const artistsById = {};
    artists.forEach(a => { artistsById[a.artist_id] = a; });

    const albumsById = {};
    albums.forEach(a => { albumsById[a.album_id] = a; });

    return (songs || []).map(s => {
        const album = albumsById[s.album_id] ?? null;
        const artist = album ? artistsById[album.artist_id] : null;
        const coverAssetId = (album && album.asset_id) ? album.asset_id : (artist && artist.asset_id) ? artist.asset_id : null;

        return {
            id: s.song_id,
            title: s.name,
            album_id: s.album_id,
            artist: artist?.name ?? "Неизвестный",
            duration: s.duration ?? null,
            cover: coverAssetId ? getAssetUrl(coverAssetId) : null,
            audioUrl: s.asset_id ? getAssetUrl(s.asset_id) : null,
            raw: s,
        };
    });
}

export const musicApi = {
    getTracks: getTracksMapped,
    getAudioUrl: getAssetUrl,
    deleteTrack: deleteSong,
    getIndex,
};