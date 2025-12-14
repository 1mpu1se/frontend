import authApi from "@/app/api/auth";
import { BACKEND_URL } from "@/config/api";

function getToken() {
    if (typeof authApi.getToken === "function") return authApi.getToken();
    if (typeof authApi.authQuery === "function") {
        const q = authApi.authQuery();
        if (!q) return null;
        const m = q.match(/[?&]token=([^&]+)/);
        return m ? decodeURIComponent(m[1]) : null;
    }
    return null;
}
function appendTokenToPath(path) {
    const t = getToken();
    if (!t) return path;
    return path.includes("?") ? `${path}&token=${encodeURIComponent(t)}` : `${path}?token=${encodeURIComponent(t)}`;
}

function handleJsonResponse(res) {
    if (!res.ok) return res.text().then(t => { throw new Error(t || res.statusText || `HTTP ${res.status}`); });
    return res.json();
}

async function postJson(path, body) {
    const url = appendTokenToPath(`${BACKEND_URL}${path}`);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return handleJsonResponse(res);
}

export async function deleteSong(songId) {
    const url = appendTokenToPath(`${BACKEND_URL}/admin/songs/${encodeURIComponent(songId)}`);
    const res = await fetch(url, {
        method: "DELETE",
    });
    return handleJsonResponse(res);
}

export async function getIndex() {
    // Предотвращаем запрос к бэку, если токена нет
    if (!getToken()) {
        const err = new Error("NO_TOKEN");
        err.code = "NO_TOKEN";
        return Promise.reject(err);
    }

    const url = appendTokenToPath(`${BACKEND_URL}/user/`);
    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return handleJsonResponse(res);
}

export function getAssetUrl(assetId) {
    if (!assetId) return null;
    return appendTokenToPath(`${BACKEND_URL}/user/asset/${encodeURIComponent(assetId)}`);
}

export async function getTracksMapped() {
    let idx;
    try {
        idx = await getIndex();
    } catch (err) {
        if (err && (err.code === "NO_TOKEN" || err.message === "NO_TOKEN")) {
            console.info("getTracksMapped: no auth token — skipping tracks load");
            return [];
        }
        throw err;
    }

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