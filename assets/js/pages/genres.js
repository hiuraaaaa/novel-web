import api from '../api.js';
import ui from '../ui.js';

class GenresPage {
    constructor() {
        this.currentGenre = new URLSearchParams(window.location.search).get('genre');
        this.allGenres = [];
        this.currentSort = 'name';
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
                this.initSortButtons();
            }
            
            // Initialize search functionality
            this.initSearch();
        } catch (error) {
            console.error('GenresPage Error:', error);
            this.showError();
        } finally {
            ui.hideLoader();
            // Initialize Lucide icons
            this.initLucideIcons();
        }
    }

    initLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadAllGenres() {
        const data = await api.getGenres();
        this.allGenres = data.data || [];
        this.renderGenres(this.allGenres);
    }

    async loadGenreNovels() {
        const data = await api.getGenreNovels(this.currentGenre, 1);
        this.renderGenreNovels(data);
    }

    initSortButtons() {
        const sortButtons = document.querySelectorAll('.filter-btn[data-sort]');
        
        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sortType = button.getAttribute('data-sort');
                this.currentSort = sortType;
                
                // Update active state
                sortButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Sort and render
                this.sortGenres(sortType);
            });
        });
    }

    initSearch() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        
        if (searchForm && searchInput) {
            // Handle form submit
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.filterGenres(searchInput.value.trim());
            });
            
            // Real-time search
            searchInput.addEventListener('input', (e) => {
                this.filterGenres(e.target.value.trim());
            });
        }
    }

    sortGenres(sortType) {
        let sorted = [...this.allGenres];
        
        if (sortType === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortType === 'count') {
            sorted.sort((a, b) => {
                const countA = parseInt(a.count?.replace(/\D/g, '') || '0');
                const countB = parseInt(b.count?.replace(/\D/g, '') || '0');
                return countB - countA;
            });
        }
        
        this.renderGenres(sorted);
        this.initLucideIcons();
    }

    filterGenres(query) {
        if (!query) {
            this.sortGenres(this.currentSort);
            return;
        }
        
        const filtered = this.allGenres.filter(genre => 
            genre.name.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderGenres(filtered, query);
        this.initLucideIcons();
    }

    renderGenres(genres, searchQuery = '') {
        const container = document.getElementById('genres-container');
        const totalElement = document.getElementById('total-genres');
        
        if (genres.length === 0) {
            totalElement.innerHTML = `
                <i data-lucide="search-x" style="width: 16px; height: 16px;"></i>
                ${searchQuery ? `No genres found for "${searchQuery}"` : 'No genres available'}
            `;
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i data-lucide="library" style="width: 64px; height: 64px;"></i>
                    <p>${searchQuery ? `No genres match "${searchQuery}"` : 'No genres available'}</p>
                    ${searchQuery ? `
                        <button onclick="document.getElementById('search-input').value=''; document.getElementById('search-input').dispatchEvent(new Event('input'));" class="btn btn-secondary mt-2">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                            Clear Search
                        </button>
                    ` : ''}
                </div>
            `;
            this.initLucideIcons();
            return;
        }
        
        totalElement.innerHTML = `
            <i data-lucide="book-open" style="width: 16px; height: 16px;"></i>
            ${genres.length} Genre${genres.length !== 1 ? 's' : ''} ${searchQuery ? `matching "${searchQuery}"` : 'Available'}
        `;
        
        container.innerHTML = genres.map(genre => ui.createGenreCard(genre)).join('');
        this.initLucideIcons();
    }

    renderGenreNovels(data) {
        const container = document.getElementById('genres-container');
        const totalElement = document.getElementById('total-genres');
        
        // Hide filter section when viewing genre novels
        const filterSection = document.querySelector('.filter-section');
        if (filterSection) {
            filterSection.style.display = 'none';
        }
        
        totalElement.innerHTML = `
            <i data-lucide="book-open" style="width: 16px; height: 16px;"></i>
            ${data.data.length} Novel${data.data.length !== 1 ? 's' : ''} in this genre
        `;
        
        container.classList.remove('genres-grid');
        container.innerHTML = `
            <div class="grid grid-3">
                ${data.data.map(novel => `
                    <div class="grid-item">
                        ${ui.createNovelCard(novel, true)}
                    </div>
                `).join('')}
            </div>
            
            ${data.pagination && data.pagination.hasNextPage ? `
                <div class="text-center mt-4" style="grid-column: 1 / -1;">
                    <button onclick="genresPage.loadMore()" class="btn btn-primary">
                        <i data-lucide="loader" style="width: 18px; height: 18px;"></i>
                        Load More
                    </button>
                </div>
            ` : ''}
        `;
        
        this.initLucideIcons();
    }

    async loadMore() {
        // Implement pagination logic here
        ui.showToast('Loading more novels...', 'info');
    }

    showError() {
        const container = document.getElementById('genres-container');
        container.innerHTML = `
            <div class="text-center p-4" style="grid-column: 1 / -1;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    <i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #ef4444;"></i>
                </div>
                <h2>Something went wrong</h2>
                <p class="mt-2">Failed to load genres. Please try again.</p>
                <button onclick="location.reload()" class="btn btn-primary mt-3" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
                    Retry
                </button>
            </div>
        `;
        
        this.initLucideIcons();
    }
}

// Initialize and expose globally for onclick handlers
let genresPage;
document.addEventListener('DOMContentLoaded', () => {
    genresPage = new GenresPage();
    window.genresPage = genresPage;
});

export default GenresPage;
