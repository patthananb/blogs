// Admin panel - GitHub API integration for managing blog posts
(function () {
    const OWNER = 'patthananb';
    const REPO = 'myBlogs';
    const API = 'https://api.github.com';
    const BRANCH = 'main';

    // State
    let token = localStorage.getItem('github_token');
    let indexData = null; // cached posts/index.json
    let indexSha = null;  // SHA of index.json (needed for updates)
    let editingPost = null; // { categoryIdx, subcategoryIdx, postIdx, fileSha }

    // DOM refs
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const editorView = document.getElementById('editor-view');
    const tokenInput = document.getElementById('token-input');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const newPostBtn = document.getElementById('new-post-btn');
    const manageCatsBtn = document.getElementById('manage-cats-btn');
    const postTableBody = document.getElementById('post-table-body');
    const emptyState = document.getElementById('empty-state');
    const editorTitle = document.getElementById('editor-title');
    const postTitleInput = document.getElementById('post-title-input');
    const postAuthorInput = document.getElementById('post-author-input');
    const postCategorySelect = document.getElementById('post-category-select');
    const postSubcategorySelect = document.getElementById('post-subcategory-select');
    const postDateInput = document.getElementById('post-date-input');
    const postSlugInput = document.getElementById('post-slug-input');
    const postExcerptInput = document.getElementById('post-excerpt-input');
    const markdownEditor = document.getElementById('markdown-editor');
    const previewPane = document.getElementById('preview-pane');
    const savePostBtn = document.getElementById('save-post-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const categoryModal = document.getElementById('category-modal');
    const categoryManagerContent = document.getElementById('category-manager-content');
    const newCategoryInput = document.getElementById('new-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const toast = document.getElementById('toast');

    // ── Helpers ──────────────────────────────────────────────

    function showToast(message, type) {
        toast.textContent = message;
        toast.className = 'toast ' + type + ' show';
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    function showView(view) {
        loginView.classList.remove('active');
        dashboardView.classList.remove('active');
        editorView.classList.remove('active');
        if (view === 'login') loginView.classList.add('active');
        if (view === 'dashboard') dashboardView.classList.add('active');
        if (view === 'editor') editorView.classList.add('active');
    }

    function slugify(text) {
        return text.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // ── GitHub API ──────────────────────────────────────────

    async function apiFetch(path, options) {
        const res = await fetch(API + path, {
            ...options,
            headers: {
                'Authorization': 'token ' + token,
                'Accept': 'application/vnd.github.v3+json',
                ...(options && options.headers)
            }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'API request failed (' + res.status + ')');
        }
        return res.json();
    }

    async function validateToken() {
        const user = await apiFetch('/user');
        return user.login;
    }

    async function fetchIndex() {
        const data = await apiFetch('/repos/' + OWNER + '/' + REPO + '/contents/posts/index.json?ref=' + BRANCH);
        indexSha = data.sha;
        indexData = JSON.parse(atob(data.content.replace(/\n/g, '')));
        return indexData;
    }

    async function updateIndex(newData, message) {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 4) + '\n')));
        const result = await apiFetch('/repos/' + OWNER + '/' + REPO + '/contents/posts/index.json', {
            method: 'PUT',
            body: JSON.stringify({
                message: message,
                content: content,
                sha: indexSha,
                branch: BRANCH
            })
        });
        indexSha = result.content.sha;
        indexData = newData;
        return result;
    }

    async function fetchFileContent(path) {
        const data = await apiFetch('/repos/' + OWNER + '/' + REPO + '/contents/' + path + '?ref=' + BRANCH);
        return {
            content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))),
            sha: data.sha
        };
    }

    async function createOrUpdateFile(path, content, message, sha) {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        const body = {
            message: message,
            content: encoded,
            branch: BRANCH
        };
        if (sha) body.sha = sha;
        return apiFetch('/repos/' + OWNER + '/' + REPO + '/contents/' + path, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async function deleteFile(path, sha, message) {
        return apiFetch('/repos/' + OWNER + '/' + REPO + '/contents/' + path, {
            method: 'DELETE',
            body: JSON.stringify({
                message: message,
                sha: sha,
                branch: BRANCH
            })
        });
    }

    // ── Auth ────────────────────────────────────────────────

    async function tryLogin(t) {
        token = t;
        try {
            const login = await validateToken();
            localStorage.setItem('github_token', token);
            showToast('Connected as ' + login, 'success');
            await loadDashboard();
        } catch (e) {
            token = null;
            localStorage.removeItem('github_token');
            loginError.textContent = 'Invalid token: ' + e.message;
            loginError.style.display = '';
            showView('login');
        }
    }

    function logout() {
        token = null;
        indexData = null;
        indexSha = null;
        localStorage.removeItem('github_token');
        showView('login');
        tokenInput.value = '';
    }

    // ── Dashboard ───────────────────────────────────────────

    async function loadDashboard() {
        showView('dashboard');
        postTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Loading...</td></tr>';
        try {
            await fetchIndex();
            renderPostTable();
        } catch (e) {
            showToast('Failed to load posts: ' + e.message, 'error');
        }
    }

    function getAllPosts() {
        const posts = [];
        indexData.categories.forEach((cat, ci) => {
            (cat.posts || []).forEach((post, pi) => {
                posts.push({
                    ...post,
                    categoryName: cat.name,
                    categorySlug: cat.slug,
                    subcategoryName: null,
                    subcategorySlug: null,
                    categoryIdx: ci,
                    subcategoryIdx: null,
                    postIdx: pi
                });
            });
            (cat.subcategories || []).forEach((sub, si) => {
                (sub.posts || []).forEach((post, pi) => {
                    posts.push({
                        ...post,
                        categoryName: cat.name,
                        categorySlug: cat.slug,
                        subcategoryName: sub.name,
                        subcategorySlug: sub.slug,
                        categoryIdx: ci,
                        subcategoryIdx: si,
                        postIdx: pi
                    });
                });
            });
        });
        // Sort newest first
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        return posts;
    }

    function renderPostTable() {
        const posts = getAllPosts();
        if (posts.length === 0) {
            postTableBody.innerHTML = '';
            emptyState.style.display = '';
            return;
        }
        emptyState.style.display = 'none';
        postTableBody.innerHTML = posts.map(p => {
            const catLabel = p.subcategoryName
                ? p.categoryName + ' / ' + p.subcategoryName
                : p.categoryName;
            return '<tr>' +
                '<td>' + catLabel + '</td>' +
                '<td>' + p.title + '</td>' +
                '<td>' + p.date + '</td>' +
                '<td>' + p.author + '</td>' +
                '<td class="actions">' +
                    '<button class="btn btn-secondary btn-sm edit-btn" data-ci="' + p.categoryIdx + '" data-si="' + (p.subcategoryIdx === null ? '' : p.subcategoryIdx) + '" data-pi="' + p.postIdx + '">Edit</button>' +
                    '<button class="btn btn-danger btn-sm delete-btn" data-ci="' + p.categoryIdx + '" data-si="' + (p.subcategoryIdx === null ? '' : p.subcategoryIdx) + '" data-pi="' + p.postIdx + '">Delete</button>' +
                '</td>' +
                '</tr>';
        }).join('');

        // Attach event listeners
        postTableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => onEditPost(btn.dataset));
        });
        postTableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => onDeletePost(btn.dataset));
        });
    }

    // ── Editor ──────────────────────────────────────────────

    function populateCategoryDropdowns() {
        postCategorySelect.innerHTML = indexData.categories.map((cat, i) =>
            '<option value="' + i + '">' + cat.name + '</option>'
        ).join('');
        updateSubcategoryDropdown();
    }

    function updateSubcategoryDropdown() {
        const ci = parseInt(postCategorySelect.value);
        const cat = indexData.categories[ci];
        const subs = cat.subcategories || [];
        postSubcategorySelect.innerHTML = '<option value="">None</option>' +
            subs.map((sub, i) =>
                '<option value="' + i + '">' + sub.name + '</option>'
            ).join('');
    }

    function openNewPostEditor() {
        editingPost = null;
        editorTitle.textContent = 'New Post';
        postTitleInput.value = '';
        postAuthorInput.value = 'Bean';
        postDateInput.value = formatDate(new Date());
        postSlugInput.value = '';
        postExcerptInput.value = '';
        markdownEditor.value = '';
        previewPane.innerHTML = '';
        populateCategoryDropdowns();
        showView('editor');
    }

    async function onEditPost(dataset) {
        const ci = parseInt(dataset.ci);
        const si = dataset.si !== '' ? parseInt(dataset.si) : null;
        const pi = parseInt(dataset.pi);

        const cat = indexData.categories[ci];
        const postList = si !== null ? cat.subcategories[si].posts : cat.posts;
        const post = postList[pi];

        // Build file path
        let filePath = 'posts/' + cat.slug + '/';
        if (si !== null) filePath += cat.subcategories[si].slug + '/';
        filePath += post.slug + '.md';

        try {
            const file = await fetchFileContent(filePath);
            editingPost = { categoryIdx: ci, subcategoryIdx: si, postIdx: pi, fileSha: file.sha, originalSlug: post.slug, originalPath: filePath };

            editorTitle.textContent = 'Edit Post';
            postTitleInput.value = post.title;
            postAuthorInput.value = post.author;
            postDateInput.value = post.date;
            postSlugInput.value = post.slug;
            postExcerptInput.value = post.excerpt;
            markdownEditor.value = file.content;
            previewPane.innerHTML = DOMPurify.sanitize(marked.parse(file.content));

            populateCategoryDropdowns();
            postCategorySelect.value = ci;
            updateSubcategoryDropdown();
            if (si !== null) postSubcategorySelect.value = si;

            showView('editor');
        } catch (e) {
            showToast('Failed to load post: ' + e.message, 'error');
        }
    }

    async function onSavePost() {
        const title = postTitleInput.value.trim();
        const author = postAuthorInput.value.trim();
        const date = postDateInput.value.trim();
        const slug = postSlugInput.value.trim() || slugify(title);
        const excerpt = postExcerptInput.value.trim();
        const markdown = markdownEditor.value;
        const ci = parseInt(postCategorySelect.value);
        const si = postSubcategorySelect.value !== '' ? parseInt(postSubcategorySelect.value) : null;

        if (!title || !author || !date || !slug) {
            showToast('Please fill in title, author, date, and slug.', 'error');
            return;
        }

        const cat = indexData.categories[ci];
        let filePath = 'posts/' + cat.slug + '/';
        if (si !== null) filePath += cat.subcategories[si].slug + '/';
        filePath += slug + '.md';

        const postEntry = { slug, title, date, author, excerpt };

        savePostBtn.disabled = true;
        savePostBtn.textContent = 'Saving...';

        try {
            if (editingPost) {
                // If slug/category changed, delete old file first
                const oldPath = editingPost.originalPath;
                if (oldPath !== filePath) {
                    await deleteFile(oldPath, editingPost.fileSha, 'Move post: ' + editingPost.originalSlug + ' -> ' + slug);
                    await createOrUpdateFile(filePath, markdown, 'Update post: ' + title);
                } else {
                    await createOrUpdateFile(filePath, markdown, 'Update post: ' + title, editingPost.fileSha);
                }

                // Remove old entry from index
                const oldCat = indexData.categories[editingPost.categoryIdx];
                const oldList = editingPost.subcategoryIdx !== null
                    ? oldCat.subcategories[editingPost.subcategoryIdx].posts
                    : oldCat.posts;
                oldList.splice(editingPost.postIdx, 1);

                // Add new entry
                const targetList = si !== null
                    ? indexData.categories[ci].subcategories[si].posts
                    : indexData.categories[ci].posts;
                targetList.push(postEntry);

                await updateIndex(indexData, 'Update index: ' + title);
                showToast('Post updated!', 'success');
            } else {
                // Create new post
                await createOrUpdateFile(filePath, markdown, 'Add post: ' + title);

                const targetList = si !== null
                    ? indexData.categories[ci].subcategories[si].posts
                    : indexData.categories[ci].posts;
                targetList.push(postEntry);

                await updateIndex(indexData, 'Add to index: ' + title);
                showToast('Post created!', 'success');
            }
            editingPost = null;
            await loadDashboard();
        } catch (e) {
            showToast('Save failed: ' + e.message, 'error');
        } finally {
            savePostBtn.disabled = false;
            savePostBtn.textContent = 'Save Post';
        }
    }

    async function onDeletePost(dataset) {
        const ci = parseInt(dataset.ci);
        const si = dataset.si !== '' ? parseInt(dataset.si) : null;
        const pi = parseInt(dataset.pi);

        const cat = indexData.categories[ci];
        const postList = si !== null ? cat.subcategories[si].posts : cat.posts;
        const post = postList[pi];

        if (!confirm('Delete "' + post.title + '"? This cannot be undone.')) return;

        let filePath = 'posts/' + cat.slug + '/';
        if (si !== null) filePath += cat.subcategories[si].slug + '/';
        filePath += post.slug + '.md';

        try {
            const file = await fetchFileContent(filePath);
            await deleteFile(filePath, file.sha, 'Delete post: ' + post.title);

            postList.splice(pi, 1);
            await updateIndex(indexData, 'Remove from index: ' + post.title);

            showToast('Post deleted.', 'success');
            renderPostTable();
        } catch (e) {
            showToast('Delete failed: ' + e.message, 'error');
        }
    }

    // ── Category Manager ────────────────────────────────────

    function renderCategoryManager() {
        let html = '<ul class="cat-manager-list">';
        indexData.categories.forEach((cat, ci) => {
            const postCount = (cat.posts ? cat.posts.length : 0) +
                (cat.subcategories || []).reduce((sum, s) => sum + (s.posts ? s.posts.length : 0), 0);

            html += '<li class="cat-manager-item">' +
                '<span class="cat-name">' + cat.name + '</span>' +
                (postCount === 0
                    ? '<button class="btn btn-danger btn-sm del-cat-btn" data-ci="' + ci + '">Remove</button>'
                    : '<span style="font-size:0.8rem;color:var(--text-light);">' + postCount + ' post' + (postCount !== 1 ? 's' : '') + '</span>'
                ) +
                '</li>';

            // Subcategories
            if (cat.subcategories && cat.subcategories.length > 0) {
                html += '<ul class="subcat-list">';
                cat.subcategories.forEach((sub, si) => {
                    const subCount = sub.posts ? sub.posts.length : 0;
                    html += '<li class="subcat-item">' +
                        '<span>' + sub.name + '</span>' +
                        (subCount === 0
                            ? '<button class="btn btn-danger btn-sm del-subcat-btn" data-ci="' + ci + '" data-si="' + si + '">Remove</button>'
                            : '<span style="font-size:0.8rem;color:var(--text-light);">' + subCount + ' post' + (subCount !== 1 ? 's' : '') + '</span>'
                        ) +
                        '</li>';
                });
                html += '</ul>';
            }

            // Add subcategory row
            html += '<div class="add-row">' +
                '<input type="text" placeholder="New subcategory" class="new-subcat-input" data-ci="' + ci + '">' +
                '<button class="btn btn-primary btn-sm add-subcat-btn" data-ci="' + ci + '">Add</button>' +
                '</div>';
        });
        html += '</ul>';
        categoryManagerContent.innerHTML = html;

        // Delete category
        categoryManagerContent.querySelectorAll('.del-cat-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ci = parseInt(btn.dataset.ci);
                const name = indexData.categories[ci].name;
                if (!confirm('Delete category "' + name + '"?')) return;
                indexData.categories.splice(ci, 1);
                try {
                    await updateIndex(indexData, 'Remove category: ' + name);
                    showToast('Category removed.', 'success');
                    renderCategoryManager();
                } catch (e) {
                    showToast('Failed: ' + e.message, 'error');
                    await fetchIndex(); // re-sync
                }
            });
        });

        // Delete subcategory
        categoryManagerContent.querySelectorAll('.del-subcat-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ci = parseInt(btn.dataset.ci);
                const si = parseInt(btn.dataset.si);
                const name = indexData.categories[ci].subcategories[si].name;
                if (!confirm('Delete subcategory "' + name + '"?')) return;
                indexData.categories[ci].subcategories.splice(si, 1);
                try {
                    await updateIndex(indexData, 'Remove subcategory: ' + name);
                    showToast('Subcategory removed.', 'success');
                    renderCategoryManager();
                } catch (e) {
                    showToast('Failed: ' + e.message, 'error');
                    await fetchIndex();
                }
            });
        });

        // Add subcategory
        categoryManagerContent.querySelectorAll('.add-subcat-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ci = parseInt(btn.dataset.ci);
                const input = categoryManagerContent.querySelector('.new-subcat-input[data-ci="' + ci + '"]');
                const name = input.value.trim();
                if (!name) return;
                const slug = slugify(name);
                if (!indexData.categories[ci].subcategories) indexData.categories[ci].subcategories = [];
                indexData.categories[ci].subcategories.push({ name, slug, posts: [] });
                try {
                    await updateIndex(indexData, 'Add subcategory: ' + name);
                    showToast('Subcategory added.', 'success');
                    input.value = '';
                    renderCategoryManager();
                } catch (e) {
                    showToast('Failed: ' + e.message, 'error');
                    await fetchIndex();
                }
            });
        });
    }

    async function onAddCategory() {
        const name = newCategoryInput.value.trim();
        if (!name) return;
        const slug = slugify(name);
        indexData.categories.push({ name, slug, subcategories: [], posts: [] });
        try {
            await updateIndex(indexData, 'Add category: ' + name);
            showToast('Category added.', 'success');
            newCategoryInput.value = '';
            renderCategoryManager();
        } catch (e) {
            showToast('Failed: ' + e.message, 'error');
            await fetchIndex();
        }
    }

    // ── Markdown Preview ────────────────────────────────────

    function updatePreview() {
        const md = markdownEditor.value;
        previewPane.innerHTML = DOMPurify.sanitize(marked.parse(md));
    }

    // ── Auto-slug from title ────────────────────────────────

    function onTitleChange() {
        if (!editingPost) {
            postSlugInput.value = slugify(postTitleInput.value);
        }
    }

    // ── Event Listeners ─────────────────────────────────────

    loginBtn.addEventListener('click', () => {
        const t = tokenInput.value.trim();
        if (!t) {
            loginError.textContent = 'Please enter a token.';
            loginError.style.display = '';
            return;
        }
        loginError.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connecting...';
        tryLogin(t).finally(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Connect';
        });
    });

    tokenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    logoutBtn.addEventListener('click', logout);
    newPostBtn.addEventListener('click', openNewPostEditor);
    savePostBtn.addEventListener('click', onSavePost);
    cancelEditBtn.addEventListener('click', () => {
        editingPost = null;
        showView('dashboard');
    });

    manageCatsBtn.addEventListener('click', () => {
        renderCategoryManager();
        categoryModal.classList.add('show');
    });
    closeModalBtn.addEventListener('click', () => {
        categoryModal.classList.remove('show');
        renderPostTable(); // refresh in case categories changed
    });
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            categoryModal.classList.remove('show');
            renderPostTable();
        }
    });

    addCategoryBtn.addEventListener('click', onAddCategory);
    newCategoryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onAddCategory();
    });

    postCategorySelect.addEventListener('change', updateSubcategoryDropdown);
    markdownEditor.addEventListener('input', updatePreview);
    postTitleInput.addEventListener('input', onTitleChange);

    // Tab key support in markdown editor
    markdownEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = markdownEditor.selectionStart;
            const end = markdownEditor.selectionEnd;
            markdownEditor.value = markdownEditor.value.substring(0, start) + '    ' + markdownEditor.value.substring(end);
            markdownEditor.selectionStart = markdownEditor.selectionEnd = start + 4;
        }
    });

    // ── Init ────────────────────────────────────────────────

    console.log('[Admin] Initializing, token exists:', !!token);
    if (token) {
        tryLogin(token);
    } else {
        showView('login');
    }
})();
