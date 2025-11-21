// Engineering page TypeScript

interface LinkButton {
    type: 'link' | 'github' | 'paper' | 'youtube' | 'devpost' | 'video';
    url: string;
}

interface InternshipProject {
    logo: string;
    alt: string;
    name: string;
    role: string;
    duration: string;
    links: LinkButton[];
    description: string;
    images?: string[];
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

interface EducationItem {
    logo: string;
    alt: string;
    name: string;
    degree?: string;
    duration: string;
    link: string;
    notes?: string[];
    coursework: string[];
}

interface EngineeringData {
    internshipsAndProjects: InternshipProject[];
    researchProjects: ResearchProject[];
    educationItems: EducationItem[];
}

let engineeringData: EngineeringData | null = null;

async function loadData(): Promise<EngineeringData> {
    const response = await fetch('data.json');
    return await response.json();
}

function resolvePath(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `../${path}`;
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

function createInternshipItem(item: InternshipProject): HTMLElement {
    const container = document.createElement('div');
    container.className = 'eng-internship-item';
    
    // Logo container
    const logoContainer = document.createElement('div');
    logoContainer.className = 'eng-logo-container';
    const logo = document.createElement('img');
    logo.src = resolvePath(item.logo);
    logo.alt = item.alt;
    logo.className = 'eng-logo';
    logoContainer.appendChild(logo);
    
    // Content container
    const content = document.createElement('div');
    content.className = 'eng-item-content';
    
    // Header
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
    
    // Right side (duration + links + expand)
    const rightSide = document.createElement('div');
    rightSide.className = 'eng-header-right';
    
    const duration = document.createElement('div');
    duration.className = 'eng-duration';
    duration.textContent = item.duration;
    
    const controls = document.createElement('div');
    controls.className = 'eng-controls';
    
    // Add link buttons
    item.links.forEach(link => {
        controls.appendChild(createLinkButton(link));
    });
    
    // Expand button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'eng-expand-btn';
    expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    expandBtn.setAttribute('aria-label', 'Expand details');
    controls.appendChild(expandBtn);
    
    rightSide.appendChild(duration);
    rightSide.appendChild(controls);
    
    header.appendChild(leftSide);
    header.appendChild(rightSide);
    
    // Description (collapsible)
    const description = document.createElement('div');
    description.className = 'eng-description';
    description.innerHTML = item.description;
    
    // Add images if they exist
    if (item.images && item.images.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'eng-images';
        item.images.forEach(imgPath => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'eng-image-wrapper';
            
            const img = document.createElement('img');
            img.src = `../${imgPath}`;
            img.alt = `${item.name} image`;
            img.className = 'eng-image';
            
            imgWrapper.appendChild(img);
            imagesContainer.appendChild(imgWrapper);
        });
        description.appendChild(imagesContainer);
    }
    
    content.appendChild(header);
    content.appendChild(description);
    
    container.appendChild(logoContainer);
    container.appendChild(content);
    
    // Add click handler for entire header
    header.addEventListener('click', (e) => {
        // Prevent navigation if clicking on a link
        if (e.target instanceof HTMLElement && e.target.closest('a')) {
            return;
        }
        e.stopPropagation();
        const isExpanded = description.classList.toggle('expanded');
        expandBtn.innerHTML = isExpanded ? 
            '<i class="fas fa-chevron-up"></i>' : 
            '<i class="fas fa-chevron-down"></i>';
    });
    
    return container;
}

function createResearchItem(item: ResearchProject): HTMLElement {
    const container = document.createElement('div');
    container.className = 'eng-research-item';
    
    // Media container
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'eng-media-container';
    
    if (item.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = `../${item.media}`;
        video.className = 'eng-media';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        mediaContainer.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = `../${item.media}`;
        img.alt = item.title;
        img.className = 'eng-media';
        mediaContainer.appendChild(img);
    }
    
    // Content container
    const content = document.createElement('div');
    content.className = 'eng-item-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'eng-item-header';
    
    // Left side (title + institution)
    const leftSide = document.createElement('div');
    leftSide.className = 'eng-header-left';
    
    const title = document.createElement('h3');
    title.className = 'eng-item-name';
    title.textContent = item.title;
    
    const institution = document.createElement('p');
    institution.className = 'eng-item-role';
    institution.textContent = item.institution;
    
    leftSide.appendChild(title);
    leftSide.appendChild(institution);
    
    // Right side (date + links + expand)
    const rightSide = document.createElement('div');
    rightSide.className = 'eng-header-right';
    
    const date = document.createElement('div');
    date.className = 'eng-duration';
    date.textContent = item.date;
    
    const controls = document.createElement('div');
    controls.className = 'eng-controls';
    
    // Add link buttons
    item.links.forEach(link => {
        controls.appendChild(createLinkButton(link));
    });
    
    // Expand button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'eng-expand-btn';
    expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    expandBtn.setAttribute('aria-label', 'Expand details');
    controls.appendChild(expandBtn);
    
    rightSide.appendChild(date);
    rightSide.appendChild(controls);
    
    header.appendChild(leftSide);
    header.appendChild(rightSide);
    
    // Description (collapsible)
    const description = document.createElement('div');
    description.className = 'eng-description';
    description.innerHTML = item.description;
    
    content.appendChild(header);
    content.appendChild(description);
    
    container.appendChild(mediaContainer);
    container.appendChild(content);
    
    // Add click handler for entire header
    header.addEventListener('click', (e) => {
        // Prevent navigation if clicking on a link
        if (e.target instanceof HTMLElement && e.target.closest('a')) {
            return;
        }
        e.stopPropagation();
        const isExpanded = description.classList.toggle('expanded');
        expandBtn.innerHTML = isExpanded ? 
            '<i class="fas fa-chevron-up"></i>' : 
            '<i class="fas fa-chevron-down"></i>';
    });
    
    return container;
}

function createEducationItem(item: EducationItem): HTMLElement {
    const container = document.createElement('div');
    container.className = 'eng-education-item';
    
    // Logo container
    const logoContainer = document.createElement('div');
    logoContainer.className = 'eng-logo-container';
    const logo = document.createElement('img');
    logo.src = resolvePath(item.logo);
    logo.alt = item.alt;
    logo.className = 'eng-logo';
    logoContainer.appendChild(logo);
    
    // Content container
    const content = document.createElement('div');
    content.className = 'eng-item-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'eng-item-header';
    
    // Left side (name + degree)
    const leftSide = document.createElement('div');
    leftSide.className = 'eng-header-left';
    
    const name = document.createElement('h3');
    name.className = 'eng-item-name';
    name.textContent = item.name;
    
    leftSide.appendChild(name);
    
    if (item.degree) {
        const degree = document.createElement('p');
        degree.className = 'eng-item-role';
        degree.textContent = item.degree;
        leftSide.appendChild(degree);
    }
    
    // Right side (duration + expand)
    const rightSide = document.createElement('div');
    rightSide.className = 'eng-header-right';
    
    const duration = document.createElement('div');
    duration.className = 'eng-duration';
    duration.textContent = item.duration;
    
    const controls = document.createElement('div');
    controls.className = 'eng-controls';
    
    // Expand button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'eng-expand-btn';
    expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    expandBtn.setAttribute('aria-label', 'Expand details');
    controls.appendChild(expandBtn);
    
    rightSide.appendChild(duration);
    rightSide.appendChild(controls);
    
    header.appendChild(leftSide);
    header.appendChild(rightSide);
    
    // Description (collapsible)
    const description = document.createElement('div');
    description.className = 'eng-description';
    
    // Add notes if they exist
    if (item.notes && item.notes.length > 0) {
        const notesText = document.createElement('p');
        notesText.textContent = item.notes.join(', ');
        notesText.style.fontWeight = '600';
        notesText.style.marginBottom = '1rem';
        description.appendChild(notesText);
    }
    
    // Add coursework
    const courseworkTitle = document.createElement('p');
    courseworkTitle.textContent = 'Relevant Coursework:';
    courseworkTitle.style.fontWeight = '600';
    courseworkTitle.style.marginBottom = '0.5rem';
    description.appendChild(courseworkTitle);
    
    const courseworkList = document.createElement('ul');
    courseworkList.style.margin = '0';
    courseworkList.style.paddingLeft = '1.5rem';
    item.coursework.forEach(course => {
        const li = document.createElement('li');
        li.textContent = course;
        li.style.marginBottom = '0.5rem';
        courseworkList.appendChild(li);
    });
    description.appendChild(courseworkList);
    
    content.appendChild(header);
    content.appendChild(description);
    
    container.appendChild(logoContainer);
    container.appendChild(content);
    
    // Add click handler for entire header
    header.addEventListener('click', (e) => {
        // Prevent navigation if clicking on a link
        if (e.target instanceof HTMLElement && e.target.closest('a')) {
            return;
        }
        e.stopPropagation();
        const isExpanded = description.classList.toggle('expanded');
        expandBtn.innerHTML = isExpanded ? 
            '<i class="fas fa-chevron-up"></i>' : 
            '<i class="fas fa-chevron-down"></i>';
    });
    
    return container;
}

async function initializeEngineeringPage(): Promise<void> {
    try {
        // Load data from JSON
        engineeringData = await loadData();
        
        // Populate Internships & Projects
        const internshipsContainer = document.getElementById('internships-content');
        if (internshipsContainer && engineeringData.internshipsAndProjects) {
            engineeringData.internshipsAndProjects.forEach(item => {
                internshipsContainer.appendChild(createInternshipItem(item));
            });
        }
        
        // Populate Research
        const researchContainer = document.getElementById('research-content');
        if (researchContainer && engineeringData.researchProjects) {
            engineeringData.researchProjects.forEach(item => {
                researchContainer.appendChild(createResearchItem(item));
            });
        }
        
        // Populate Education
        const educationContainer = document.getElementById('education-content');
        if (educationContainer && engineeringData.educationItems) {
            engineeringData.educationItems.forEach(item => {
                educationContainer.appendChild(createEducationItem(item));
            });
        }
    } catch (error) {
        console.error('Error loading engineering data:', error);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEngineeringPage);
} else {
    initializeEngineeringPage();
}
