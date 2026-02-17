// Posts utility module
// All post data is managed in posts/index.json
// This file provides shared helper functions for loading post data.

async function loadPostsIndex() {
    const response = await fetch('posts/index.json');
    return response.json();
}

function flattenPosts(data) {
    const allPosts = [];
    data.categories.forEach(category => {
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
    return allPosts;
}
