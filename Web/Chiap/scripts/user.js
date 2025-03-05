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
    const avatarUrl = user.avatar ? user.avatar : '../img/default-avatar.png';

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
        

            const avatarUrl = post.author.avatar ? post.author.avatar : '../assets/profile-default.png';
            const authorName = post.author.name || 'Người dùng ẩn danh';
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-header-info">
                        <img src="${avatarUrl}" alt="Avatar" class="post-avatar">
                        <div class="post-info">
                            <h4>${authorName}</h4>
                            <p><small>${post.status}</small></p>
                            <a href="#"><small>${new Date(post.createdAt).toLocaleString()}</small></a>
                        </div>
                    </div>
                    <div class="post-setting">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </div>
                </div>
                <p>${post.title ? post.title.replace(/\n/g, '<br>') : ''}</p>
                ${filesHtml}
            `;

        postsContainer.appendChild(postElement);
    });
};