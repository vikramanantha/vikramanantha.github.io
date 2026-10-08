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

    // Small projects and the sidequest map live under the Projects page now
    const projectSubpages = [
        'projects/', 'polaroider/', 'storyteller/', 'photorank/', '3d_modeler/', 'signer/',
        'reel_mapper/', 'resumeer/', 'carouseler/', '3d_prints/', '/sidequest_map/'
    ];
    const onProjectsPage = projectSubpages.some(path => window.location.pathname.includes(path));

    const pages = {
        home: {
            path: 'index.html',
            isCurrent: !(onProjectsPage ||
                        window.location.pathname.includes('photos/') ||
                        window.location.pathname.includes('resume/')),
        },
        projects: {
            path: 'projects/',
            isCurrent: onProjectsPage,
            navPath: 'projects/'
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
                    <li><a href="${pages.projects.navPath}">Projects</a></li>
                    <li><a href="${pages.photos.navPath}">Photos</a></li>
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