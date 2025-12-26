
// Base URL untuk API
const API_BASE_URL = 'https://www.sankavollerei.com/novel/meionovel';

// Endpoints
const ENDPOINTS = {
    HOME: `${API_BASE_URL}/home`,
    SEARCH: (query, page = 1) => `${API_BASE_URL}/search/${encodeURIComponent(query)}/${page}`,
    DETAIL: (slug) => `${API_BASE_URL}/detail/${slug}`,
    CHAPTER: (slug, chapter) => `${API_BASE_URL}/chapter/${slug}/${chapter}`,
    GENRES: `${API_BASE_URL}/genres`,
    GENRE: (slug, page = 1) => `${API_BASE_URL}/genre/${slug}/${page}`,
    LATEST: `${API_BASE_URL}/latest`,
    POPULAR: `${API_BASE_URL}/popular`,
    LIST: (page = 1, orderby = 'latest') => `${API_BASE_URL}/list?page=${page}&orderby=${orderby}`
};

// Konfigurasi aplikasi
const CONFIG = {
    SITE_NAME: 'MeioNovel',
    VERSION: '1.0.0',
    ITEMS_PER_PAGE: 20,
    HISTORY_KEY: 'novel_reading_history',
    BOOKMARK_KEY: 'novel_bookmarks',
    THEME_KEY: 'novel_theme',
    USER_KEY: 'novel_user'
};

export { API_BASE_URL, ENDPOINTS, CONFIG };
