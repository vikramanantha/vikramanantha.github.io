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
                        window.location.pathname.includes('photorank/')),
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
        }
    }
    
    // Set navigation paths based on current location
    // Calculate navigation paths for each page using a for loop
    for (const [key, page] of Object.entries(pages)) {
        if (key === 'home') {
            page.navPath = page.isCurrent ? page.path : '../index.html';
        // } else if (key === 'photos') { // SPECIAL CASE: Instagram link
        //     page.navPath = 'https://www.instagram.com/photos.by.vik';
        }
        else {
            page.navPath = page.isCurrent ? 
                '../' + page.path : 
                (pages.home.isCurrent ? 
                    page.navPath : 
                    '../' + page.path);
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
                <img src="${pages.home.isCurrent ? '' : '../'}images/VA-2025.png" alt="Logo">
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
                                <img src="${pages.home.isCurrent ? '' : '../'}polaroider/icon.png" alt="Polaroider Icon" class="project-icon">
                                Polaroider
                            </a></li>
                            <li><a href="${pages.photorank.navPath}">
                                <img src="${pages.home.isCurrent ? '' : '../'}photorank/icon.png" alt="Photo Rank Icon" class="project-icon">
                                Photo Rank
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
        
        // Get the href attribute
        const linkPath = link.getAttribute('href');
        
        // Check which page is current and add active class accordingly
        // Loop through all page keys
        for (const key in pages) {
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