
const MOCK_TRACKS = [
    { id: 1, title: "Я твой номер один", artist: "Дима Билан", duration: "3:09", cover: "https://picsum.photos/48?random=1", audioUrl: "#" },
    { id: 2, title: "Moscow In Da Club", artist: "Тимати", duration: "2:05", cover: "https://picsum.photos/48?random=2", audioUrl: "#" },
    { id: 3, title: "Небеса", artist: "Владимир Меладзе", duration: "3:56", cover: "https://picsum.photos/48?random=3", audioUrl: "#" },
    { id: 4, title: "П.М.М.Л", artist: "Земфира", duration: "3:37", cover: "https://picsum.photos/48?random=4", audioUrl: "#" },
    { id: 5, title: "sweater weather", artist: "NovaKing", duration: "3:31", cover: "https://picsum.photos/48?random=5", audioUrl: "#" },
    { id: 6, title: "Меня не будет", artist: "ANIKV, SALUKI", duration: "4:15", cover: "https://picsum.photos/48?random=6", audioUrl: "#" },
    { id: 7, title: "ГИМН КАЧКОВ", artist: "maxxytren, bulk_machine", duration: "2:21", cover: "https://picsum.photos/48?random=7", audioUrl: "#" },
    { id: 8, title: "Душа, кайфуй", artist: "Vuska Zippo", duration: "2:56", cover: "https://picsum.photos/48?random=8", audioUrl: "#" },
    { id: 9, title: "Radio", artist: "Rammstein", duration: "4:37", cover: "https://picsum.photos/48?random=9", audioUrl: "#" },
    { id: 10, title: "Отпусти меня", artist: "SEREBRO", duration: "3:53", cover: "https://picsum.photos/48?random=10", audioUrl: "#" },
    { id: 11, title: "Stress", artist: "NEWLIGHTCHILD feat. DONOR", duration: "1:53", cover: "https://picsum.photos/48?random=11", audioUrl: "#" },
    { id: 12, title: "TRAPCITYLIFE", artist: "Миллион О'Войд", duration: "2:03", cover: "https://picsum.photos/48?random=12", audioUrl: "#" },
    { id: 13, title: "liga la sosa", artist: "Платина", duration: "1:59", cover: "https://picsum.photos/48?random=13", audioUrl: "#" },
    { id: 14, title: "Бэйбитрон", artist: "OG BUDA", duration: "2:41", cover: "https://picsum.photos/48?random=14", audioUrl: "#" },
];

const MOCK_PLAYLISTS = [
    {
        id: 1,
        name: "Любимые",
        description: "Мои любимые треки",
        trackIds: [1, 3, 5],
        cover: "https://picsum.photos/200?random=playlist1"
    },
    {
        id: 2,
        name: "Workout",
        description: "Для тренировок",
        trackIds: [7, 14],
        cover: "https://picsum.photos/200?random=playlist2"
    },
];

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

class MockApi {
    constructor() {
        this.tracks = [...MOCK_TRACKS];
        this.playlists = [...MOCK_PLAYLISTS];
        this.nextTrackId = MOCK_TRACKS.length + 1;
        this.nextPlaylistId = MOCK_PLAYLISTS.length + 1;
    }

    async getTracks(params = {}) {
        await delay();
        let result = [...this.tracks];

        // Фильтрация по поиску
        if (params.q) {
            const query = params.q.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.artist.toLowerCase().includes(query)
            );
        }

        return { data: result };
    }

    async getTrack(id) {
        await delay();
        const track = this.tracks.find(t => t.id === parseInt(id));
        if (!track) throw new Error('Track not found');
        return { data: track };
    }

    async searchTracks(query) {
        await delay();
        const q = query.toLowerCase();
        const results = this.tracks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q)
        );
        return { data: results };
    }

    async uploadTrack(formData) {
        await delay(1000);
        const newTrack = {
            id: this.nextTrackId++,
            title: formData.get('title') || 'Новый трек',
            artist: formData.get('artist') || 'Неизвестный артист',
            duration: '3:00',
            cover: 'https://picsum.photos/48?random=' + this.nextTrackId,
            audioUrl: '#',
        };
        this.tracks.push(newTrack);
        return { data: newTrack };
    }

    async deleteTrack(id) {
        await delay();
        const index = this.tracks.findIndex(t => t.id === parseInt(id));
        if (index === -1) throw new Error('Track not found');
        this.tracks.splice(index, 1);

        // Удаляем трек из всех плейлистов
        this.playlists.forEach(playlist => {
            playlist.trackIds = playlist.trackIds.filter(tid => tid !== parseInt(id));
        });

        return { success: true };
    }

    async updateTrack(id, data) {
        await delay();
        const track = this.tracks.find(t => t.id === parseInt(id));
        if (!track) throw new Error('Track not found');
        Object.assign(track, data);
        return { data: track };
    }

    // Плейлисты

    async getPlaylists() {
        await delay();
        return { data: [...this.playlists] };
    }

    async getPlaylist(id) {
        await delay();
        const playlist = this.playlists.find(p => p.id === parseInt(id));
        if (!playlist) throw new Error('Playlist not found');

        // Получаем полные данные треков
        const tracks = playlist.trackIds
            .map(tid => this.tracks.find(t => t.id === tid))
            .filter(Boolean);

        return {
            data: {
                ...playlist,
                tracks,
            }
        };
    }

    async createPlaylist(data) {
        await delay();
        const newPlaylist = {
            id: this.nextPlaylistId++,
            name: data.name || 'Новый плейлист',
            description: data.description || '',
            trackIds: [],
            cover: 'https://picsum.photos/200?random=playlist' + this.nextPlaylistId,
        };
        this.playlists.push(newPlaylist);
        return { data: newPlaylist };
    }

    async updatePlaylist(id, data) {
        await delay();
        const playlist = this.playlists.find(p => p.id === parseInt(id));
        if (!playlist) throw new Error('Playlist not found');
        Object.assign(playlist, data);
        return { data: playlist };
    }

    async deletePlaylist(id) {
        await delay();
        const index = this.playlists.findIndex(p => p.id === parseInt(id));
        if (index === -1) throw new Error('Playlist not found');
        this.playlists.splice(index, 1);
        return { success: true };
    }

    async addTrackToPlaylist(playlistId, trackId) {
        await delay();
        const playlist = this.playlists.find(p => p.id === parseInt(playlistId));
        if (!playlist) throw new Error('Playlist not found');

        const track = this.tracks.find(t => t.id === parseInt(trackId));
        if (!track) throw new Error('Track not found');

        if (!playlist.trackIds.includes(parseInt(trackId))) {
            playlist.trackIds.push(parseInt(trackId));
        }

        return { data: playlist };
    }

    async removeTrackFromPlaylist(playlistId, trackId) {
        await delay();
        const playlist = this.playlists.find(p => p.id === parseInt(playlistId));
        if (!playlist) throw new Error('Playlist not found');

        playlist.trackIds = playlist.trackIds.filter(id => id !== parseInt(trackId));
        return { data: playlist };
    }

    // Утилиты

    getAudioUrl(trackId) {
        return `#mock-audio-${trackId}`;
    }

    getCoverUrl(coverId) {
        return `https://picsum.photos/200?random=${coverId}`;
    }
}

export const mockApi = new MockApi();