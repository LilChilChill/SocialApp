const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap"

const getUserProfile = async (userId) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/users/other/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const user = await res.json();
            displayUserInfo(user);
        } else {
            console.error('Không lấy được thông tin người dùng');
            console.log(res)
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
};
const displayUserInfo = (user) => {
    const avatarUrl = user.avatar ? user.avatar : '../img/profile-default.png';

    userInfo.innerHTML = `
        <img id="userAvatar" src="${avatarUrl}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border-color: #000">
        <p><strong>${user.name || 'Chưa có thông tin'}</strong></p>
    `;
    
};
window.getUserProfile = getUserProfile;

const postsContainer = document.getElementById('posts');
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postStatus = document.getElementById('postStatus');
const postFiles = document.getElementById('postImage');

//Tải post
const loadProfilePosts = async (userId) => {
    const res = await fetch(`${API_URL}/api/feeds/posts?userId=${userId}`);

    if (res.ok) {
        const posts = await res.json();
        displayPosts(posts);
    } else {
        console.error('Không thể tải bài viết.');
    }
};

// document.addEventListener('DOMContentLoaded', loadProfilePosts);
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    if (userId) {
        await getUserProfile(userId);
        await loadProfilePosts(userId);
    } else {
        console.error('Không tìm thấy userId');
    }
});


//Hiển thị bài đăng
const displayPosts = (posts) => {
    postsContainer.innerHTML = '';
    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        const currentUserId = localStorage.getItem('userId'); // Lấy ID người dùng từ localStorage
        const isLiked = post.likes.includes(currentUserId); // Kiểm tra người dùng đã like chưa
        const likeClass = isLiked ? 'fa-solid' : 'fa-regular'; // Định dạng icon
        const likedClass = isLiked ? 'liked' : ''; // Thêm class "liked" nếu đã like

        let documents = post.files.filter(file => file.fileType === 'document');
            let images = post.files.filter(file => file.fileType === 'image');
            let videos = post.files.filter(file => file.fileType === 'video');

            let filesHtml = '<div class="post-files">';
            if (documents.length > 0) {
                filesHtml += documents.map(file => `<a href="${file.data}" target="_blank" class="post-document">📄 Xem tài liệu</a>`).join('');
            }
            if (images.length > 0) {
                let gridClass = '';
                if (images.length === 2) {
                  gridClass = 'two-images';
                } else if (images.length >= 3 && images.length <= 4) {
                  gridClass = 'three-four-images';
                } else if (images.length > 4) {
                  gridClass = 'three-four-images';
                }
              
                filesHtml += `<div class="post-images-grid ${gridClass}">`;
              
                images.slice(0, 4).forEach((file, index) => {
                  if (index === 3 && images.length > 4) {
                    filesHtml += `
                      <div class="post-image-overlay">
                        <img src="${file.data}" alt="Hình ảnh" class="post-image">
                        <span>+${images.length - 4}</span>
                      </div>
                    `;
                  } else {
                    filesHtml += `<img src="${file.data}" alt="Hình ảnh" class="post-image">`;
                  }
                });
              
                filesHtml += `</div>`;
              }
            
            
            if (videos.length > 0) {
                if (videos.length === 1) {
                    filesHtml += `<video controls class="post-video"><source src="${videos[0].data}" type="${videos[0].contentType}"></video>`;
                } else {
                    filesHtml += '<div class="post-videos-grid">' + videos.map(file => `<video controls class="post-video"><source src="${file.data}" type="${file.contentType}"></video>`).join('') + '</div>';
                }
            }
            filesHtml += '</div>';
        

            const avatarUrl = post.author.avatar ? post.author.avatar : '../img/profile-default.png';
            const authorName = post.author.name || 'Người dùng ẩn danh';
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-header-info">
                        <img src="${avatarUrl}" alt="Avatar" class="post-avatar">
                        <div class="post-info">
                            <h4 onclick="goToProfile('${post.author._id}')">${authorName}</h4>
                            <p onclick="goToProfile('${post.author._id}')"><small>${post.status}</small></p>
                            <a href="#"><small>${new Date(post.createdAt).toLocaleString()}</small></a>
                        </div>
                    </div>
                    <div class="post-setting">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </div>
                </div>
                <div class="post-content">
                    <p class="post-title">${post.title ? post.title.replace(/\n/g, '<br>') : ''}</p>
                    ${post.title.split(/\r?\n/).length > 5 ? '<button class="toggle-content">Xem thêm</button>' : ''}
                </div>
                ${filesHtml}
                <div class="post-actions">
                    <button class="like-btn ${likedClass}" data-post-id="${post._id}">
                        <i class="${likeClass} fa-heart"></i> <span class="like-count">${post.likes.length}</span>
                    </button>
                    <button class="comment-btn">
                        <i class="fa-regular fa-comment"></i> <span class="like-count">${post.comments.length}</span>
                    </button>
                </div>
                <div class="post-comments">
                    <div class="comment-list">
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <img onclick="goToProfile('${comment.user._id}')" src="${comment.user?.avatar || '../img/profile-default.png'}" alt="Avatar" class="comment-avatar">
                                <div class="comment-content">
                                    <div class="comment-user" onclick="goToProfile('${comment.user._id}')">${comment.user?.name || 'Ẩn danh'}</div>
                                    <div class="comment-text">${comment.text}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="comment-input-box">
                        <input type="text" class="comment-input" placeholder="Viết bình luận..." data-post-id="${post._id}" />
                        <button class="comment-submit" data-post-id="${post._id}">Gửi</button>
                    </div>
                </div>
            `;

            const postTitle = postElement.querySelector('.post-title');
            const toggleBtn = postElement.querySelector('.toggle-content');

            if (toggleBtn) {
                const lines = post.title.split(/\r?\n/);
                const truncatedText = lines.slice(0, 5).join('<br>') + '...';
                postTitle.innerHTML = truncatedText;
            
                let previousPosition = 0; // Biến lưu vị trí trước khi mở rộng
                const offset = 100;
            
                toggleBtn.addEventListener('click', () => {
                    if (toggleBtn.textContent === 'Xem thêm') {
                        // Lưu vị trí của bài viết trước khi mở rộng
                        previousPosition = postElement.getBoundingClientRect().top + window.scrollY;
            
                        postTitle.innerHTML = post.title.replace(/\n/g, '<br>');
                        toggleBtn.textContent = 'Thu gọn';
                    } else {
                        postTitle.innerHTML = truncatedText;
                        toggleBtn.textContent = 'Xem thêm';
            
                        // Cuộn về đúng vị trí của bài viết ban đầu
                        window.scrollTo({ top: previousPosition - offset, behavior: 'smooth' });
                    }
                });
            }
            postsContainer.appendChild(postElement);

            const likeBtn = postElement.querySelector('.like-btn');
            likeBtn.addEventListener('click', async () => {
                await likePost(post._id, postElement);
            });

            const commentBtn = postElement.querySelector('.comment-btn');
            commentBtn.addEventListener('click', () => {
                const commentSection = postElement.querySelector('.post-comments');
                commentSection.classList.toggle('active'); // Hiện/ẩn bình luận
            });

            const commentSubmitBtn = postElement.querySelector('.comment-submit');
            commentSubmitBtn.addEventListener('click', async () => {
            const input = postElement.querySelector('.comment-input');
            const text = input.value.trim();
            if (text) {
                await commentPost(post._id, text, postElement);
                input.value = '';
            }
        });
    });
};

const likePost = async (postId, postElement) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/like`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
        });
        const data = await response.json();
        if (response.ok) {
            const likeBtn = postElement.querySelector('.like-btn');
            const likeIcon = likeBtn.querySelector('i');
            likeIcon.classList.toggle('fa-solid');
            likeIcon.classList.toggle('fa-regular');
            likeIcon.style.color = likeIcon.classList.contains('fa-solid') ? 'red' : 'black';
            postElement.querySelector('.like-count').textContent = data.likes;
        }
    } catch (error) {
        console.error('Lỗi khi like bài viết:', error);
    }
};

// Gửi bình luận
const commentPost = async (postId, text, postElement) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/comment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (response.ok) {
            const commentList = postElement.querySelector('.comment-list');
            commentList.innerHTML = data.comments.map(comment => `
                <div class="comment">
                    <strong>${comment.user?.name || 'Ẩn danh'}:</strong> ${comment.text}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Lỗi khi bình luận:', error);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".like-btn").forEach(button => {
        button.addEventListener("click", function () {
            this.classList.toggle("liked");
        });
    });

    document.querySelectorAll(".comment-btn").forEach(button => {
        button.addEventListener("click", function () {
            const postElement = this.closest(".post-actions").nextElementSibling;
            postElement.classList.toggle("active");
        });
    });
});

const goToProfile = (userId) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
        // window.location.href = window.location.origin + '/components/profile.html';
        window.location.href = import.meta.env.DEV
            ? '/components/profile.html'
            : '/profile';
    } else {
        // window.location.href = window.location.origin + `/components/user.html?userId=${userId}`;
        window.location.href = import.meta.env.DEV
            ? `/components/user.html?userId=${userId}`
            : `/user?userId=${userId}`;
    }
};
window.goToProfile = goToProfile;