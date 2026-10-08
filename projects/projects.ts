// Projects page TypeScript

interface LinkButton {
    type: 'link' | 'github' | 'paper' | 'youtube' | 'devpost' | 'video';
    url: string;
}

interface LogoProject {
    logo?: string;
    faIcon?: string;
    alt: string;
    name: string;
    role: string;
    duration: string;
    links: LinkButton[];
    description: string;
    images?: string[];
    tryUrl?: string;
}

interface ResearchProject {
    media: string;
    mediaType: 'image' | 'video';
    title: string;
    institution: string;
    date: string;
    links: LinkButton[];
    description: string;
}

interface ProjectSection {
    id: string;
    label: string;
    title: string;
    image: string;
}

interface ProjectsData {
    sections: ProjectSection[];
    internships: LogoProject[];
    researchProjects: ResearchProject[];
    personalProjects: LogoProject[];
}

// Normalized shape so every section renders through the same card + modal
interface CardData {
    kind: 'logo' | 'research';
    thumb: string;
    faIcon?: string;
    thumbAlt: string;
    mediaType: 'image' | 'video';
    name: string;
    role: string;
    duration: string;
    links: LinkButton[];
    description: string;
    images: string[];
    tryUrl?: string;
}

async function loadData(): Promise<ProjectsData> {
    const response = await fetch('data.json');
    return await response.json();
}

function resolvePath(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `../${path}`;
}

function fromLogoProject(item: LogoProject): CardData {
    return {
        kind: 'logo',
        thumb: item.logo ? resolvePath(item.logo) : '',
        faIcon: item.faIcon,
        thumbAlt: item.alt,
        mediaType: 'image',
        name: item.name,
        role: item.role,
        duration: item.duration,
        links: item.links,
        description: item.description,
        images: item.images || [],
        tryUrl: item.tryUrl
    };
}

function fromResearchProject(item: ResearchProject): CardData {
    return {
        kind: 'research',
        thumb: resolvePath(item.media),
        thumbAlt: item.title,
        mediaType: item.mediaType,
        name: item.title,
        role: item.institution,
        duration: item.date,
        links: item.links,
        description: item.description,
        images: []
    };
}

function createLinkButton(link: LinkButton): HTMLElement {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'eng-link-btn';

    let icon = '';
    let title = '';
    switch(link.type) {
        case 'link':
            icon = '<i class="fas fa-external-link-alt"></i>';
            title = 'Visit Website';
            break;
        case 'github':
            icon = '<i class="fab fa-github"></i>';
            title = 'View Code';
            break;
        case 'paper':
            icon = '<i class="fas fa-file-alt"></i>';
            title = 'Read Paper';
            break;
        case 'youtube':
        case 'video':
            icon = '<i class="fab fa-youtube"></i>';
            title = 'Watch Video';
            break;
        case 'devpost':
            icon = '<i class="fas fa-laptop-code"></i>';
            title = 'View on Devpost';
            break;
    }

    anchor.innerHTML = icon;
    anchor.title = title;
    return anchor;
}

function createMedia(src: string, alt: string, mediaType: 'image' | 'video', className: string): HTMLElement {
    if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = src;
        video.className = className;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        return video;
    }
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = className;
    return img;
}

// Thumbnail + header row, shared by the card and the modal so the pop-out lines up
function createCardTop(item: CardData, actionBtn: HTMLElement): { thumb: HTMLElement; header: HTMLElement } {
    const thumb = document.createElement('div');
    thumb.className = item.kind === 'research' ? 'eng-media-container' : 'eng-logo-container';
    if (item.faIcon) {
        thumb.classList.add('proj-icon-thumb');
        thumb.innerHTML = `<i class="${item.faIcon}" aria-hidden="true"></i>`;
    } else {
        thumb.appendChild(createMedia(
            item.thumb,
            item.thumbAlt,
            item.mediaType,
            item.kind === 'research' ? 'eng-media' : 'eng-logo'
        ));
    }

    const header = document.createElement('div');
    header.className = 'eng-item-header';

    // Left side (name + role)
    const leftSide = document.createElement('div');
    leftSide.className = 'eng-header-left';

    const name = document.createElement('h3');
    name.className = 'eng-item-name';
    name.textContent = item.name;

    const role = document.createElement('p');
    role.className = 'eng-item-role';
    role.textContent = item.role;

    leftSide.appendChild(name);
    leftSide.appendChild(role);

    // Right side (duration + links + action)
    const rightSide = document.createElement('div');
    rightSide.className = 'eng-header-right';

    const duration = document.createElement('div');
    duration.className = 'eng-duration';
    duration.textContent = item.duration;

    const controls = document.createElement('div');
    controls.className = 'eng-controls';
    item.links.forEach(link => {
        controls.appendChild(createLinkButton(link));
    });
    controls.appendChild(actionBtn);

    rightSide.appendChild(duration);
    rightSide.appendChild(controls);

    header.appendChild(leftSide);
    header.appendChild(rightSide);

    return { thumb, header };
}

function createCard(item: CardData): HTMLElement {
    const container = document.createElement('div');
    container.className = item.kind === 'research' ? 'eng-research-item' : 'eng-internship-item';

    let actionBtn: HTMLElement;
    if (item.tryUrl) {
        // Small projects link straight to their page instead of popping out
        const tryBtn = document.createElement('a');
        tryBtn.className = 'proj-try-btn';
        tryBtn.href = item.tryUrl;
        tryBtn.innerHTML = 'Try it out <i class="fas fa-arrow-right"></i>';
        actionBtn = tryBtn;
    } else {
        actionBtn = document.createElement('button');
        actionBtn.className = 'eng-expand-btn';
        actionBtn.innerHTML = '<i class="fas fa-up-right-and-down-left-from-center"></i>';
        actionBtn.setAttribute('aria-label', `Show details for ${item.name}`);
    }

    const { thumb, header } = createCardTop(item, actionBtn);

    const content = document.createElement('div');
    content.className = 'eng-item-content';
    content.appendChild(header);

    container.appendChild(thumb);
    container.appendChild(content);

    container.addEventListener('click', (e) => {
        // Let link buttons navigate normally
        if (e.target instanceof HTMLElement && e.target.closest('a')) {
            return;
        }
        if (item.tryUrl) {
            window.location.href = item.tryUrl;
            return;
        }
        openModal(item, container, actionBtn);
    });

    return container;
}

// ---------- Pop-out modal ----------

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Sample a damped spring into a CSS linear() easing so the pop-out settles like Arc's peek
function springEasing(damping: number, stiffness: number): string {
    const fallback = 'cubic-bezier(0.2, 0.9, 0.1, 1)';
    if (!CSS.supports('animation-timing-function', 'linear(0, 1)')) {
        return fallback;
    }
    const omega = Math.sqrt(stiffness);
    const zeta = damping / (2 * omega);
    const steps = 60;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let value: number;
        if (zeta < 1) {
            const wd = omega * Math.sqrt(1 - zeta * zeta);
            value = 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
        } else {
            value = 1 - Math.exp(-omega * t) * (1 + omega * t);
        }
        points.push(i === steps ? '1' : value.toFixed(4));
    }
    return `linear(${points.join(', ')})`;
}

const OPEN_EASING = springEasing(17, 150);
const CLOSE_EASING = springEasing(26, 170);
const OPEN_MS = 650;
const CLOSE_MS = 480;

let modalRoot: HTMLElement;
let backdrop: HTMLElement;
let panel: HTMLElement;
let panelInner: HTMLElement;
let ghost: HTMLElement | null = null;
let activeCard: HTMLElement | null = null;
let activeTrigger: HTMLElement | null = null;
let isAnimating = false;

function buildModalShell(): void {
    modalRoot = document.createElement('div');
    // engineering-container so card text inside the modal matches the page's sizing
    modalRoot.className = 'proj-modal-root engineering-container';
    modalRoot.hidden = true;

    backdrop = document.createElement('div');
    backdrop.className = 'proj-backdrop';
    backdrop.addEventListener('click', closeModal);

    panel = document.createElement('div');
    panel.className = 'proj-modal';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    modalRoot.appendChild(backdrop);
    modalRoot.appendChild(panel);
    document.body.appendChild(modalRoot);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeCard) {
            closeModal();
        }
    });
}

function fillModal(item: CardData): void {
    panel.innerHTML = '';
    panel.scrollTop = 0;
    panel.setAttribute('aria-label', item.name);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'eng-expand-btn proj-close-btn';
    closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';
    closeBtn.setAttribute('aria-label', 'Close details');
    closeBtn.addEventListener('click', closeModal);

    const { thumb, header } = createCardTop(item, closeBtn);
    header.classList.add('proj-modal-header');

    const top = document.createElement('div');
    top.className = 'proj-modal-top';
    const headerWrap = document.createElement('div');
    headerWrap.className = 'eng-item-content';
    headerWrap.appendChild(header);
    top.appendChild(thumb);
    top.appendChild(headerWrap);

    const body = document.createElement('div');
    body.className = 'eng-description proj-modal-body';

    if (item.kind === 'research') {
        body.appendChild(createMedia(item.thumb, item.thumbAlt, item.mediaType, 'proj-modal-hero'));
    }

    const text = document.createElement('div');
    text.innerHTML = item.description;
    body.appendChild(text);

    if (item.images.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'eng-images';
        item.images.forEach(imgPath => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'eng-image-wrapper';

            const img = document.createElement('img');
            img.src = resolvePath(imgPath);
            img.alt = `${item.name} image`;
            img.className = 'eng-image';

            imgWrapper.appendChild(img);
            imagesContainer.appendChild(imgWrapper);
        });
        body.appendChild(imagesContainer);
    }

    panelInner = document.createElement('div');
    panelInner.className = 'proj-modal-inner';
    panelInner.appendChild(top);
    panelInner.appendChild(body);
    panel.appendChild(panelInner);
}

interface MorphFrames {
    panelAtCard: Keyframe;
    ghostAtPanel: Keyframe;
}

// The panel and a copy of the card morph in opposite directions along the same path:
// the panel shrinks onto the card while the copy grows onto the panel, so crossfading
// their contents swaps the expanded layout for the card's layout mid-flight.
function morphFrames(card: HTMLElement): MorphFrames {
    const c = card.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const scale = c.width / p.width;
    const clipBottom = Math.max(0, p.height - c.height / scale);
    return {
        panelAtCard: {
            transform: `translate(${c.left - p.left}px, ${c.top - p.top}px) scale(${scale})`,
            clipPath: `inset(0px 0px ${clipBottom}px 0px round ${10 / scale}px)`,
            boxShadow: '0 0 0 rgba(10, 35, 66, 0)',
            borderColor: 'rgba(10, 35, 66, 0)'
        },
        ghostAtPanel: {
            transform: `translate(${p.left - c.left}px, ${p.top - c.top}px) scale(${1 / scale})`
        }
    };
}

const PANEL_REST: Keyframe = {
    transform: 'translate(0px, 0px) scale(1)',
    clipPath: 'inset(0px 0px 0px 0px round 16px)',
    boxShadow: '0 30px 80px rgba(10, 35, 66, 0.35)',
    borderColor: 'rgba(10, 35, 66, 1)'
};

const GHOST_REST: Keyframe = { transform: 'translate(0px, 0px) scale(1)' };

function createGhost(card: HTMLElement): HTMLElement {
    const rect = card.getBoundingClientRect();
    const copy = card.cloneNode(true) as HTMLElement;
    copy.classList.remove('proj-card-lifted');
    copy.classList.add('proj-ghost');
    copy.setAttribute('aria-hidden', 'true');
    copy.style.left = `${rect.left}px`;
    copy.style.top = `${rect.top}px`;
    copy.style.width = `${rect.width}px`;
    modalRoot.appendChild(copy);
    return copy;
}

function removeGhost(): void {
    if (ghost) {
        ghost.remove();
        ghost = null;
    }
}

function lockScroll(lock: boolean): void {
    if (lock) {
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : '';
        document.documentElement.classList.add('proj-modal-open');
    } else {
        document.body.style.paddingRight = '';
        document.documentElement.classList.remove('proj-modal-open');
    }
}

function openModal(item: CardData, card: HTMLElement, trigger: HTMLElement): void {
    if (activeCard || isAnimating) {
        return;
    }
    activeCard = card;
    activeTrigger = trigger;
    isAnimating = true;

    fillModal(item);
    modalRoot.hidden = false;
    lockScroll(true);

    const reduce = prefersReducedMotion.matches;

    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reduce ? 150 : OPEN_MS * 0.6,
        easing: 'ease-out',
        fill: 'forwards'
    });

    let animation: Animation;
    if (reduce) {
        card.classList.add('proj-card-lifted');
        animation = panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
    } else {
        const frames = morphFrames(card);
        ghost = createGhost(card);
        card.classList.add('proj-card-lifted');

        const timing: KeyframeAnimationOptions = { duration: OPEN_MS, easing: OPEN_EASING, fill: 'forwards' };
        animation = panel.animate([frames.panelAtCard, PANEL_REST], timing);
        ghost.animate([GHOST_REST, frames.ghostAtPanel], timing);

        // Card content hands off to the expanded content early in the grow
        ghost.animate(
            [{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }],
            { duration: OPEN_MS, fill: 'forwards' }
        );
        panelInner.animate(
            [{ opacity: 0 }, { opacity: 0, offset: 0.08 }, { opacity: 1, offset: 0.4 }, { opacity: 1 }],
            { duration: OPEN_MS, fill: 'forwards' }
        );
    }

    animation.onfinish = () => {
        removeGhost();
        isAnimating = false;
        const closeBtn = panel.querySelector<HTMLElement>('.proj-close-btn');
        if (closeBtn) {
            closeBtn.focus({ preventScroll: true });
        }
    };
}

function closeModal(): void {
    if (!activeCard || isAnimating) {
        return;
    }
    isAnimating = true;
    const card = activeCard;

    const reduce = prefersReducedMotion.matches;
    // Measure the panel at rest, not mid-transform
    panel.getAnimations({ subtree: true }).forEach(a => a.cancel());

    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reduce ? 150 : CLOSE_MS * 0.8,
        easing: 'ease-in',
        fill: 'forwards'
    });

    let animation: Animation;
    if (reduce) {
        animation = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    } else {
        const frames = morphFrames(card);
        ghost = createGhost(card);

        const timing: KeyframeAnimationOptions = { duration: CLOSE_MS, easing: CLOSE_EASING, fill: 'forwards' };
        animation = panel.animate([PANEL_REST, frames.panelAtCard], timing);
        ghost.animate([frames.ghostAtPanel, GHOST_REST], timing);

        // Expanded content gives way to the card's layout before it lands
        panelInner.animate(
            [{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }],
            { duration: CLOSE_MS, fill: 'forwards' }
        );
        ghost.animate(
            [{ opacity: 0 }, { opacity: 0, offset: 0.05 }, { opacity: 1, offset: 0.4 }, { opacity: 1 }],
            { duration: CLOSE_MS, fill: 'forwards' }
        );
    }

    animation.onfinish = () => teardownModal(true);
}

function teardownModal(restoreFocus: boolean): void {
    if (activeCard) {
        activeCard.classList.remove('proj-card-lifted');
    }
    removeGhost();
    modalRoot.hidden = true;
    panel.getAnimations({ subtree: true }).forEach(a => a.cancel());
    backdrop.getAnimations().forEach(a => a.cancel());
    panel.innerHTML = '';
    lockScroll(false);
    if (restoreFocus && activeTrigger) {
        activeTrigger.focus({ preventScroll: true });
    }
    activeCard = null;
    activeTrigger = null;
    isAnimating = false;
}

// ---------- Section routing ----------
// /projects shows the section banners; /projects#<id> shows one section, so the
// browser back button returns to the banners.

let sections: ProjectSection[] = [];
let openedFromBanners = false;

function populate(containerId: string, items: CardData[]): void {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    items.forEach(item => {
        container.appendChild(createCard(item));
    });
}

function createBanner(section: ProjectSection): HTMLElement {
    const banner = document.createElement('a');
    banner.className = 'photo-banner proj-banner';
    banner.href = `#${section.id}`;
    if (section.image) {
        banner.style.backgroundImage = `url('${resolvePath(section.image)}')`;
        banner.classList.add('has-image');
    }
    banner.addEventListener('click', () => {
        openedFromBanners = true;
    });

    const overlay = document.createElement('div');
    overlay.className = 'photo-banner-overlay';

    const text = document.createElement('h2');
    text.className = 'photo-banner-text';
    text.textContent = section.label;

    banner.appendChild(overlay);
    banner.appendChild(text);
    return banner;
}

function goToBanners(): void {
    if (openedFromBanners) {
        history.back();
        return;
    }
    history.pushState(null, '', window.location.pathname);
    renderRoute();
}

function renderRoute(): void {
    // A route change (e.g. browser back) shouldn't leave a pop-out floating
    if (activeCard) {
        teardownModal(false);
    }

    const id = window.location.hash.slice(1);
    const current = sections.find(section => section.id === id);

    const bannerView = document.getElementById('projects-banners');
    const sectionView = document.getElementById('projects-section-view');
    if (!bannerView || !sectionView) {
        return;
    }

    bannerView.hidden = !!current;
    sectionView.hidden = !current;
    sections.forEach(section => {
        // Prefixed ids so the browser doesn't jump-scroll to the #fragment
        const el = document.getElementById(`section-${section.id}`);
        if (el) {
            el.hidden = section !== current;
        }
    });

    const title = document.getElementById('projects-section-title');
    if (title) {
        title.textContent = current ? current.title : '';
    }
    document.title = current ? `Vikram Anantha - ${current.title}` : 'Vikram Anantha - Projects';
    if (!current) {
        openedFromBanners = false;
    }
    window.scrollTo(0, 0);
}

async function initializeProjectsPage(): Promise<void> {
    try {
        buildModalShell();
        const data = await loadData();
        sections = data.sections || [];

        const bannerView = document.getElementById('projects-banners');
        if (bannerView) {
            sections.forEach(section => bannerView.appendChild(createBanner(section)));
        }
        const backBtn = document.getElementById('projects-back');
        if (backBtn) {
            backBtn.addEventListener('click', goToBanners);
        }

        populate('internships-content', (data.internships || []).map(fromLogoProject));
        populate('research-content', (data.researchProjects || []).map(fromResearchProject));
        populate('personal-content', (data.personalProjects || []).map(fromLogoProject));

        window.addEventListener('popstate', renderRoute);
        window.addEventListener('hashchange', renderRoute);
        renderRoute();
    } catch (error) {
        console.error('Error loading projects data:', error);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProjectsPage);
} else {
    initializeProjectsPage();
}
