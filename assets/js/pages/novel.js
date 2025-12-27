import api from '../api.js';
import ui from '../ui.js';

class NovelPage {
    constructor() {
        this.slug = new URLSearchParams(window.location.search).get('slug');
        this.init();
    }

    async init() {
        if (!this.slug) {
            window.location.href = 'index.html';
            return;
        }
        
        ui.showLoader();
        ui.initCommonUI();
        
        try {
            const data = await api.getNovelDetail(this.slug);
            this.renderNovel(data.data);
        } catch (error) {
            this.showError();
        } finally {
            ui.hideLoader();
        }
    }

    renderNovel(novel) {
        const container = document.getElementById('novel-details');
        const isBookmarked = ui.isBookmarked(this.slug);
        
        container.innerHTML = `
            <!-- Novel Header -->
            <div class="novel-header fade-in">
                <div class="novel-cover">
                    <img src="${ui.cleanImageUrl(novel.image)}" 
                         alt="${novel.title}"
                         loading="lazy"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/200x300/3b82f6/ffffff?text=${encodeURIComponent(novel.title)}'">
                </div>
                <div class="novel-info">
                    <h1 class="novel-title">${novel.title}</h1>
                    
                    <div class="novel-meta">
                        ${novel.rating && novel.rating !== 'N/A' ? `
                            <div class="meta-item">
                                <span>⭐</span>
                                <span>${novel.rating}</span>
                            </div>
                        ` : ''}
                        
                        ${novel.status ? `
                            <div class="meta-item">
                                <span>📊</span>
                                <span>${novel.status}</span>
                            </div>
                        ` : ''}
                        
                        ${novel.author ? `
                            <div class="meta-item">
                                <span>✍️</span>
                                <span>${novel.author}</span>
                            </div>
                        ` : ''}
                        
                        ${novel.release ? `
                            <div class="meta-item">
                                <span>📅</span>
                                <span>${novel.release}</span>
                            </div>
                        ` : ''}
                        
                        ${novel.type ? `
                            <div class="meta-item">
                                <span>📖</span>
                                <span>${novel.type}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Genre Tags -->
                    ${novel.genres && novel.genres.length > 0 ? `
                        <div class="genre-tags">
                            ${novel.genres.map(genre => `
                                <a href="genres.html?genre=${genre.slug}" class="genre-tag">
                                    ${genre.name}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Action Buttons -->
                    <div class="novel-actions">
                        ${novel.chapters && novel.chapters.length > 0 ? `
                            <a href="chapter.html?slug=${this.slug}&chapter=${novel.chapters[0].slug}" 
                               class="btn btn-primary">
                                📖 Read First
                            </a>
                        ` : ''}
                        
                        <button id="bookmark-btn" class="btn ${isBookmarked ? 'btn-primary' : 'btn-secondary'}">
                            ${isBookmarked ? '❤️ Bookmarked' : '🤍 Bookmark'}
                        </button>
                        
                        ${novel.chapters && novel.chapters.length > 0 ? `
                            <a href="chapter.html?slug=${this.slug}&chapter=${novel.chapters[novel.chapters.length - 1].slug}" 
                               class="btn btn-secondary">
                                📚 Read Latest
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Synopsis -->
            ${novel.synopsis ? `
                <div class="synopsis fade-in">
                    <h3>Synopsis</h3>
                    <p>${novel.synopsis.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            <!-- Chapters List -->
            ${novel.chapters && novel.chapters.length > 0 ? `
                <div class="chapters-section fade-in">
                    <div class="section-header">
                        <h3 class="section-title">Chapters (${novel.chapters.length})</h3>
                    </div>
                    
                    <div class="chapters-list">
                        ${novel.chapters.slice(0, 20).map(chapter => `
                            <a href="chapter.html?slug=${this.slug}&chapter=${chapter.slug}" 
                               class="chapter-item">
                                <span class="chapter-title">${chapter.title}</span>
                                ${chapter.date ? `
                                    <span class="chapter-date">${chapter.date}</span>
                                ` : ''}
                            </a>
                        `).join('')}
                    </div>
                    
                    ${novel.chapters.length > 20 ? `
                        <div class="show-more">
                            <a href="#" id="show-all-chapters" class="btn btn-secondary">
                                Show All Chapters (${novel.chapters.length})
                            </a>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Related Novels -->
            ${novel.related && novel.related.length > 0 ? `
                <div class="related-section fade-in">
                    <h3 class="section-title">Related Novels</h3>
                    <div class="related-grid">
                        ${novel.related.slice(0, 4).map(related => `
                            <div class="grid-item">
                                ${ui.createNovelCard(related)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Popular Novels -->
            ${novel.popular && novel.popular.length > 0 ? `
                <div class="related-section fade-in">
                    <h3 class="section-title">Popular Novels</h3>
                    <div class="related-grid">
                        ${novel.popular.slice(0, 4).map(popular => `
                            <div class="grid-item">
                                ${ui.createNovelCard(popular)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        this.addEventListeners(novel);
        
        setTimeout(() => {
            document.querySelectorAll('.fade-in').forEach((element, index) => {
                element.style.animationDelay = `${index * 0.1}s`;
            });
        }, 100);
    }

    addEventListeners(novel) {
        // Bookmark button
        const bookmarkBtn = document.getElementById('bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                const isBookmarked = ui.toggleBookmark({
                    slug: this.slug,
                    title: novel.title,
                    image: novel.image,
                    latestChapter: novel.chapters?.[0]?.title || '',
                    author: novel.author || '',
                    status: novel.status || '',
                    rating: novel.rating || ''
                });
                
                bookmarkBtn.classList.toggle('btn-primary', isBookmarked);
                bookmarkBtn.classList.toggle('btn-secondary', !isBookmarked);
                bookmarkBtn.innerHTML = isBookmarked ? 
                    '❤️ Bookmarked' : '🤍 Bookmark';
            });
        }
        
        // Show all chapters
        const showAllBtn = document.getElementById('show-all-chapters');
        if (showAllBtn && novel.chapters) {
            showAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const chaptersList = document.querySelector('.chapters-list');
                chaptersList.innerHTML = novel.chapters.map(chapter => `
                    <a href="chapter.html?slug=${this.slug}&chapter=${chapter.slug}" 
                       class="chapter-item">
                        <span class="chapter-title">${chapter.title}</span>
                        ${chapter.date ? `
                            <span class="chapter-date">${chapter.date}</span>
                        ` : ''}
                    </a>
                `).join('');
                chaptersList.style.maxHeight = 'none';
                showAllBtn.style.display = 'none';
            });
        }
    }

    showError() {
        const container = document.getElementById('novel-details');
        container.innerHTML = `
            <div class="text-center p-4">
                <h2>Novel Not Found</h2>
                <p class="mt-2">The novel you're looking for doesn't exist or has been removed.</p>
                <a href="index.html" class="btn btn-primary mt-3">
                    Back to Home
                </a>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new NovelPage());
