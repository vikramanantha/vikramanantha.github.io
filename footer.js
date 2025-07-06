function loadFooter() {
    const footerHTML = `
        <footer>
            <div class="footer-content">
                <p>Last updated: Jul 2025</p>
                <p>Vikram Anantha</p>
                <p><a href="https://github.com/vikramanantha/vikramanantha.github.io" target="_blank">View Source Code</a></p>
            </div>
        </footer>
    `;

    // Insert footer into placeholder
    document.getElementById('footer-placeholder').innerHTML = footerHTML;
} 