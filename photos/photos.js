// State management
let currentView = 'banners';
let currentCategory = null;
let photoData = {};
// DOM elements (will be initialized in init function)
let portfolioContainer = null;
let lightboxOverlay = null;
let lightboxImage = null;
let lightboxCaption = null;
let lightboxClose = null;
let onlinePortfoliosSection = null;
// Utility: preload image and resolve when loaded
function preloadImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image: ${imageUrl}`));
        img.src = imageUrl;
    });
}
// Initialize the application
async function init() {
    // Initialize DOM elements after DOM is ready
    portfolioContainer = document.getElementById('photo-portfolio-container');
    lightboxOverlay = document.getElementById('lightbox-overlay');
    lightboxImage = document.getElementById('lightbox-image');
    lightboxCaption = document.getElementById('lightbox-caption');
    lightboxClose = document.getElementById('lightbox-close');
    onlinePortfoliosSection = document.getElementById('online-portfolios-section');
    console.log('Photo Portfolio Init - Container found:', !!portfolioContainer);
    if (!portfolioContainer) {
        console.error('Photo portfolio container not found!');
        return;
    }
    await loadPhotoData();
    console.log('Photo data loaded:', Object.keys(photoData));
    setupLightbox();
    renderBannerView();
}
// Load photo data from JSON
async function loadPhotoData() {
    try {
        const response = await fetch('photo_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        photoData = await response.json();
    }
    catch (error) {
        console.error('Error loading photo data:', error);
        if (portfolioContainer) {
            portfolioContainer.innerHTML = '<p style="color: red; text-align: center;">Could not load photo portfolio data. Please check photo_data.json.</p>';
        }
    }
}
// Create banner view (main landing page)
function renderBannerView() {
    console.log('renderBannerView called');
    if (!portfolioContainer) {
        console.error('portfolioContainer is null in renderBannerView');
        return;
    }
    currentView = 'banners';
    currentCategory = null;
    portfolioContainer.innerHTML = '';
    // Show online portfolios section
    if (onlinePortfoliosSection) {
        onlinePortfoliosSection.style.display = 'block';
    }
    // Create banners container
    const bannersContainer = document.createElement('div');
    bannersContainer.className = 'photo-banners-container';
    console.log('Created banners container');
    let bannerCount = 0;
    // Iterate through categories
    for (const category in photoData) {
        if (category === 'meta-data')
            continue;
        const photos = photoData[category];
        if (!Array.isArray(photos) || photos.length === 0) {
            console.log(`Skipping ${category} - not an array or empty`);
            continue;
        }
        // Get first photo for background
        const firstPhoto = photos[0];
        console.log(`Creating banner for ${category} with image ${firstPhoto.path}`);
        // Create banner
        const banner = createBanner(category, firstPhoto.path);
        bannersContainer.appendChild(banner);
        bannerCount++;
    }
    console.log(`Created ${bannerCount} banners, appending to container`);
    portfolioContainer.appendChild(bannersContainer);
    console.log('Banners appended successfully');
}
// Create individual banner element
function createBanner(category, imagePath) {
    const banner = document.createElement('div');
    banner.className = 'photo-banner skeleton';
    // Set background image after it loads
    preloadImage(imagePath)
        .then(() => {
        banner.style.backgroundImage = `url('${imagePath}')`;
        banner.classList.remove('skeleton');
    })
        .catch(() => {
        console.error('Banner image failed to load:', imagePath);
    });
    banner.onclick = () => showGridView(category);
    // Blur overlay
    const overlay = document.createElement('div');
    overlay.className = 'photo-banner-overlay';
    // Text content
    const text = document.createElement('h2');
    text.className = 'photo-banner-text';
    text.textContent = category;
    banner.appendChild(overlay);
    banner.appendChild(text);
    return banner;
}
// Show grid view for a specific category
function showGridView(category) {
    if (!portfolioContainer)
        return;
    currentView = 'grid';
    currentCategory = category;
    portfolioContainer.innerHTML = '';
    // Hide online portfolios section
    if (onlinePortfoliosSection) {
        onlinePortfoliosSection.style.display = 'none';
    }
    // Create back button container
    const backContainer = document.createElement('div');
    backContainer.className = 'grid-header';
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Portfolio';
    backButton.onclick = () => renderBannerView();
    const title = document.createElement('h1');
    title.className = 'grid-title';
    title.textContent = category;
    backContainer.appendChild(backButton);
    backContainer.appendChild(title);
    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'photo-grid-container';
    // Get photos for this category
    const photos = photoData[category];
    const displayLimit = photoData['meta-data']?.display || Infinity;
    const limitedPhotos = photos.slice(0, displayLimit);
    // Create photo items
    limitedPhotos.forEach(photo => {
        const photoItem = createPhotoGridItem(photo);
        gridContainer.appendChild(photoItem);
    });
    portfolioContainer.appendChild(backContainer);
    portfolioContainer.appendChild(gridContainer);
}
// Create photo grid item
function createPhotoGridItem(photo) {
    const item = document.createElement('div');
    item.className = 'photo-grid-item skeleton';
    const img = document.createElement('img');
    img.src = photo.path;
    img.alt = photo.what || 'Photo';
    img.loading = 'lazy';
    img.style.opacity = '0';
    img.addEventListener('load', () => {
        item.classList.remove('skeleton');
        img.style.opacity = '1';
    });
    const overlay = document.createElement('div');
    overlay.className = 'photo-grid-overlay';
    const description = document.createElement('div');
    description.className = 'photo-grid-description';
    description.textContent = photo.what || '';
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'photo-grid-buttons';
    // Fullscreen button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'photo-action-btn fullscreen-btn';
    fullscreenBtn.title = 'View Details';
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fullscreenBtn.onclick = (e) => {
        e.stopPropagation();
        openLightbox(photo);
    };
    // Download button
    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'photo-action-btn download-btn';
    downloadBtn.title = 'Download Image';
    downloadBtn.href = photo.path;
    const safeWhat = (photo.what || 'image').replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_');
    const extension = photo.path.split('.').pop();
    downloadBtn.download = `${safeWhat}.${extension}`;
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.onclick = (e) => e.stopPropagation();
    buttonContainer.appendChild(fullscreenBtn);
    buttonContainer.appendChild(downloadBtn);
    overlay.appendChild(description);
    overlay.appendChild(buttonContainer);
    item.appendChild(img);
    item.appendChild(overlay);
    // Click on item to open lightbox
    item.onclick = () => openLightbox(photo);
    // Handle image loading errors
    img.onerror = () => {
        console.error(`Failed to load image: ${photo.path}`);
        item.innerHTML = `<p style="color: red; font-size: 0.8em; text-align: center;">Error loading:<br>${photo.path.split('/').pop()}</p>`;
    };
    return item;
}
// Setup lightbox functionality
function setupLightbox() {
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', (event) => {
            if (event.target === lightboxOverlay) {
                closeLightbox();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightboxOverlay?.classList.contains('active')) {
            closeLightbox();
        }
    });
}
// Open lightbox with photo details
function openLightbox(photo) {
    if (!lightboxOverlay || !lightboxImage || !lightboxCaption)
        return;
    lightboxImage.src = photo.path;
    lightboxImage.alt = photo.what || 'Enlarged photo';
    let captionText = photo.what || '';
    if (photo.where)
        captionText += ` - ${photo.where}`;
    if (photo.when)
        captionText += ` (${photo.when})`;
    lightboxCaption.textContent = captionText.trim();
    lightboxOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('body-blur');
}
// Close lightbox
function closeLightbox() {
    if (!lightboxOverlay)
        return;
    lightboxOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.body.classList.remove('body-blur');
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
