import api from '../api.js';
import ui from '../ui.js';

class HomePage {
    constructor() {
        this.init();
    }

    async init() {
        ui.showLoader();
        ui.initCommonUI('home');
        
        try {
            const response = await api.getHome();
            
            if (response.success && response.data) {
                this.renderPage(response.data);
                // Inisialisasi fungsi slider (event listener klik, dll) setelah HTML dirender
                ui.initSlider();
            } else {
                throw new Error('Failed to load homepage data');
            }
        } catch (error) {
            console.error('HomePage Error:', error);
            this.showError();
        } finally {
            ui.hideLoader();
        }
    }

    renderPage(data) {
        // --- 1. Render Slider Banner ---
        if (data.slider && data.slider.length > 0) {
            const sliderContainer = document.getElementById('hero-slider');
            if (sliderContainer) {
                // Hapus efek loading skeleton sebelum memasukkan konten
                sliderContainer.classList.remove('skeleton');
                sliderContainer.style.height = 'auto'; // Biarkan tinggi menyesuaikan CSS slider
                
                const sliderHTML = ui.createSlider(data.slider);
                sliderContainer.innerHTML = sliderHTML;
            }
        }

        // --- 2. Render Latest Updates ---
        const latestContainer = document.getElementById('latest-updates');
        if (latestContainer && data.latestUpdates && data.latestUpdates.length > 0) {
            // Bersihkan skeleton yang ada di dalam grid
            latestContainer.innerHTML = ''; 
            
            const latestHTML = data.latestUpdates
                .slice(0, 6)
                .map(novel => `
                    <div class="grid-item">
                        ${ui.createNovelCard(novel, true)}
                    </div>
                `).join('');
            
            latestContainer.innerHTML = latestHTML;
        }

        // --- 3. Render Popular Novels ---
        const popularContainer = document.getElementById('popular-novels');
        if (popularContainer && data.popular && data.popular.length > 0) {
            // Bersihkan skeleton
            popularContainer.innerHTML = '';
            
            const popularHTML = data.popular
                .slice(0, 6)
                .map(novel => `
                    <div class="grid-item">
                        ${ui.createNovelCard(novel)}
                    </div>
                `).join('');
            
            popularContainer.innerHTML = popularHTML;
        }

        // --- 4. Initialize Lucide Icons ---
        this.initializeIcons();

        // --- 5. Animasi Fade-In ---
        setTimeout(() => {
            document.querySelectorAll('.novel-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('fade-in');
                // Pastikan class skeleton pada card individual juga hilang jika ada
                card.classList.remove('skeleton');
            });
        }, 100);
    }

    initializeIcons() {
        // Re-initialize Lucide icons after dynamic content is loaded
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    showError() {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="text-center p-4">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">
                        <i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #ef4444;"></i>
                    </div>
                    <h2>Gagal Memuat Konten</h2>
                    <p class="mt-2">Periksa koneksi internet Anda atau coba lagi nanti.</p>
                    <button onclick="location.reload()" class="btn btn-primary mt-3" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
                        Coba Lagi
                    </button>
                </div>
            `;
            
            // Initialize icons in error message
            this.initializeIcons();
        }
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new HomePage());
} else {
    new HomePage();
}
