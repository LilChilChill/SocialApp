
const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap"

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = window.location.origin; 
    
}

window.logout = logout
function getFriends() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        alert('Vui lòng đăng nhập.');
        window.location.href = window.location.origin; 
        return;
    }

    fetch(`${API_URL}/api/users/friends`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(friends => {
        const friendList = document.getElementById('friendList');
        const headerName = document.getElementById('header')
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar
                    ? friend.avatar
                    : '../img/default-avatar.png';

                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                // onclick="openChat('${friend._id}', '${friend.name}', '${friendAvatar}')"
                friendItem.innerHTML = `
                    <div class='chatUser' >
                        <img src="${friendAvatar}" alt="${friend.name}" class="avatar">
                        <div class='content'>
                            <span>${friend.name}</span>
                        </div>
                    </div>
                `;
                friendList.appendChild(friendItem);
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách bạn bè:', error);
        document.getElementById('friendList').innerHTML = '<p>Không thể tải danh sách bạn bè. Vui lòng thử lại sau.</p>';
    });
}

getFriends()

const postsContainer = document.getElementById('posts');
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postFiles = document.getElementById('postImage'); // Đổi tên cho phù hợp

const API_BASE_URL = `${API_URL}/api/feeds/posts`;

// Tải bài viết từ API
const loadPosts = async () => {
    try {
        const res = await fetch(API_BASE_URL, { method: 'GET' });

        if (res.ok) {
            const posts = await res.json();
            displayPosts(posts);
        } else {
            console.error('Không thể tải bài viết.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// Hiển thị bài viết với hình ảnh, video, tài liệu
const displayPosts = (posts) => {
    const authorName = localStorage.getItem('username');
    postsContainer.innerHTML = '';
    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        // Hiển thị tệp đính kèm (ảnh, video, tài liệu)
        let filesHtml = '';
        if (post.files.length > 0) {
            filesHtml = `<div class="post-images-container">` + post.files.map(file => {
                if (file.fileType === 'image') {
                    return `<img src="${file.data}" alt="Hình ảnh" class="post-image">`;
                } else if (file.fileType === 'video') {
                    return `<video controls class="post-video"><source src="${file.data}" type="${file.contentType}"></video>`;
                } else {
                    return `<a href="${file.data}" target="_blank" class="post-document">📄 Xem tài liệu</a>`;
                }
            }).join('') + `</div>`;
        }
        
        const avatarUrl = post.author.avatar ? post.author.avatar : '../assets/profile-default.png';
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" alt="Avatar" class="post-avatar">
                <div class="post-info">
                    <h4>${authorName}</h4>
                    <p><small>${new Date(post.createdAt).toLocaleString()}</small></p>
                </div>
            </div>
            <p>${post.title}</p>
            <div class="post-files">${filesHtml}</div>
        `;

        postsContainer.appendChild(postElement);
    });
};
document.addEventListener('DOMContentLoaded', loadPosts);