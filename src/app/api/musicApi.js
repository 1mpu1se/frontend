import authApi from "@/app/api/authApi";
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

async function getJson(path) {
    const url = appendTokenToPath(`${BACKEND_URL}${path}`);
    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return handleJsonResponse(res);
}

async function postJson(path, body) {
    const url = appendTokenToPath(`${BACKEND_URL}${path}`);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return handleJsonResponse(res);
}

async function putJson(path, body) {
    const url = appendTokenToPath(`${BACKEND_URL}${path}`);
    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    return handleJsonResponse(res);
}

async function deleteJson(path) {
    const url = appendTokenToPath(`${BACKEND_URL}${path}`);
    const res = await fetch(url, { method: "DELETE" });
    return handleJsonResponse(res);
}

export async function adminGetUsers(page = 1) {
    return getJson(`/admin/users?page=${page}`);
}
export async function adminGetArtists(page = 1) {
    return getJson(`/admin/artists?page=${page}`);
}
export async function adminGetAlbums(page = 1) {
    return getJson(`/admin/albums?page=${page}`);
}

/* Users */
export async function adminCreateUser(body) {
    return postJson(`/admin/users`, body);
}
export async function adminUpdateUser(userId, body) {
    return putJson(`/admin/users/${encodeURIComponent(userId)}`, body);
}
export async function adminDeleteUser(userId) {
    return deleteJson(`/admin/users/${encodeURIComponent(userId)}`);
}

export async function adminCreateArtist(body) {
    return postJson(`/admin/artists`, body);
}
export async function adminUpdateArtist(artistId, body) {
    return putJson(`/admin/artists/${encodeURIComponent(artistId)}`, body);
}
export async function adminDeleteArtist(artistId) {
    return deleteJson(`/admin/artists/${encodeURIComponent(artistId)}`);
}

/* Albums */
export async function adminCreateAlbum(body) {
    return postJson(`/admin/albums`, body);
}
export async function adminUpdateAlbum(albumId, body) {
    return putJson(`/admin/albums/${encodeURIComponent(albumId)}`, body);
}
export async function adminDeleteAlbum(albumId) {
    return deleteJson(`/admin/albums/${encodeURIComponent(albumId)}`);
}

export function getAssetUrl(assetId) {
    if (!assetId) return null;
    return appendTokenToPath(`${BACKEND_URL}/user/asset/${encodeURIComponent(assetId)}`);
}

export function uploadAssetWithProgress(file, onProgress, ensure_type = "image/png") {
    return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append("file", file);

        const tokenQ = authApi.authQuery();
        const sep = tokenQ ? "&" : "?";
        const url = `${BACKEND_URL}/admin/upload${tokenQ}${sep}ensure_type=${encodeURIComponent(ensure_type)}`;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data.asset);
                } catch (err) {
                    reject(new Error("Ошибка парсинга ответа"));
                }
            } else {
                reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error("Сетевая ошибка"));
        xhr.send(fd);
    });
}

export async function getIndex() {
    if (!getToken()) {
        const err = new Error("NO_TOKEN");
        err.code = "NO_TOKEN";
        return Promise.reject(err);
    }
    return getJson("/user/");
}


export async function getArtist(artistId) {
    return getJson(`/user/artist/${artistId}`);
}

export async function getArtistAlbums(artistId, page = 1) {
    return getJson(`/user/artist/${artistId}/albums?page=${page}`);
}

export async function getAlbum(albumId) {
    return getJson(`/user/album/${albumId}`);
}

export async function getAlbumSongs(albumId, page = 1) {
    return getJson(`/user/album/${albumId}/songs?page=${page}`);
}

export async function getTracksMapped() {
    let idx;
    try {
        idx = await getIndex();
    } catch (err) {
        if (err && (err.code === "NO_TOKEN" || err.message === "NO_TOKEN")) {
            console.info("getTracksMapped: no auth token – skipping tracks load");
            return [];
        }
        throw err;
    }

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
    adminGetUsers,
    adminGetArtists,
    adminGetAlbums,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    adminCreateArtist,
    adminUpdateArtist,
    adminDeleteArtist,
    adminCreateAlbum,
    adminUpdateAlbum,
    adminDeleteAlbum,
    uploadAssetWithProgress,
    getAssetUrl,
    getIndex,
    getArtist,
    getArtistAlbums,
    getAlbum,
    getAlbumSongs,
    getTracks: getTracksMapped,
    getAudioUrl: getAssetUrl,
};