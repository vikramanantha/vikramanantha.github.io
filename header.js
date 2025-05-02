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
            path: 'engineering/index.html',
            isCurrent: window.location.pathname.includes('engineering/'),
            navPath: 'engineering/index.html'
        },
        photos: {
            path: 'photos/index.html',
            isCurrent: window.location.pathname.includes('photos/'),
            navPath: 'photos/index.html'
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
        } else if (key === 'photos') { // SPECIAL CASE: Instagram link
            page.navPath = 'https://www.instagram.com/photos.by.vik';
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
    
    // navLinks.forEach(link => {
    //     const linkPath = link.getAttribute('href');
    //     console.log(linkPath);
    //     // console.log(currentPath);
    //     // Remove any existing active class first
    //     link.classList.remove('active');

        
        
    //     // // Check if current path ends with the link path
    //     // if (currentPath.endsWith(linkPath)) {
    //     //     link.classList.add('active');
    //     // }
    //     // // Special case for subdirectory index pages
    //     // else if ((pages.engineering.isCurrent && linkPath.includes('engineering/')) ||
    //     //          (pages.photos.isCurrent && linkPath.includes('photos/')) ||
    //     //          (pages.resume.isCurrent && linkPath.includes('resume/'))) {
    //     //     link.classList.add('active');
    //     // }
    //     // // Special case for home page
    //     // else if (pages.home.isCurrent) {
    //     //     link.classList.add('active');
    //     // }
    // });

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
    const nav = document.querySelector('nav ul');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        }
    });
} 