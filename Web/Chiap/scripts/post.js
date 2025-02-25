const API_URL = import.meta.env.VITE_API_URL;

const createPostForm = document.getElementById('createPostForm');
const postsContainer = document.getElementById('posts');

// Gửi bài viết lên server
createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const files = document.getElementById('image').files;

    if (!title.trim()) {
        alert('Vui lòng nhập tiêu đề bài viết.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('status', content);

    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
        formData.append('files', imageInput.files[0]);
    }

    for (let file of files) {
        formData.append('files', file);
    }

    try {
        const response = await fetch(`${API_URL}/api/feeds/posts`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            loadPosts();
        } else {
            alert(data.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error(error);
    }
});

// Load bài viết từ server
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/api/feeds/posts`);
        const posts = await response.json();
        postsContainer.innerHTML = '';

        posts.forEach((post) => {
            const postElement = document.createElement('div');
            postElement.className = 'post';

            let filesHtml = '';
            if (post.files.length > 0) {
                filesHtml = post.files.map(file => {
                    if (file.fileType === 'image') {
                        return `<img src="${file.data}" alt="Hình ảnh" class="post-image">`;
                    } else if (file.fileType === 'video') {
                        return `<video controls class="post-video"><source src="${file.data}" type="${file.contentType}"></video>`;
                    } else {
                        return `<a href="${file.data}" target="_blank" class="post-document">📄 Tài liệu đính kèm</a>`;
                    }
                }).join('');
            }

            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.status}</p>
                <div class="post-files">${filesHtml}</div>
                <div class="actions">
                    <button onclick="likePost('${post._id}')">Thích (${post.likes.length})</button>
                    <button onclick="showComments('${post._id}')">Bình luận</button>
                </div>
                <div id="comments-${post._id}" class="comment-section"></div>
            `;
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', loadPosts);
