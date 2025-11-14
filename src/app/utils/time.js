export function parseDuration(str) {
    if (!str) return 0;
    const [min, sec] = String(str).split(":").map(Number);
    return (min || 0) * 60 + (sec || 0);
}

export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// Возвращает объект с текущим и общим временем
export function getTrackTime(durationStr, progressPercent = 0) {
    const total = parseDuration(durationStr);
    const current = Math.min(Math.floor((progressPercent / 100) * total), total);
    return {
        current: formatTime(current),
        total: formatTime(total),
    };
}
