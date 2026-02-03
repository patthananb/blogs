// Main JavaScript for the blog

// Render posts on the homepage
function renderPosts() {
    const postList = document.getElementById('post-list');
    if (!postList) return;

    postList.innerHTML = posts.map(post => `
        <article class="post-card">
            <h3><a href="post.html?slug=${post.slug}">${post.title}</a></h3>
            <div class="post-meta">
                <span>${post.date}</span>
                <span>by ${post.author}</span>
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="post.html?slug=${post.slug}" class="read-more">Read more →</a>
        </article>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderPosts();
});
