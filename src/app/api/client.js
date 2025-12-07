const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

class Client {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Методы для работы с треками
    async getTracks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/tracks${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }

    async getTrack(id) {
        return this.request(`/tracks/${id}`);
    }

    async searchTracks(query) {
        return this.request(`/tracks/search?q=${encodeURIComponent(query)}`);
    }

    async uploadTrack(formData) {
        return this.request('/tracks', {
            method: 'POST',
            headers: {},
            body: formData,
        });
    }

    async deleteTrack(id) {
        return this.request(`/tracks/${id}`, {
            method: 'DELETE',
        });
    }

    async updateTrack(id, data) {
        return this.request(`/tracks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Методы для работы с плейлистами
    async getPlaylists() {
        return this.request('/playlists');
    }

    async getPlaylist(id) {
        return this.request(`/playlists/${id}`);
    }

    async createPlaylist(data) {
        return this.request('/playlists', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePlaylist(id, data) {
        return this.request(`/playlists/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deletePlaylist(id) {
        return this.request(`/playlists/${id}`, {
            method: 'DELETE',
        });
    }

    async addTrackToPlaylist(playlistId, trackId) {
        return this.request(`/playlists/${playlistId}/tracks`, {
            method: 'POST',
            body: JSON.stringify({ trackId }),
        });
    }

    async removeTrackFromPlaylist(playlistId, trackId) {
        return this.request(`/playlists/${playlistId}/tracks/${trackId}`, {
            method: 'DELETE',
        });
    }

    // Метод для получения URL аудио файла
    getAudioUrl(trackId) {
        return `${this.baseUrl}/tracks/${trackId}/audio`;
    }

    // Метод для получения URL обложки
    getCoverUrl(coverId) {
        if (!coverId) return null;
        return `${this.baseUrl}/covers/${coverId}`;
    }
}

export const apiClient = new Client(API_BASE_URL);
export { USE_MOCK };