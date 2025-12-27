import { CONFIG } from '../../config.js';

class UIHelper {
    constructor() {
        this.history = this.getHistory();
        this.bookmarks = this.getBookmarks();
        this.initializeEventListeners();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            // Handle history nav
            if (e.target.closest('.nav-item[href*="history"]') || 
                e.target.closest('.history-nav') ||
                (e.target.closest('.nav-item') && e.target.closest('.nav-item').querySelector('i')?.textContent === '🕒')) {
                e.preventDefault();
                this.handleHistoryNavClick();
            }
            
            // Handle bookmark nav
            if (e.target.closest('.nav-item[href*="bookmark"]') || 
                e.target.closest('.bookmarks-nav') ||
                (e.target.closest('.nav-item') && e.target.closest('.nav-item').querySelector('i')?.textContent === '🔖')) {
                e.preventDefault();
                this.handleBookmarkNavClick();
            }
        });
    }

    // Navigation handlers
    handleHistoryNavClick() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/index.html')) {
            const historySection = document.getElementById('history');
            if (historySection) {
                historySection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.location.href = 'history.html';
        }
    }

    handleBookmarkNavClick() {
        window.location.href = 'bookmark.html';
    }

    // Loader Management
    showLoader() {
        let loader = document.getElementById('loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loader-overlay';
            loader.innerHTML = `
                <div class="spinner"></div>
                <p class="mt-3">Loading...</p>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }

    // Component Templates
    createNovelCard(novel, isLarge = false) {
        // Clean data
        const cleanData = {
            slug: novel.slug || '',
            title: novel.title || 'Unknown Title',
            image: this.cleanImageUrl(novel.image),
            latestChapter: novel.latestChapter || novel.latest_chapter || '',
            rating: novel.rating || ''
        };

        return `
            <a href="novel.html?slug=${cleanData.slug}" class="novel-card ${isLarge ? 'fade-in' : ''}">
                <img src="${cleanData.image}" 
                     alt="${cleanData.title}"
                     class="novel-card-image"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/150x225/3b82f6/ffffff?text=Novel'">
                <div class="novel-card-content">
                    <h3 class="novel-card-title">${cleanData.title}</h3>
                    ${cleanData.latestChapter ? 
                        `<p class="novel-card-chapter">${cleanData.latestChapter}</p>` : ''}
                    ${cleanData.rating && cleanData.rating !== 'N/A' ? 
                        `<p class="novel-card-rating">⭐ ${cleanData.rating}</p>` : ''}
                </div>
            </a>
        `;
    }

    createGenreCard(genre) {
        const count = genre.count ? genre.count.replace(/\n/g, '').trim() : '0';
        return `
            <a href="genres.html?genre=${genre.slug}" class="genre-card">
                <div class="genre-name">${genre.name}</div>
                <div class="genre-count">${count} Novels</div>
            </a>
        `;
    }

    createHistoryCard(item) {
        return `
            <a href="chapter.html?slug=${item.slug}&chapter=${item.chapterSlug}" class="history-card">
                <img src="${this.cleanImageUrl(item.image)}" 
                     alt="${item.title}"
                     class="history-image"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/50x50/3b82f6/ffffff?text=Novel'">
                <div class="history-content">
                    <h4 class="history-title">${item.title}</h4>
                    <p class="history-chapter">${item.chapter}</p>
                    <p class="history-date">${this.formatDate(item.timestamp)}</p>
                </div>
            </a>
        `;
    }

    createSlider(slides) {
        if (!slides || slides.length === 0) return '';
        
        return `
            <div class="slider-container">
                <div class="slider">
                    ${slides.slice(0, 5).map((slide, index) => `
                        <div class="slide">
                            <img src="${this.cleanImageUrl(slide.image)}" 
                                 alt="${slide.title}"
                                 class="slide-image"
                                 loading="lazy"
                                 onerror="this.onerror=null;this.src='https://via.placeholder.com/800x300/3b82f6/ffffff?text=${encodeURIComponent(slide.title)}'">
                            <div class="slide-overlay">
                                <h2 class="slide-title">${slide.title}</h2>
                                <p class="slide-chapter">${slide.latestChapter}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="slider-nav slider-prev">‹</button>
                <button class="slider-nav slider-next">›</button>
                <div class="slider-dots">
                    ${slides.slice(0, 5).map((_, index) => `
                        <button class="slider-dot ${index === 0 ? 'active' : ''}" 
                                data-index="${index}"></button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    initSlider() {
        const sliderContainer = document.querySelector('.slider-container');
        if (!sliderContainer) return;

        const slider = sliderContainer.querySelector('.slider');
        const slides = sliderContainer.querySelectorAll('.slide');
        const dots = sliderContainer.querySelectorAll('.slider-dot');
        const prevBtn = sliderContainer.querySelector('.slider-prev');
        const nextBtn = sliderContainer.querySelector('.slider-next');

        if (!slider || slides.length === 0) return;

        let currentSlide = 0;
        const totalSlides = slides.length;
        let slideInterval;

        const updateSlider = () => {
            slider.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        };

        const prevSlide = () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        };

        const startAutoSlide = () => {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        };

        // Event Listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                clearInterval(slideInterval);
                prevSlide();
                startAutoSlide();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                clearInterval(slideInterval);
                nextSlide();
                startAutoSlide();
            });
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(slideInterval);
                currentSlide = parseInt(dot.dataset.index);
                updateSlider();
                startAutoSlide();
            });
        });

        // Pause on hover
        sliderContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
        sliderContainer.addEventListener('mouseleave', startAutoSlide);

        // Touch support
        let startX = 0;
        sliderContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            clearInterval(slideInterval);
        });

        sliderContainer.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const threshold = 50;
            if (startX - endX > threshold) nextSlide();
            if (endX - startX > threshold) prevSlide();
            startAutoSlide();
        });

        // Start auto slide
        startAutoSlide();
    }

    createChapterNavigation(nav) {
        if (!nav) return '';
        
        // Extract novel slug safely
        const novelSlug = nav.all ? nav.all.split('/')[0] : '';
        
        return `
            <div class="chapter-navigation">
                ${nav.prev ? `
                    <a href="chapter.html?slug=${nav.prev.split('/')[0]}&chapter=${nav.prev}" 
                       class="btn btn-secondary">
                        ‹ Previous
                    </a>
                ` : '<div style="width: 100px;"></div>'}
                
                ${novelSlug ? `
                    <a href="novel.html?slug=${novelSlug}" class="btn btn-secondary">
                        All Chapters
                    </a>
                ` : '<div style="width: 100px;"></div>'}
                
                ${nav.next ? `
                    <a href="chapter.html?slug=${nav.next.split('/')[0]}&chapter=${nav.next}" 
                       class="btn btn-primary">
                        Next ›
                    </a>
                ` : '<div style="width: 100px;"></div>'}
            </div>
        `;
    }

    // History Management
    addToHistory(novel, chapter) {
        const historyItem = {
            id: `${novel.slug}-${chapter.slug}`,
            title: novel.title || 'Unknown Title',
            slug: novel.slug,
            image: this.cleanImageUrl(novel.image),
            chapter: chapter.title || 'Chapter',
            chapterSlug: chapter.slug,
            timestamp: Date.now()
        };
        
        // Remove duplicate if exists
        this.history = this.history.filter(item => item.id !== historyItem.id);
        
        // Add to beginning and limit to 50 items
        this.history.unshift(historyItem);
        this.history = this.history.slice(0, 50);
        
        // Save and update UI
        this.saveHistory();
        this.updateHistoryUI();
    }

    getHistory() {
        try {
            const history = JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY)) || [];
            return history.filter(item => item.slug && item.title);
        } catch {
            return [];
        }
    }

    saveHistory() {
        localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(this.history));
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all reading history?')) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryUI();
            this.showToast('History cleared successfully', 'info');
        }
    }

    updateHistoryUI() {
        // Update homepage history (single card)
        const homeHistoryContainer = document.getElementById('history-container');
        if (homeHistoryContainer) {
            if (this.history.length === 0) {
                homeHistoryContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No reading history yet</p>
                    </div>
                `;
            } else {
                const latestHistory = this.history[0];
                homeHistoryContainer.innerHTML = this.createHistoryCard(latestHistory);
            }
        }

        // Update history page
        const historyPageContainer = document.getElementById('history-page-container');
        if (historyPageContainer) {
            if (this.history.length === 0) {
                historyPageContainer.innerHTML = `
                    <div class="empty-state">
                        <i>📖</i>
                        <p>No reading history yet</p>
                        <a href="index.html" class="btn btn-primary mt-2">
                            Start Reading
                        </a>
                    </div>
                `;
            } else {
                historyPageContainer.innerHTML = this.history
                    .map(item => this.createHistoryCard(item))
                    .join('');
            }
        }

        // Update count badges
        this.updateNavCounts();
    }

    // Bookmark Management
    toggleBookmark(novel) {
        const bookmarkData = {
            slug: novel.slug || '',
            title: novel.title || 'Unknown Title',
            image: this.cleanImageUrl(novel.image),
            latestChapter: novel.latestChapter || '',
            author: novel.author || '',
            status: novel.status || '',
            rating: novel.rating || '',
            added: Date.now()
        };

        if (!bookmarkData.slug || !bookmarkData.title) {
            this.showToast('Cannot bookmark: Invalid novel data', 'error');
            return false;
        }

        const index = this.bookmarks.findIndex(b => b.slug === bookmarkData.slug);
        
        if (index > -1) {
            // Remove bookmark
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            this.updateBookmarksUI();
            this.showToast('Bookmark removed', 'info');
            return false;
        } else {
            // Add bookmark
            this.bookmarks.unshift(bookmarkData);
            this.saveBookmarks();
            this.updateBookmarksUI();
            this.showToast('Bookmark added', 'success');
            return true;
        }
    }

    isBookmarked(slug) {
        return this.bookmarks.some(b => b.slug === slug);
    }

    getBookmarks() {
        try {
            const bookmarks = JSON.parse(localStorage.getItem(CONFIG.BOOKMARK_KEY)) || [];
            return bookmarks.filter(bookmark => bookmark.slug && bookmark.title);
        } catch {
            return [];
        }
    }

    saveBookmarks() {
        localStorage.setItem(CONFIG.BOOKMARK_KEY, JSON.stringify(this.bookmarks));
    }

    updateBookmarksUI() {
        const bookmarkContainer = document.getElementById('bookmarks-container');
        if (bookmarkContainer) {
            if (this.bookmarks.length === 0) {
                bookmarkContainer.innerHTML = `
                    <div class="empty-state">
                        <i>🔖</i>
                        <p>No bookmarks yet</p>
                        <a href="index.html" class="btn btn-primary mt-2">
                            Browse Novels
                        </a>
                    </div>
                `;
            } else {
                bookmarkContainer.innerHTML = `
                    <div class="bookmarks-grid">
                        ${this.bookmarks.map(bookmark => this.createNovelCard(bookmark)).join('')}
                    </div>
                `;
            }
        }

        // Update count badges
        this.updateNavCounts();
    }

    clearBookmarks() {
        if (confirm('Are you sure you want to clear all bookmarks?')) {
            this.bookmarks = [];
            this.saveBookmarks();
            this.updateBookmarksUI();
            this.showToast('All bookmarks cleared', 'info');
        }
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
        this.setTheme(savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
                this.showToast(`Switched to ${newTheme} mode`, 'info');
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(CONFIG.THEME_KEY, theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            themeToggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
        }
    }

    // Utility Functions
    cleanImageUrl(url) {
        if (!url) return 'https://via.placeholder.com/150x225/3b82f6/ffffff?text=Novel';
        // Remove width specifications from URL
        return url.split(' ')[0];
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        
        if (diff < minute) return 'Just now';
        if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
        if (diff < day) return `${Math.floor(diff / hour)}h ago`;
        if (diff < week) return `${Math.floor(diff / day)}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: diff > 365 * day ? 'numeric' : undefined
        });
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) existingToast.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast-notification';
        
        // Set background color based on type
        const bgColor = type === 'success' ? '#10b981' : 
                       type === 'error' ? '#ef4444' : 
                       type === 'warning' ? '#f59e0b' : 
                       '#3b82f6';
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--hover-shadow);
            z-index: 9999;
            animation: slideUp 0.3s ease;
            max-width: 90%;
            text-align: center;
            font-weight: 500;
        `;
        
        toast.innerHTML = message;
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Navigation helpers
    createBottomNavbar(currentPage = 'home') {
        return `
            <nav class="bottom-navbar">
                <a href="index.html" class="nav-item ${currentPage === 'home' ? 'active' : ''}">
                    <i>🏠</i>
                    <span>Home</span>
                </a>
                <a href="genres.html" class="nav-item ${currentPage === 'genres' ? 'active' : ''}">
                    <i>📚</i>
                    <span>Genres</span>
                </a>
                <a href="history.html" class="nav-item ${currentPage === 'history' ? 'active' : ''}">
                    <i>🕒</i>
                    <span>History</span>
                    ${this.history.length > 0 ? `<span class="history-count">${this.history.length}</span>` : ''}
                </a>
                <a href="bookmark.html" class="nav-item ${currentPage === 'bookmark' ? 'active' : ''}">
                    <i>🔖</i>
                    <span>Bookmark</span>
                    ${this.bookmarks.length > 0 ? `<span class="bookmark-count">${this.bookmarks.length}</span>` : ''}
                </a>
                <a href="profile.html" class="nav-item ${currentPage === 'profile' ? 'active' : ''}">
                    <i>👤</i>
                    <span>Profile</span>
                </a>
            </nav>
        `;
    }

    updateNavCounts() {
        // Update history count badges
        const historyCounts = document.querySelectorAll('.history-count');
        historyCounts.forEach(countBadge => {
            if (this.history.length > 0) {
                countBadge.textContent = this.history.length;
                countBadge.style.display = 'flex';
            } else {
                countBadge.style.display = 'none';
            }
        });

        // Update bookmark count badges
        const bookmarkCounts = document.querySelectorAll('.bookmark-count');
        bookmarkCounts.forEach(countBadge => {
            if (this.bookmarks.length > 0) {
                countBadge.textContent = this.bookmarks.length;
                countBadge.style.display = 'flex';
            } else {
                countBadge.style.display = 'none';
            }
        });
    }

    // Initialize common UI
    initCommonUI(currentPage = 'home') {
        // Add bottom navbar
        if (!document.querySelector('.bottom-navbar')) {
            document.body.insertAdjacentHTML('beforeend', this.createBottomNavbar(currentPage));
        }
        
        // Initialize theme
        this.initTheme();
        
        // Update UI components
        this.updateHistoryUI();
        this.updateBookmarksUI();
        this.updateNavCounts();
        
        // Setup search
        this.setupSearch();
    }

    setupSearch() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            });
        }
    }

    // Cache management
    getCacheSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage.getItem(key).length * 2);
            }
        }
        return (total / 1024 / 1024).toFixed(2);
    }

    clearCache() {
        // Keep essential data
        const keepKeys = [
            CONFIG.HISTORY_KEY,
            CONFIG.BOOKMARK_KEY,
            CONFIG.THEME_KEY,
            CONFIG.USER_KEY,
            'reader-font-size',
            'reader-theme'
        ];
        
        let cleared = 0;
        for (let key in localStorage) {
            if (!keepKeys.includes(key)) {
                localStorage.removeItem(key);
                cleared++;
            }
        }
        
        if (cleared > 0) {
            this.showToast(`Cleared ${cleared} items from cache`, 'info');
        } else {
            this.showToast('No cache to clear', 'info');
        }
    }
}

// Create and export singleton instance
const uiHelper = new UIHelper();
export default uiHelper;
