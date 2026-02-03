// Sidebar functionality - reads from posts/index.json
document.addEventListener('DOMContentLoaded', async function() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarNav = document.getElementById('sidebar-nav');

    // Check if elements exist
    if (!hamburger || !sidebar || !sidebarNav) {
        return;
    }

    // Fetch category hierarchy from index.json
    let categories = [];
    try {
        const response = await fetch('posts/index.json');
        const data = await response.json();
        categories = data.categories || [];
    } catch (error) {
        console.error('Failed to load posts index:', error);
    }

    // Count total posts in a category
    function countPosts(category) {
        let count = category.posts ? category.posts.length : 0;
        if (category.subcategories) {
            category.subcategories.forEach(sub => {
                count += sub.posts ? sub.posts.length : 0;
            });
        }
        return count;
    }

    // Render sidebar navigation
    function renderSidebar() {
        let html = '<ul class="category-list">';
        
        // Add "All Posts" link
        html += `
            <li class="category-item">
                <a href="index.html" class="category-link all-posts">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    All Posts
                </a>
            </li>
        `;
        
        categories.forEach(category => {
            const totalPosts = countPosts(category);
            
            html += `<li class="category-item">`;
            html += `
                <button class="category-toggle" data-category="${category.slug}">
                    <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    <span>${category.name}</span>
                    ${totalPosts > 0 ? `<span class="category-count">${totalPosts}</span>` : ''}
                </button>
            `;
            
            html += `<ul class="subcategory-list" data-parent="${category.slug}">`;
            
            // Render subcategories
            if (category.subcategories && category.subcategories.length > 0) {
                category.subcategories.forEach(subcategory => {
                    const subPostCount = subcategory.posts ? subcategory.posts.length : 0;
                    
                    html += `
                        <li class="subcategory-item">
                            <button class="subcategory-toggle" data-subcategory="${subcategory.slug}">
                                <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                <span>${subcategory.name}</span>
                                ${subPostCount > 0 ? `<span class="category-count">${subPostCount}</span>` : ''}
                            </button>
                            <ul class="post-list" data-parent="${subcategory.slug}">
                                ${(subcategory.posts || []).map(post => `
                                    <li><a href="post.html?category=${encodeURIComponent(category.slug)}&subcategory=${encodeURIComponent(subcategory.slug)}&slug=${post.slug}">${post.title}</a></li>
                                `).join('')}
                            </ul>
                        </li>
                    `;
                });
            }
            
            // Render posts directly under category (no subcategory)
            if (category.posts && category.posts.length > 0) {
                category.posts.forEach(post => {
                    html += `<li class="direct-post"><a href="post.html?category=${encodeURIComponent(category.slug)}&slug=${post.slug}">${post.title}</a></li>`;
                });
            }
            
            html += `</ul></li>`;
        });
        
        html += '</ul>';
        sidebarNav.innerHTML = html;
        
        // Add toggle functionality
        document.querySelectorAll('.category-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('expanded');
                const list = document.querySelector(`.subcategory-list[data-parent="${btn.dataset.category}"]`);
                if (list) list.classList.toggle('show');
            });
        });
        
        document.querySelectorAll('.subcategory-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('expanded');
                const list = btn.nextElementSibling;
                if (list) list.classList.toggle('show');
            });
        });
    }

    // Open sidebar
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Event listeners
    hamburger.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });

    // Initialize
    renderSidebar();
});
