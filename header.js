function loadHeader() {
    // const whatPage = {
    //     isEngineeringPage: window.location.pathname.includes('engineering/'),
    //     isPhotosPage: window.location.pathname.includes('photos/'),
    //     isResumePage: window.location.pathname.includes('resume/'),
    //     isHomePage: 
    // }

    // const pages = {
    //     home: 'index.html',
    //     engineering: 'engineering/index.html',
    //     photos: 'photos/index.html',
    //     resume: 'resume/resume.pdf'
    // }

    const pages = {
        home: {
            path: 'index.html',
            isCurrent: !(window.location.pathname.includes('engineering/') || 
                        window.location.pathname.includes('photos/') || 
                        window.location.pathname.includes('resume/') ||
                        window.location.pathname.includes('polaroider/') ||
                        window.location.pathname.includes('storyteller/') ||
                        window.location.pathname.includes('photorank/') ||
                        window.location.pathname.includes('3d_modeler/') ||
                        window.location.pathname.includes('signer/')),
        },
        engineering: {
            path: 'engineering/',
            isCurrent: window.location.pathname.includes('engineering/'),
            navPath: 'engineering/'
        },
        photos: {
            path: 'photos/',
            isCurrent: window.location.pathname.includes('photos/'),
            navPath: 'photos/'
        },
        resume: {
            path: 'important_files/resume.pdf',
            isCurrent: window.location.pathname.includes('resume/'),
            navPath: 'important_files/resume.pdf'
        },
        polaroider: {
            path: 'polaroider/',
            isCurrent: window.location.pathname.includes('polaroider/'),
            navPath: 'polaroider/'
        },
        photorank: {
            path: 'photorank/',
            isCurrent: window.location.pathname.includes('photorank/'),
            navPath: 'photorank/'
        },
        storyteller: {
            path: 'storyteller/',
            isCurrent: window.location.pathname.includes('storyteller/'),
            navPath: 'storyteller/'
        },
        three_d_modeler: {
            path: '3d_modeler/',
            isCurrent: window.location.pathname.includes('3d_modeler/'),
            navPath: '3d_modeler/'
        },
        signer: {
            path: 'signer/',
            isCurrent: window.location.pathname.includes('signer/'),
            navPath: 'signer/'
        }
    }
    
    // Set navigation paths based on current location
    // Use absolute paths (starting with /) to work from any subdirectory
    for (const [key, page] of Object.entries(pages)) {
        if (key === 'home') {
            // Always use absolute path for home to ensure it works from any subdirectory
            page.navPath = '/index.html';
        // } else if (key === 'photos') { // SPECIAL CASE: Instagram link
        //     page.navPath = 'https://www.instagram.com/photos.by.vik';
        }
        else {
            page.navPath = '/' + page.path;
        }
    }
    
    // Create navPaths object from the calculated paths
    // const navPaths = {
    //     home: pages.home.navPath,
    //     engineering: pages.engineering.navPath,
    //     photos: pages.photos.navPath,
    //     resume: pages.resume.navPath
    // };

    const headerHTML = `
        <header>
            <div class="logo">
                <img src="/images/VA-2026.png" alt="Logo">
            </div>
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <nav>
                <ul>
                    <li><a href="${pages.home.navPath}">Home</a></li>
                    <li><a href="${pages.engineering.navPath}">Engineering</a></li>
                    <li><a href="${pages.photos.navPath}">Photos</a></li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">Small Projects <i class="fas fa-chevron-down"></i></a>
                        <ul class="dropdown-menu">
                            <li><a href="${pages.polaroider.navPath}">
                                <img src="/polaroider/icon.png" alt="Polaroider Icon" class="project-icon">
                                Polaroider
                            </a></li>
                            <li><a href="${pages.storyteller.navPath}">
                                <img src="/storyteller/icon.png" alt="storyteller Icon" class="project-icon">
                                Storyteller
                            </a></li>
                            <li><a href="${pages.three_d_modeler.navPath}">
                                <img src="/3d_modeler/icon.png" alt="3D Modeler Icon" class="project-icon">
                                3D Modeler
                            </a></li>
                            <li><a href="${pages.signer.navPath}">
                                <img src="/images/VA small.png" alt="VA Signer Icon" class="project-icon">
                                VA Signer
                            </a></li>
                        </ul>
                    </li>
                    <li><a href="${pages.resume.navPath}" target="_blank">Resume</a></li>
                </ul>
            </nav>
        </header>
    `;

    // Insert header into placeholder
    document.getElementById('header-placeholder').innerHTML = headerHTML;

    // Set active class for current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Loop through all nav links
    navLinks.forEach(link => {
        // Remove any existing active class first
        link.classList.remove('active');
        
        // Skip home link - it will be handled separately
        if (link.getAttribute('href') === pages.home.navPath) {
            // Only highlight home if we're actually on the home page
            if (pages.home.isCurrent) {
                link.classList.add('active');
            }
            return;
        }
        
        // Get the href attribute
        const linkPath = link.getAttribute('href');
        
        // Check which page is current and add active class accordingly
        // Loop through all page keys (skip home, already handled)
        for (const key in pages) {
            if (key === 'home') continue;
            const page = pages[key];
            if (page.isCurrent && linkPath === page.navPath) {
                link.classList.add('active');
                break; // Exit loop once we've found the active page
            }
        }
    });

    // Special handling for Small Projects dropdown
    if (pages.polaroider.isCurrent) {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const polaroiderLink = document.querySelector('.dropdown-menu a[href*="polaroider"]');
        if (dropdownToggle) dropdownToggle.classList.add('active');
        if (polaroiderLink) polaroiderLink.classList.add('active');
    }
    
    if (pages.photorank.isCurrent) {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const photorankLink = document.querySelector('.dropdown-menu a[href*="photorank"]');
        if (dropdownToggle) dropdownToggle.classList.add('active');
        if (photorankLink) photorankLink.classList.add('active');
    }

    if (pages.storyteller.isCurrent) {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const storytellerLink = document.querySelector('.dropdown-menu a[href*="storyteller"]');
        if (dropdownToggle) dropdownToggle.classList.add('active');
        if (storytellerLink) storytellerLink.classList.add('active');
    }

    if (pages.three_d_modeler.isCurrent) {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const three_d_modelerLink = document.querySelector('.dropdown-menu a[href*="3d_modeler"]');
        if (dropdownToggle) dropdownToggle.classList.add('active');
        if (three_d_modelerLink) three_d_modelerLink.classList.add('active');
    }

    if (pages.signer.isCurrent) {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const signerLink = document.querySelector('.dropdown-menu a[href*="signer"]');
        if (dropdownToggle) dropdownToggle.classList.add('active');
        if (signerLink) signerLink.classList.add('active');
    }

    // Dropdown functionality
    const dropdown = document.querySelector('.dropdown');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdown && dropdownToggle && dropdownMenu) {
        dropdown.addEventListener('mouseenter', () => {
            dropdownMenu.classList.add('show');
        });

        dropdown.addEventListener('mouseleave', () => {
            dropdownMenu.classList.remove('show');
        });

        dropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
    }

    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('nav ul');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (event) => {
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
    
    // Header scroll effect
    const header = document.querySelector('header');
    if (header) { // Check if header exists
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { // Adjust threshold as needed
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        });
    }
} 