# Patthanan B — Blog

A simple, static blog website that renders Markdown content. No backend required — perfect for GitHub Pages!

## ✨ Features

- 📝 Write posts in **Markdown**
- 📁 **Folder-based categories** — organize posts by folders
- 🌙 **Dark/Light mode** toggle (code blocks auto-switch theme too)
- ☰ **Sidebar navigation** with collapsible categories
- 🎨 **Syntax highlighting** for code blocks (highlight.js)
- 🔒 **HTML sanitization** via DOMPurify
- 📱 **Responsive design** — works on mobile and desktop
- 🚀 **Zero backend** — fully static, deploy anywhere
- 🔧 **Admin page** — manage posts from the browser via GitHub API

## 📁 Folder Structure

```
blogs/
├── index.html              # Homepage
├── post.html               # Post template (loads Markdown)
├── about.html              # About page
├── admin.html              # Admin page (manage posts via GitHub API)
├── css/
│   └── style.css           # All styles + loading skeleton
├── js/
│   ├── main.js             # Homepage post rendering
│   ├── posts.js            # Shared helpers (loadPostsIndex, flattenPosts)
│   ├── sidebar.js          # Sidebar navigation
│   ├── theme.js            # Dark/light mode
│   └── admin.js            # Admin page logic (GitHub API)
└── posts/
    ├── index.json          # ⭐ Post registry (single source of truth)
    ├── Category1/          # Category folder
    │   └── my-post.md
    └── Category2/
        └── Subcategory/    # Subcategory folder
            └── another-post.md
```

## 🚀 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd blogs
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8080
   ```

3. Open http://localhost:8080 in your browser

### Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to **Settings** → **Pages**
3. Select **Deploy from a branch** → **main** → **/ (root)**
4. Your blog will be live at `https://<username>.github.io/<repo>/`

## 📝 How to Add a New Post

### Step 1: Create the Markdown File

Create a `.md` file in the appropriate category folder:

```
posts/
└── Programming/
    └── my-new-post.md
```

Write your content in Markdown:

```markdown
# My New Post

This is my post content with **bold** and *italic* text.

## Code Example

```javascript
console.log("Hello, World!");
```

## A List

- Item 1
- Item 2
- Item 3
```

### Step 2: Register the Post in index.json

Edit `posts/index.json` and add your post to the appropriate category:

```json
{
    "categories": [
        {
            "name": "Programming",
            "slug": "Programming",
            "subcategories": [],
            "posts": [
                {
                    "slug": "my-new-post",
                    "title": "My New Post",
                    "date": "February 3, 2026",
                    "author": "Bean",
                    "excerpt": "A short description of your post"
                }
            ]
        }
    ]
}
```

### Step 3: Done!

Your post will appear on the homepage and in the sidebar.

## 📂 Adding Categories & Subcategories

### Add a New Category

1. Create a folder in `posts/`:
   ```
   posts/NewCategory/
   ```

2. Add it to `index.json`:
   ```json
   {
       "name": "New Category",
       "slug": "NewCategory",
       "subcategories": [],
       "posts": []
   }
   ```

### Add a Subcategory

1. Create a subfolder:
   ```
   posts/Electrical/Embedded System/
   ```

2. Add it to the category in `index.json`:
   ```json
   {
       "name": "Electrical",
       "slug": "Electrical",
       "subcategories": [
           {
               "name": "Embedded System",
               "slug": "Embedded System",
               "posts": []
           }
       ],
       "posts": []
   }
   ```

## 📋 Post Metadata Fields

| Field | Description | Required |
|-------|-------------|----------|
| `slug` | Filename without `.md` (e.g., `my-post`) | ✅ |
| `title` | Display title | ✅ |
| `date` | Publication date | ✅ |
| `author` | Author name | ✅ |
| `excerpt` | Short description for homepage | ✅ |

## 🎨 Markdown Features Supported

- **Headers** (`# H1` to `###### H6`)
- **Bold** (`**text**`) and *Italic* (`*text*`)
- **Links** (`[text](url)`)
- **Images** (`![alt](url)`)
- **Code blocks** with syntax highlighting
- **Blockquotes** (`> quote`)
- **Lists** (ordered and unordered)
- **Tables**
- **Horizontal rules** (`---`)

## 🛠️ Customization

### Change Blog Name

Edit the logo text in `index.html`, `post.html`, and `about.html`:
```html
<a href="index.html" class="logo">Patthanan B</a>
```

### Modify Colors

Edit CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #2563eb;
    --text-color: #1f2937;
    /* ... */
}
```

## 🔧 Admin Page

The admin page lets you create, edit, and delete posts directly from the browser — no need to manually edit files or push commits. It uses the GitHub API to commit changes to your repository.

### Setup

1. **Generate a GitHub Personal Access Token (PAT)**
   - Go to [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
   - Click **"Generate new token (classic)"**
   - Give it a name (e.g. "Blog Admin")
   - Select the **`repo`** scope
   - Click **"Generate token"** and copy the token (starts with `ghp_`)

2. **Open the admin page**
   - Local: `http://localhost:8080/admin.html`
   - Live: `https://<your-github-pages-url>/admin.html`

3. **Login**
   - Paste your PAT into the input field and click **Connect**
   - The token is stored in your browser's `localStorage` — it is never sent anywhere except the GitHub API

### Features

- **Post management** — create, edit, and delete posts. Each action commits directly to your GitHub repo.
- **Category management** — add or remove categories and subcategories via the "Manage Categories" button.
- **Markdown editor** — write in Markdown on the left, see a live preview on the right.
- **Auto-slug** — the URL slug is automatically generated from the post title.
- **Dark/light mode** — the admin page follows the same theme toggle as the rest of the site.

### How It Works

When you save a post, the admin page makes two GitHub API calls:
1. Creates/updates the `.md` file in the correct `posts/{category}/{subcategory}/` folder
2. Updates `posts/index.json` with the post metadata

When you delete a post, it removes the `.md` file and updates `index.json`.

> **Note:** The admin page is not linked from the main navigation — it is only accessible by visiting the URL directly. Your PAT stays in your browser and is never exposed in the source code.

### Storing Your Token Locally

If you want to keep a copy of your PAT for reference, save it in a file called `.env` in the project root:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

This file is listed in `.gitignore` and will **never** be committed to the repository.

## 🔒 Security Notes

- **DOMPurify** sanitizes all Markdown-rendered HTML before injection.
- CDN scripts include **Subresource Integrity** (`integrity` + `crossorigin`) hashes so tampered files are rejected by the browser.

## 📄 License

MIT License — feel free to use and modify!
