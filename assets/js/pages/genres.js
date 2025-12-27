import api from '../api.js';
import ui from '../ui.js';

class GenresPage {
    constructor() {
        this.currentGenre = new URLSearchParams(window.location.search).get('genre');
        this.init();
    }

    async init() {
        ui.showLoader();
        ui.initCommonUI('genres');
        
        try {
            if (this.currentGenre) {
                await this.loadGenreNovels();
            } else {
                await this.loadAllGenres();
            }
        } catch (error) {
            this.showError();
        } finally {
            ui.hideLoader();
        }
    }

    async loadAllGenres() {
        const data = await api.getGenres();
        this.renderGenres(data.data);
    }

    async loadGenreNovels() {
        const data = await api.getGenreNovels(this.currentGenre, 1);
        this.renderGenreNovels(data);
    }

    renderGenres(genres) {
        const container = document.getElementById('genres-container');
        const totalElement = document.getElementById('total-genres');
        
        totalElement.textContent = `${genres.length} Genres Available`;
        container.innerHTML = genres.map(genre => ui.createGenreCard(genre)).join('');
    }

    renderGenreNovels(data) {
        const container = document.getElementById('genres-container');
        const totalElement = document.getElementById('total-genres');
        
        totalElement.textContent = `${data.data.length} Novels in this genre`;
        
        container.innerHTML = `
            <div class="grid grid-3">
                ${data.data.map(novel => `
                    <div class="grid-item">
                        ${ui.createNovelCard(novel, true)}
                    </div>
                `).join('')}
            </div>
            
            ${data.pagination.hasNextPage ? `
                <div class="text-center mt-4" style="grid-column: 1 / -1;">
                    <button onclick="loadMore()" class="btn btn-primary">
                        Load More
                    </button>
                </div>
            ` : ''}
        `;
    }

    showError() {
        const container = document.getElementById('genres-container');
        container.innerHTML = `
            <div class="text-center p-4" style="grid-column: 1 / -1;">
                <h2>Something went wrong</h2>
                <p class="mt-2">Failed to load genres. Please try again.</p>
                <button onclick="location.reload()" class="btn btn-primary mt-3">
                    Retry
                </button>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new GenresPage());
