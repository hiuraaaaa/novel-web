import api from '../api.js';
import ui from '../ui.js';

class ChapterPage {
    constructor() {
        this.slug = new URLSearchParams(window.location.search).get('slug');
        this.chapter = new URLSearchParams(window.location.search).get('chapter');
        this.lightbox = null;
        this.init();
    }

    async init() {
        if (!this.slug || !this.chapter) {
            window.location.href = 'index.html';
            return;
        }
        
        ui.showLoader();
        ui.initCommonUI();
        
        try {
            const data = await api.getChapter(this.slug, this.chapter);
            this.renderChapter(data);
            
            // Add to reading history
            const novelData = {
                slug: this.slug,
                title: data.title.split(' - ')[0],
                image: `https://meionovels.com/wp-content/uploads/2021/03/cover-3.jpg`
            };
            
            ui.addToHistory(novelData, {
                title: data.title,
                slug: this.chapter
            });
            
            this.setupLightbox();
            this.setupReaderSettings();
            this.setupScrollProgress();
            this.setupImageLazyLoading();
        } catch (error) {
            console.error('Chapter loading error:', error);
            this.showError();
        } finally {
            ui.hideLoader();
        }
    }

    renderChapter(data) {
        const titleElement = document.getElementById('chapter-title');
        const contentElement = document.getElementById('chapter-content');
        const navElement = document.getElementById('chapter-navigation');
        
        titleElement.textContent = data.title;
        
        // Proses konten untuk mendeteksi dan render ilustrasi
        contentElement.innerHTML = `
            <div class="fade-in">
                ${this.processChapterContent(data.content)}
            </div>
        `;
        
        if (data.navigation) {
            navElement.innerHTML = ui.createChapterNavigation(data.navigation);
        }
        
        document.title = `${data.title} - MeioNovel`;
    }

    processChapterContent(contentArray) {
        return contentArray.map(item => {
            // Cek apakah ini ilustrasi (berdasarkan URL gambar atau tag khusus)
            if (this.isIllustration(item)) {
                return this.renderIllustration(item);
            }
            // Jika berupa teks biasa
            return `<p class="chapter-text">${item.data}</p>`;
        }).join('');
    }

    isIllustration(item) {
        const data = item.data;
        // Deteksi berdasarkan pola URL gambar
        const imagePattern = /(https?:\/\/.*\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?)/gi;
        
        // Deteksi berdasarkan tag khusus dari API
        if (item.type === 'image' || item.type === 'illustration') {
            return true;
        }
        
        // Deteksi URL gambar dalam teks
        if (typeof data === 'string' && imagePattern.test(data)) {
            return true;
        }
        
        // Deteksi markup HTML dengan tag img
        if (typeof data === 'string' && data.includes('<img')) {
            return true;
        }
        
        return false;
    }

    renderIllustration(item) {
        let imageUrl = '';
        let caption = '';
        
        // Ekstrak URL gambar dan caption dari berbagai format
        if (typeof item.data === 'string') {
            // Jika berupa URL langsung
            const imageMatch = item.data.match(/(https?:\/\/.*\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?)/i);
            if (imageMatch) {
                imageUrl = imageMatch[0];
                caption = item.data.replace(imageMatch[0], '').trim();
            }
            // Jika berupa HTML
            else if (item.data.includes('<img')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(item.data, 'text/html');
                const img = doc.querySelector('img');
                if (img) {
                    imageUrl = img.src;
                    caption = img.alt || img.title || '';
                }
            }
        }
        
        // Jika ada data tambahan dari API
        if (item.imageUrl) {
            imageUrl = item.imageUrl;
        }
        if (item.caption) {
            caption = item.caption;
        }
        
        // Fallback jika tidak ada URL
        if (!imageUrl && item.data) {
            imageUrl = item.data;
        }
        
        // Render ilustrasi
        return `
            <div class="chapter-illustration" data-illustration>
                <div class="illustration-container">
                    <img src="${imageUrl}" 
                         alt="${caption || 'Chapter Illustration'}" 
                         class="illustration-img lazy-load"
                         loading="lazy"
                         onerror="this.classList.add('error'); this.src='assets/images/placeholder-illustration.jpg'">
                    ${caption ? `<div class="illustration-caption">${caption}</div>` : ''}
                </div>
            </div>
        `;
    }

    setupLightbox() {
        // Gunakan lightbox dari window jika sudah diinisialisasi di HTML
        if (window.chapterIllustration) {
            this.lightbox = window.chapterIllustration;
        } else {
            // Fallback lightbox sederhana
            this.setupSimpleLightbox();
        }
        
        // Attach click event untuk semua ilustrasi
        const illustrations = document.querySelectorAll('.illustration-img');
        illustrations.forEach((img, index) => {
            img.addEventListener('click', (e) => {
                e.preventDefault();
                this.openLightbox(img);
            });
            
            // Tambahkan loading animation
            img.addEventListener('load', () => {
                img.classList.remove('loading');
            });
            
            // Set loading state
            if (!img.complete) {
                img.classList.add('loading');
            }
        });
    }

    setupSimpleLightbox() {
        // Create lightbox elements jika belum ada
        if (!document.getElementById('lightbox-modal')) {
            const lightboxHTML = `
                <div class="lightbox-modal" id="lightbox-modal">
                    <button class="lightbox-close" id="lightbox-close">×</button>
                    <div class="lightbox-nav">
                        <button class="lightbox-btn" id="lightbox-prev">‹</button>
                        <button class="lightbox-btn" id="lightbox-next">›</button>
                    </div>
                    <div class="lightbox-content">
                        <img src="" alt="" class="lightbox-img" id="lightbox-img">
                        <div class="lightbox-caption" id="lightbox-caption"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        }
        
        const lightboxModal = document.getElementById('lightbox-modal');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        
        let currentIllustrations = [];
        let currentIndex = 0;
        
        // Open lightbox function
        this.openLightbox = (imgElement) => {
            currentIllustrations = Array.from(document.querySelectorAll('.illustration-img'));
            currentIndex = currentIllustrations.indexOf(imgElement);
            
            if (currentIndex === -1) return;
            
            lightboxImg.src = imgElement.src;
            lightboxCaption.textContent = imgElement.alt || '';
            lightboxModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            this.updateLightboxNav();
        };
        
        // Close lightbox
        const closeLightbox = () => {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        // Navigation
        const prevImage = () => {
            if (currentIndex > 0) {
                currentIndex--;
                lightboxImg.src = currentIllustrations[currentIndex].src;
                lightboxCaption.textContent = currentIllustrations[currentIndex].alt || '';
                this.updateLightboxNav();
            }
        };
        
        const nextImage = () => {
            if (currentIndex < currentIllustrations.length - 1) {
                currentIndex++;
                lightboxImg.src = currentIllustrations[currentIndex].src;
                lightboxCaption.textContent = currentIllustrations[currentIndex].alt || '';
                this.updateLightboxNav();
            }
        };
        
        // Update navigation buttons
        this.updateLightboxNav = () => {
            lightboxPrev.style.display = currentIndex > 0 ? 'flex' : 'none';
            lightboxNext.style.display = currentIndex < currentIllustrations.length - 1 ? 'flex' : 'none';
        };
        
        // Event listeners
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', prevImage);
        lightboxNext.addEventListener('click', nextImage);
        
        // Close on click outside
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightboxModal.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
            }
        });
    }

    setupImageLazyLoading() {
        // Setup Intersection Observer untuk lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            delete img.dataset.src;
                        }
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
            
            // Observe semua gambar dengan class lazy-load
            document.querySelectorAll('.illustration-img.lazy-load').forEach(img => {
                if (!img.src) {
                    img.dataset.src = img.getAttribute('data-src') || img.getAttribute('src');
                    img.removeAttribute('src');
                }
                imageObserver.observe(img);
            });
        }
    }

    setupReaderSettings() {
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        const fontSizeBtns = document.querySelectorAll('.font-size-btn');
        const themeOptions = document.querySelectorAll('.theme-option');
        
        settingsToggle.addEventListener('click', () => {
            settingsPanel.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
                settingsPanel.classList.remove('show');
            }
        });
        
        fontSizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size;
                fontSizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const content = document.querySelector('.chapter-content');
                content.style.fontSize = {
                    small: '0.875rem',
                    medium: '1.125rem',
                    large: '1.375rem'
                }[size];
                
                localStorage.setItem('reader-font-size', size);
            });
        });
        
        const savedSize = localStorage.getItem('reader-font-size') || 'medium';
        const savedBtn = document.querySelector(`[data-size="${savedSize}"]`);
        if (savedBtn) savedBtn.click();
        
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Update theme untuk seluruh halaman termasuk gambar
                this.applyTheme(theme);
                localStorage.setItem('reader-theme', theme);
            });
        });
        
        const savedTheme = localStorage.getItem('reader-theme') || 'light';
        const savedThemeOption = document.querySelector(`[data-theme="${savedTheme}"]`);
        if (savedThemeOption) savedThemeOption.click();
        else {
            this.applyTheme(savedTheme);
        }
    }

    applyTheme(theme) {
        if (theme === 'sepia') {
            document.body.style.backgroundColor = '#f4ecd8';
            document.body.style.color = '#5b4636';
            document.querySelector('.chapter-content').style.backgroundColor = '#f4ecd8';
        } else if (theme === 'dark') {
            document.body.style.backgroundColor = '#0f172a';
            document.body.style.color = '#f1f5f9';
            document.querySelector('.chapter-content').style.backgroundColor = '#0f172a';
            // Update illustration container background
            document.querySelectorAll('.illustration-container').forEach(container => {
                container.style.backgroundColor = '#1e293b';
            });
        } else {
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
            document.querySelector('.chapter-content').style.backgroundColor = '';
            document.querySelectorAll('.illustration-container').forEach(container => {
                container.style.backgroundColor = '';
            });
        }
    }

    setupScrollProgress() {
        const progressFill = document.getElementById('reading-progress');
        
        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            
            const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
            progressFill.style.width = `${Math.min(100, progress)}%`;
        });
    }

    showError() {
        const contentElement = document.getElementById('chapter-content');
        contentElement.innerHTML = `
            <div class="text-center p-4">
                <h2>Chapter Not Found</h2>
                <p class="mt-2">This chapter may not exist or has been removed.</p>
                <a href="novel.html?slug=${this.slug}" class="btn btn-primary mt-3">
                    Back to Novel
                </a>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new ChapterPage());

// Export untuk penggunaan di HTML
window.ChapterPage = ChapterPage;
