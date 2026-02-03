// Posts data - Add your new posts here
// The slug should match the markdown filename in the posts/ folder

const posts = [
    {
        slug: "welcome-to-my-blog",
        title: "Welcome to My Blog",
        date: "February 2, 2026",
        author: "Bean",
        excerpt: "Hello and welcome! This is my first blog post where I share what this blog is all about and what you can expect to find here."
    },
    {
        slug: "getting-started-with-markdown",
        title: "Getting Started with Markdown",
        date: "February 2, 2026",
        author: "Bean",
        excerpt: "Learn the basics of Markdown syntax and how to write beautiful formatted content for your blog posts."
    }
];

// HOW TO ADD A NEW POST:
// 1. Create a new .md file in the posts/ folder (e.g., posts/my-new-post.md)
// 2. Add a new entry to the posts array above with:
//    - slug: filename without .md extension
//    - title: your post title
//    - date: publication date
//    - author: your name
//    - excerpt: short description for the homepage
