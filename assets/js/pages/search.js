import api from '../api.js';
import ui from '../ui.js';

class SearchPage {
    constructor() {
        this.currentPage = 1;
        this.query = new URLSearchParams(window.location.search).get('q') || '';
        this.sort = new URLSearchParams(window.location.search).get('sort') || 'relevance';
        this.type = new URLSearchParams(window.location.search).get('type') || '';
        this.init();
    }

    async init() {
        ui.showLoader();
        ui.initCommonUI();
        
        // Set search input value
        const searchInput = document.getElementById('search-input');
        if (searchInput && this.query) {
            searchInput.value = this.query;
        }
        
        this.setupFilters();
        this.setupSearchForm();
        
        try {
            if (this.query) {
                await this.performSearch();
            } else {
                this.showEmptyState('Type something to search', 'search');
            }
        } catch (error) {
            console.error('SearchPage Error:', error);
            this.showError();
        } finally {
            ui.hideLoader();
        }
    }

    initLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupSearchForm() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newQuery = searchInput.value.trim();
                if (newQuery && newQuery !== this.query) {
                    this.query = newQuery;
                    this.currentPage = 1;
                    this.updateURL();
                    this.performSearch();
                }
            });
        }
    }

    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        // Set active filter based on URL params
        filterBtns.forEach(btn => {
            if (btn.dataset.sort === this.sort || btn.dataset.type === this.type) {
                btn.classList.add('active');
            }
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (btn.dataset.sort) {
                    this.sort = btn.dataset.sort;
                    this.type = '';
                } else if (btn.dataset.type) {
                    this.type = btn.dataset.type;
                    this.sort = 'relevance';
                }
                
                this.currentPage = 1;
                this.updateURL();
                this.performSearch();
            });
        });
    }

    updateURL() {
        const params = new URLSearchParams();
        if (this.query) params.set('q', this.query);
        if (this.sort && this.sort !== 'relevance') params.set('sort', this.sort);
        if (this.type) params.set('type', this.type);
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }

    async performSearch() {
        if (!this.query.trim()) return;
        
        ui.showLoader();
        
        try {
            const response = await api.searchNovels(this.query, this.currentPage);
            
            if (response.success) {
                this.renderResults(response);
            } else {
                throw new Error('Search failed');
            }
        } catch (error) {
            console.error('Search Error:', error);
            this.showError();
        } finally {
            ui.hideLoader();
            this.initLucideIcons();
        }
    }

    renderResults(data) {
        const queryElement = document.getElementById('search-query');
        const countElement = document.getElementById('results-count');
        const resultsElement = document.getElementById('search-results');
        const paginationElement = document.getElementById('pagination');
        
        // Update query and count
        if (queryElement) {
            queryElement.innerHTML = `
                <i data-lucide="search"></i>
                Search: "${this.query}"
            `;
        }
        
        if (countElement) {
            const totalResults = data.total_results || data.data?.length || 0;
            countElement.innerHTML = totalResults > 0 ? `
                <i data-lucide="check-circle"></i>
                ${totalResults} result${totalResults !== 1 ? 's' : ''} found
            ` : `
                <i data-lucide="x-circle"></i>
                No results found
            `;
        }
        
        // Check if we have results
        if (!data.data || data.data.length === 0) {
            this.showEmptyState('No novels found matching your search', 'search-x');
            if (paginationElement) paginationElement.style.display = 'none';
            this.initLucideIcons();
            return;
        }
        
        // Render results
        if (resultsElement) {
            resultsElement.innerHTML = data.data
                .map(novel => `
                    <div class="grid-item">
                        ${ui.createNovelCard(novel, true)}
                    </div>
                `).join('');
            
            // Add fade-in animation
            setTimeout(() => {
                document.querySelectorAll('.novel-card').forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.05}s`;
                    card.classList.add('fade-in');
                });
            }, 100);
        }
        
        // Render pagination if available
        if (data.pagination && paginationElement) {
            this.renderPagination(data.pagination);
            paginationElement.style.display = 'flex';
        } else if (paginationElement) {
            paginationElement.style.display = 'none';
        }
        
        this.initLucideIcons();
    }

    renderPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        if (!paginationElement) return;
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <a href="#" class="pagination-btn" data-page="${this.currentPage - 1}">
                    <i data-lucide="chevron-left"></i>
                    Previous
                </a>
            `;
        } else {
            paginationHTML += `
                <button class="pagination-btn" disabled>
                    <i data-lucide="chevron-left"></i>
                    Previous
                </button>
            `;
        }
        
        // Page numbers
        const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / 20);
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        // First page
        if (startPage > 1) {
            paginationHTML += `<a href="#" class="pagination-btn" data-page="1">1</a>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-btn" disabled>...</span>`;
            }
        }
        
        // Page range
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="current-page">${i}</span>`;
            } else {
                paginationHTML += `
                    <a href="#" class="pagination-btn" data-page="${i}">${i}</a>
                `;
            }
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-btn" disabled>...</span>`;
            }
            paginationHTML += `<a href="#" class="pagination-btn" data-page="${totalPages}">${totalPages}</a>`;
        }
        
        // Next button
        if (pagination.hasNextPage) {
            paginationHTML += `
                <a href="#" class="pagination-btn" data-page="${this.currentPage + 1}">
                    Next
                    <i data-lucide="chevron-right"></i>
                </a>
            `;
        } else {
            paginationHTML += `
                <button class="pagination-btn" disabled>
                    Next
                    <i data-lucide="chevron-right"></i>
                </button>
            `;
        }
        
        paginationElement.innerHTML = paginationHTML;
        
        // Add event listeners to pagination buttons
        paginationElement.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(link.dataset.page);
                this.performSearch();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        
        this.initLucideIcons();
    }

    showEmptyState(message, iconName = 'search') {
        const resultsElement = document.getElementById('search-results');
        if (resultsElement) {
            resultsElement.innerHTML = `
                <div class="empty-results" style="grid-column: 1 / -1;">
                    <i data-lucide="${iconName}" style="width: 64px; height: 64px;"></i>
                    <h3>${message}</h3>
                    <p>Try different keywords or browse genres</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                        <a href="genres.html" class="btn btn-primary">
                            <i data-lucide="library" style="width: 18px; height: 18px;"></i>
                            Browse Genres
                        </a>
                        <a href="index.html" class="btn btn-secondary">
                            <i data-lucide="home" style="width: 18px; height: 18px;"></i>
                            Go Home
                        </a>
                    </div>
                </div>
            `;
        }
        this.initLucideIcons();
    }

    showError() {
        const resultsElement = document.getElementById('search-results');
        if (resultsElement) {
            resultsElement.innerHTML = `
                <div class="empty-results" style="grid-column: 1 / -1;">
                    <i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #ef4444;"></i>
                    <h3>Search Failed</h3>
                    <p>Please check your connection and try again</p>
                    <button onclick="location.reload()" class="btn btn-primary mt-3" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
                        Retry
                    </button>
                </div>
            `;
        }
        this.initLucideIcons();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new SearchPage());

export default SearchPage;
