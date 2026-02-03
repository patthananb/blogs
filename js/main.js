// Main JavaScript for the blog

// Render posts on the homepage
async function renderPosts() {
    const postList = document.getElementById('post-list');
    if (!postList) return;

    // Fetch posts from index.json
    let allPosts = [];
    try {
        const response = await fetch('posts/index.json');
        const data = await response.json();
        
        // Flatten all posts from categories and subcategories
        data.categories.forEach(category => {
            // Posts directly in category
            if (category.posts) {
                category.posts.forEach(post => {
                    allPosts.push({
                        ...post,
                        categorySlug: category.slug,
                        categoryName: category.name,
                        subcategorySlug: null,
                        subcategoryName: null
                    });
                });
            }
            // Posts in subcategories
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    if (subcategory.posts) {
                        subcategory.posts.forEach(post => {
                            allPosts.push({
                                ...post,
                                categorySlug: category.slug,
                                categoryName: category.name,
                                subcategorySlug: subcategory.slug,
                                subcategoryName: subcategory.name
                            });
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Failed to load posts:', error);
        postList.innerHTML = '<p>Failed to load posts.</p>';
        return;
    }

    if (allPosts.length === 0) {
        postList.innerHTML = '<p>No posts yet. Check back soon!</p>';
        return;
    }

    // Sort by date (newest first) - assuming date format "Month Day, Year"
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    postList.innerHTML = allPosts.map(post => {
        // Build URL with category info
        let url = `post.html?category=${encodeURIComponent(post.categorySlug)}&slug=${post.slug}`;
        if (post.subcategorySlug) {
            url = `post.html?category=${encodeURIComponent(post.categorySlug)}&subcategory=${encodeURIComponent(post.subcategorySlug)}&slug=${post.slug}`;
        }
        
        // Show category badge
        const categoryLabel = post.subcategoryName 
            ? `${post.categoryName} / ${post.subcategoryName}`
            : post.categoryName;
        
        return `
            <article class="post-card">
                <div class="post-category-badge">${categoryLabel}</div>
                <h3><a href="${url}">${post.title}</a></h3>
                <div class="post-meta">
                    <span>${post.date}</span>
                    <span>by ${post.author}</span>
                </div>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="${url}" class="read-more">Read more →</a>
            </article>
        `;
    }).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderPosts();
});
