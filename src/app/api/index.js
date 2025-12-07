import { apiClient, USE_MOCK } from './client';
import { mockApi } from './mockApi';

// Выбираем API в зависимости от режима
const api = USE_MOCK ? mockApi : apiClient;

// Экспортируем единый интерфейс
export const musicApi = {
    // Треки
    getTracks: (params) => api.getTracks(params),
    getTrack: (id) => api.getTrack(id),
    searchTracks: (query) => api.searchTracks(query),
    uploadTrack: (formData) => api.uploadTrack(formData),
    deleteTrack: (id) => api.deleteTrack(id),
    updateTrack: (id, data) => api.updateTrack(id, data),

    // Плейлисты
    getPlaylists: () => api.getPlaylists(),
    getPlaylist: (id) => api.getPlaylist(id),
    createPlaylist: (data) => api.createPlaylist(data),
    updatePlaylist: (id, data) => api.updatePlaylist(id, data),
    deletePlaylist: (id) => api.deletePlaylist(id),
    addTrackToPlaylist: (playlistId, trackId) => api.addTrackToPlaylist(playlistId, trackId),
    removeTrackFromPlaylist: (playlistId, trackId) => api.removeTrackFromPlaylist(playlistId, trackId),

    // Утилиты
    getAudioUrl: (trackId) => api.getAudioUrl(trackId),
    getCoverUrl: (coverId) => api.getCoverUrl(coverId),
};

export default musicApi;