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
                        window.location.pathname.includes('resume/')),
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
            path: 'resume/resume.pdf',
            isCurrent: window.location.pathname.includes('resume/'),
            navPath: 'resume/resume.pdf'
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
                <img src="${pages.home.isCurrent ? '' : '../'}images/markivx.png" alt="Logo">
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