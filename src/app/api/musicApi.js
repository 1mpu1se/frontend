import authApi from "@/app/api/auth";
import { BACKEND_URL } from "@/config/api";

/**
 * musicApi — thin wrapper around 1mpu1se Swagger endpoints
 *
 * IMPORTANT:
 * - токен берём из authApi.authQuery() (возвращает "?token=...")
 * - для загрузки файлов используем XHR, чтобы иметь прогресс
 */

const tokenQuery = () => authApi.authQuery(); // "?token=..."

function handleJsonResponse(res) {
    if (!res.ok) return res.text().then(t => { throw new Error(t || res.statusText || `HTTP ${res.status}`); });
    return res.json();
}

// Upload with progress using XMLHttpRequest (returns parsed JSON)
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

// JSON POST helper
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
    // возвращаем объект song (внешний вид зависит от бэка: data.song или data)
    return data?.song ?? data;
}

export async function createAlbum({ name, artist_id, asset_id }) {
    const body = { name, artist_id: Number(artist_id), asset_id: Number(asset_id) };
    const data = await postJson("/admin/albums", body);
    return data?.album ?? data;
}

export async function createArtist({ name, biography, asset_id }) {
    const body = { name, biography, asset_id: Number(asset_id) };
    const data = await postJson("/admin/artists", body);
    return data?.artist ?? data;
}

export async function deleteSong(songId) {
    const res = await fetch(`${BACKEND_URL}/admin/songs/${encodeURIComponent(songId)}${tokenQuery()}`, {
        method: "DELETE",
    });
    return handleJsonResponse(res);
}

// Получить список "индекс" (artists, albums, songs)
// Используем /user/ — он возвращает до 10 последних, но это самый прямой endpoint из Swagger
export async function getIndex() {
    const res = await fetch(`${BACKEND_URL}/user/${tokenQuery()}`, { method: "GET", headers: { "Content-Type": "application/json" } });
    return handleJsonResponse(res);
}

// Поиск: GET /user/search?q=...
export async function searchIndex(q) {
    const url = `${BACKEND_URL}/user/search${tokenQuery()}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
    return handleJsonResponse(res);
}

// Helper: формирует доступный по src URL для вложений (аудио/обложки)
export function getAssetUrl(assetId) {
    if (!assetId) return null;
    return `${BACKEND_URL}/user/asset/${encodeURIComponent(assetId)}${tokenQuery()}`;
}

/**
 * Преобразование ответа /user/ (artists, albums, songs) в UI-формат:
 * { id, title, artist, duration, cover, audioUrl, raw }
 */
export async function getTracksMapped() {
    const idx = await getIndex();

    console.log('Songs from server:', idx.songs); // <- здесь

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
    createSong,
    deleteTrack: deleteSong,
};
