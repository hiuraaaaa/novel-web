import { ENDPOINTS } from '../../config.js';

class ApiService {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }

    async fetchWithCache(url) {
        const now = Date.now();
        const cached = this.cache.get(url);
        
        if (cached && (now - cached.timestamp < this.cacheDuration)) {
            return cached.data;
        }

        try {
            console.log('Fetching:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validate response structure
            if (!data.success) {
                throw new Error('API returned unsuccessful response');
            }
            
            this.cache.set(url, {
                data,
                timestamp: now
            });
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Return empty data structure to prevent crashes
            return {
                success: false,
                data: null,
                error: error.message
            };
        }
    }

    async getHome() {
        const data = await this.fetchWithCache(ENDPOINTS.HOME);
        return data;
    }

    async searchNovels(query, page = 1) {
        const data = await this.fetchWithCache(ENDPOINTS.SEARCH(query, page));
        return data;
    }

    async getNovelDetail(slug) {
        const data = await this.fetchWithCache(ENDPOINTS.DETAIL(slug));
        return data;
    }

    async getChapter(slug, chapter) {
        const data = await this.fetchWithCache(ENDPOINTS.CHAPTER(slug, chapter));
        return data;
    }

    async getGenres() {
        const data = await this.fetchWithCache(ENDPOINTS.GENRES);
        return data;
    }

    async getGenreNovels(slug, page = 1) {
        const data = await this.fetchWithCache(ENDPOINTS.GENRE(slug, page));
        return data;
    }

    async getLatest() {
        const data = await this.fetchWithCache(ENDPOINTS.LATEST);
        return data;
    }

    async getPopular() {
        const data = await this.fetchWithCache(ENDPOINTS.POPULAR);
        return data;
    }

    async getNovels(page = 1, orderby = 'latest') {
        const data = await this.fetchWithCache(ENDPOINTS.LIST(page, orderby));
        return data;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
