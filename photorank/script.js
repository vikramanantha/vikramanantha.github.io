// Photo Ranker - ELO Rating System with Categories
document.addEventListener('DOMContentLoaded', () => {
    const INITIAL_RATING = 1500;
    const K_FACTOR = 32;

    // Store category data with original metadata
    const categories = new Map();
    let currentCategory = "Vik's Picks";
    let currentPair = null;
    let metaData = null; // Store meta-data for export

    // Initialize
    loadPhotos();

    async function loadPhotos() {
        try {
            const response = await fetch('../photos/photo_data.json');
            const config = await response.json();

            // Store meta-data if it exists
            if (config['meta-data']) {
                metaData = config['meta-data'];
            }

            // Initialize categories - store original metadata
            for (const [category, photoDataArray] of Object.entries(config)) {
                // Skip meta-data section
                if (category === 'meta-data') {
                    continue;
                }

                // Ensure it's an array before processing
                if (!Array.isArray(photoDataArray)) {
                    continue;
                }

                const photos = photoDataArray.map(photoData => {
                    // Treat -1 as new/unranked photo - use initial rating
                    // Also handle undefined/null/0 or other falsy values as new photos
                    const savedElo = photoData.elo;
                    const isNewPhoto = savedElo === -1 || savedElo === null || savedElo === undefined;
                    const startingRating = isNewPhoto ? INITIAL_RATING : savedElo;
                    
                    return {
                        path: photoData.path,
                        // Use saved ELO rating if valid (>0), otherwise treat as new and use initial rating
                        rating: startingRating,
                        name: photoData.what || photoData.path.split('/').pop() || photoData.path,
                        // Store original metadata for export
                        // If it was -1, we don't preserve that in originalData since we're treating it as unranked
                        originalData: {
                            path: photoData.path,
                            what: photoData.what,
                            where: photoData.where,
                            when: photoData.when
                            // Note: We don't preserve -1 in originalData since it means "unranked"
                            // The current rating will be exported instead
                        }
                    };
                });

                categories.set(category, {
                    photos: photos,
                    comparisons: [],
                    comparisonCount: 0
                });
            }

            hideLoading();
            startComparison();
        } catch (error) {
            console.error('Error loading photos:', error);
            const loadingEl = document.getElementById('loading-message');
            if (loadingEl) {
                loadingEl.innerHTML = '<p style="color: var(--color-accent);">Error loading photos. Please refresh the page.</p>';
            }
        }
    }

    function hideLoading() {
        const loadingEl = document.getElementById('loading-message');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    function initializeEventListeners() {
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const tieBtn = document.getElementById('tie-btn');
        const skipBtn = document.getElementById('skip-btn');
        const finishBtn = document.getElementById('finish-btn');
        const resetBtn = document.getElementById('reset-btn');
        const resetFromResultsBtn = document.getElementById('reset-from-results-btn');
        const downloadBtn = document.getElementById('download-rankings-btn');
        const downloadPhotoDataBtn = document.getElementById('download-photo-data-btn');

        if (leftBtn) leftBtn.addEventListener('click', () => recordComparison('left'));
        if (rightBtn) rightBtn.addEventListener('click', () => recordComparison('right'));
        if (tieBtn) tieBtn.addEventListener('click', () => recordComparison('tie'));
        if (skipBtn) skipBtn.addEventListener('click', loadNextPair);
        if (finishBtn) finishBtn.addEventListener('click', showResults);
        if (resetBtn) resetBtn.addEventListener('click', resetCurrentCategory);
        if (resetFromResultsBtn) resetFromResultsBtn.addEventListener('click', resetCurrentCategory);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadRankings);
        if (downloadPhotoDataBtn) downloadPhotoDataBtn.addEventListener('click', downloadPhotoData);

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                if (category) {
                    switchCategory(category);
                }
            });
        });
    }

    function switchCategory(category) {
        if (!categories.has(category)) return;

        currentCategory = category;

        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Hide results if showing
        const resultsSection = document.getElementById('results-section');
        if (resultsSection && resultsSection.style.display !== 'none') {
            backToComparison();
        }

        updateProgress();
        loadNextPair();
    }

    function backToComparison() {
        const comparisonSection = document.getElementById('comparison-section');
        const resultsSection = document.getElementById('results-section');

        if (comparisonSection) comparisonSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';

        updateProgress();
        loadNextPair();
    }

    function startComparison() {
        const comparisonSection = document.getElementById('comparison-section');
        if (comparisonSection) comparisonSection.style.display = 'block';

        initializeEventListeners();
        updateProgress();
        loadNextPair();
    }

    function getMinComparisons() {
        const categoryData = categories.get(currentCategory);
        if (!categoryData) return 10;
        return Math.max(10, categoryData.photos.length * 2);
    }

    function loadNextPair() {
        const categoryData = categories.get(currentCategory);
        if (!categoryData || categoryData.photos.length < 2) return;

        // Select two random different photos
        const idx1 = Math.floor(Math.random() * categoryData.photos.length);
        let idx2 = Math.floor(Math.random() * categoryData.photos.length);
        
        while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * categoryData.photos.length);
        }

        currentPair = [idx1, idx2];

        const leftImg = document.getElementById('photo-left');
        const rightImg = document.getElementById('photo-right');

        if (leftImg) leftImg.src = categoryData.photos[idx1].path;
        if (rightImg) rightImg.src = categoryData.photos[idx2].path;
    }

    function calculateExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    function recordComparison(choice) {
        if (!currentPair) return;

        const categoryData = categories.get(currentCategory);
        if (!categoryData) return;

        const [idx1, idx2] = currentPair;
        const photo1 = categoryData.photos[idx1];
        const photo2 = categoryData.photos[idx2];

        const rating1Before = photo1.rating;
        const rating2Before = photo2.rating;

        // Calculate expected scores
        const expected1 = calculateExpectedScore(rating1Before, rating2Before);
        const expected2 = calculateExpectedScore(rating2Before, rating1Before);

        // Determine actual scores
        let score1, score2;
        if (choice === 'left') {
            score1 = 1;
            score2 = 0;
        } else if (choice === 'right') {
            score1 = 0;
            score2 = 1;
        } else {
            score1 = 0.5;
            score2 = 0.5;
        }

        // Update ratings
        photo1.rating = rating1Before + K_FACTOR * (score1 - expected1);
        photo2.rating = rating2Before + K_FACTOR * (score2 - expected2);

        // Record comparison
        categoryData.comparisons.push({
            photo1: photo1.name,
            photo2: photo2.name,
            winner: choice,
            rating1Before: rating1Before,
            rating2Before: rating2Before,
            rating1After: photo1.rating,
            rating2After: photo2.rating
        });

        categoryData.comparisonCount++;
        updateProgress();
        loadNextPair();
    }

    function updateProgress() {
        const categoryData = categories.get(currentCategory);
        if (!categoryData) return;

        const countEl = document.getElementById('comparison-count');
        const minEl = document.getElementById('min-comparisons');
        const progressFill = document.getElementById('progress-fill');
        const finishBtn = document.getElementById('finish-btn');

        const minComparisons = getMinComparisons();

        if (countEl) countEl.textContent = categoryData.comparisonCount.toString();
        if (minEl) minEl.textContent = minComparisons.toString();

        const progress = Math.min(100, (categoryData.comparisonCount / minComparisons) * 100);
        if (progressFill) progressFill.style.width = `${progress}%`;

        if (finishBtn) {
            finishBtn.disabled = categoryData.comparisonCount < minComparisons;
        }
    }

    function showResults() {
        const comparisonSection = document.getElementById('comparison-section');
        const resultsSection = document.getElementById('results-section');

        if (comparisonSection) comparisonSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';

        renderResults();
    }

    function renderResults() {
        const categoryData = categories.get(currentCategory);
        if (!categoryData) return;

        const statsEl = document.getElementById('results-stats');
        const listEl = document.getElementById('rankings-list');

        if (!statsEl || !listEl) return;

        // Sort photos by rating
        const rankedPhotos = [...categoryData.photos].sort((a, b) => b.rating - a.rating);

        // Display stats
        statsEl.innerHTML = `
            <p><strong>Category:</strong> ${currentCategory}</p>
            <p><strong>Total Photos:</strong> ${categoryData.photos.length}</p>
            <p><strong>Comparisons Made:</strong> ${categoryData.comparisonCount}</p>
            <p><strong>Rating Range:</strong> ${Math.round(rankedPhotos[rankedPhotos.length - 1].rating)} - ${Math.round(rankedPhotos[0].rating)} ELO</p>
        `;

        // Display rankings
        listEl.innerHTML = '';
        rankedPhotos.forEach((photo, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'photorank-rank-item';

            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const rankClass = index < 3 ? 'top-three' : '';

            rankItem.innerHTML = `
                <div class="photorank-rank-number ${rankClass}">
                    ${medal} #${index + 1}
                </div>
                <div class="photorank-rank-photo">
                    <img src="${photo.path}" alt="${photo.name}">
                </div>
                <div class="photorank-rank-info">
                    <div class="photorank-rank-name">${photo.name}</div>
                    <div class="photorank-rank-rating">ELO: ${Math.round(photo.rating)}</div>
                </div>
            `;

            listEl.appendChild(rankItem);
        });
    }

    function downloadRankings() {
        const categoryData = categories.get(currentCategory);
        if (!categoryData) return;

        const rankedPhotos = [...categoryData.photos].sort((a, b) => b.rating - a.rating);

        const data = {
            category: currentCategory,
            timestamp: new Date().toISOString(),
            totalPhotos: categoryData.photos.length,
            totalComparisons: categoryData.comparisonCount,
            initialRating: INITIAL_RATING,
            kFactor: K_FACTOR,
            rankings: rankedPhotos.map((photo, index) => ({
                rank: index + 1,
                name: photo.name,
                path: photo.path,
                rating: Math.round(photo.rating)
            })),
            comparisons: categoryData.comparisons
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const categoryName = currentCategory.replace(/\s+/g, '_');
        a.download = `photo_rankings_${categoryName}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadPhotoData() {
        // Build the photo_data.json structure with photos sorted by ELO rating
        const photoData = {};

        // Include meta-data first if it exists
        if (metaData) {
            photoData['meta-data'] = metaData;
        }

        for (const [category, categoryData] of categories.entries()) {
            // Sort photos by rating (highest first)
            const sortedPhotos = [...categoryData.photos].sort((a, b) => b.rating - a.rating);
            
            // Use the originalData that was stored when loading
            photoData[category] = sortedPhotos.map(photo => {
                // Use originalData if available, otherwise construct from what we have
                if (photo.originalData) {
                    return {
                        path: photo.originalData.path,
                        what: photo.originalData.what,
                        where: photo.originalData.where,
                        when: photo.originalData.when,
                        elo: Math.round(photo.rating)
                    };
                } else {
                    // Fallback if originalData wasn't stored (shouldn't happen)
                    console.warn('Missing originalData for photo:', photo);
                    return {
                        path: photo.path,
                        what: photo.name,
                        where: '',
                        when: '',
                        elo: Math.round(photo.rating)
                    };
                }
            });
        }

        // Download as JSON file
        const blob = new Blob([JSON.stringify(photoData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo_data_ranked_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function resetCurrentCategory() {
        const categoryData = categories.get(currentCategory);
        if (!categoryData) return;

        // Reset ratings and comparisons
        categoryData.photos.forEach(photo => {
            photo.rating = INITIAL_RATING;
        });
        categoryData.comparisons = [];
        categoryData.comparisonCount = 0;

        backToComparison();
    }
});

