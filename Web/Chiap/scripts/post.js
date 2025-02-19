import { API_URL } from "../config";

const createPostForm = document.getElementById('createPostForm');
const postsContainer = document.getElementById('posts');

createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const author = localStorage.getItem('username');
    console.log('Username: ', author);
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    if (!author) {
        alert('Bạn cần đăng nhập để đăng bài viết.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/feeds/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, title, content }),
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

async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/api/feeds/posts`);
        const posts = await response.json();
        postsContainer.innerHTML = '';
        posts.forEach((post) => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <h3>${post.title} - <small>${post.author}</small></h3>
                <p>${post.content}</p>
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

// Thích bài viết
async function likePost(postId) {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Bạn cần đăng nhập để thích bài viết.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/feeds/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }), 
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
}

// Hiển thị bình luận
function showComments(postId) {
    const commentSection = document.getElementById(`comments-${postId}`);
    commentSection.innerHTML = `
        <input type="text" id="commentText-${postId}" placeholder="Nhập bình luận">
        <button onclick="addComment('${postId}')">Gửi</button>
    `;
}

// Thêm bình luận
async function addComment(postId) {
    const username = localStorage.getItem('username');
    const text = document.getElementById(`commentText-${postId}`).value;

    if (!username || !text) {
        alert('Bạn cần đăng nhập và nhập bình luận để gửi.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/feeds/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: username, text }),
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
}

// Tải bài viết khi tải trang
document.addEventListener('DOMContentLoaded', loadPosts);
