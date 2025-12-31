// import "../styles/profile.css";
// import "../styles/addFriend.css";
// import "../styles/alert.css";
// import "../styles/home.css";
// import "../styles/infoSettings.css";
// import "../styles/loading.css";
// import "../styles/message.css";
// import "../styles/settings.css";
// import "../styles/user.css";

const API_URL = import.meta.env.VITE_API_URL || '';
document.title = "Chiap";

// Debug logging
console.log('Profile page loaded');
console.log('API_URL:', API_URL);
console.log('Environment:', import.meta.env.MODE);
console.log('All env vars:', import.meta.env);

// User functions
const userInfoContainer = document.getElementById('userInfo');
const postUser = document.getElementById('post-user');
let currentUser = {};

// Kiểm tra các element có tồn tại không
if (!userInfoContainer) {
    console.error('userInfoContainer không tìm thấy!');
}
if (!postUser) {
    console.error('postUser không tìm thấy!');
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  } else {
    console.warn('Toast element không tìm thấy, message:', message);
  }
}

// Kiểm tra API_URL
if (!API_URL) {
    console.error('VITE_API_URL is not defined!');
    console.error('Available env vars:', Object.keys(import.meta.env));
    showToast('Lỗi cấu hình: API URL không được thiết lập.');
}


const getUserInfo = async () => {
    console.log('getUserInfo called');
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);

    if (!token) {
        console.warn('No token found');
        showToast('Vui lòng đăng nhập trước khi truy cập thông tin.');
        setTimeout(() => {
            window.location.href = window.location.origin;
        }, 2000);
        return;
    }

    if (!API_URL) {
        console.error('API_URL không được thiết lập');
        console.error('Current API_URL value:', API_URL);
        showToast('Lỗi: Không thể kết nối đến server. Vui lòng kiểm tra cấu hình.');
        return;
    }

    const profileUrl = `${API_URL}/api/users/profile`;
    console.log('Fetching profile from:', profileUrl);

    try {
        const res = await fetch(profileUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Profile response status:', res.status);
        console.log('Profile response ok:', res.ok);

        if (res.ok) {
            currentUser = await res.json();
            console.log('User data received:', currentUser);
            displayUserInfo(currentUser);
        } else {
            const errorMsg = await res.json().catch(() => ({ message: 'Lỗi không xác định' }));
            console.error('Profile fetch failed:', errorMsg);
            showToast(errorMsg.message || 'Không thể lấy thông tin người dùng.');
            setTimeout(() => {
                window.location.href = window.location.origin;
            }, 2000);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        showToast('Lỗi kết nối. Vui lòng kiểm tra lại.');
    }
};

const displayUserInfo = (user) => {
    console.log('displayUserInfo called with:', user);
    
    if (!user || !user._id) {
        console.error('Invalid user data:', user);
        return;
    }
    
    localStorage.setItem('userId', user._id);
    console.log('userId saved to localStorage:', user._id);
    
    // Sử dụng đường dẫn tuyệt đối hoặc đường dẫn từ public folder
    const defaultAvatar = '/img/profile-default.png';
    const avatarUrl = user.avatar ? user.avatar : defaultAvatar;

    if (!userInfoContainer) {
        console.error('userInfoContainer is null!');
        return;
    }
    
    if (!postUser) {
        console.error('postUser is null!');
        return;
    }

    userInfoContainer.innerHTML = `
        <img id="userAvatar" src="${avatarUrl}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border-color: #000" onerror="this.src='${defaultAvatar}'">
        <p><strong>${user.name || 'Chưa có thông tin'}</strong></p>
    `;
    postUser.innerHTML = `
        <img id="postUser" src="${avatarUrl}" alt="Avatar" onerror="this.src='${defaultAvatar}'">
        <div class="post-user-info">
            <p><strong>${user.name || 'Chưa có thông tin'}</strong></p>
        </div>
    `;
    
    console.log('User info displayed, loading posts...');
    // Load posts sau khi đã có userId
    loadProfilePosts();
};

// Đợi DOM sẵn sàng trước khi chạy
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired');
        getUserInfo();
    });
} else {
    console.log('DOM already ready');
    getUserInfo();
}

const postsContainer = document.getElementById('posts');
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postStatus = document.getElementById('postStatus');
const postFiles = document.getElementById('postImage');

// Kiểm tra các element
console.log('Elements check:', {
    postsContainer: !!postsContainer,
    postButton: !!postButton,
    postContent: !!postContent,
    postStatus: !!postStatus,
    postFiles: !!postFiles
});

const API_BASE_URL = `${API_URL}/api/feeds/posts`;
//Tải post
const loadProfilePosts = async () => {
    console.log('loadProfilePosts called');
    const userId = localStorage.getItem('userId');
    console.log('Current userId:', userId);
    
    if (!userId) {
        console.warn('userId chưa có, đợi getUserInfo hoàn thành...');
        return;
    }
    
    if (!API_URL) {
        console.error('API_URL không được thiết lập');
        showToast('Lỗi: Không thể kết nối đến server.');
        return;
    }

    if (!postsContainer) {
        console.error('postsContainer không tìm thấy!');
        return;
    }

    const postsUrl = `${API_BASE_URL}?userId=${userId}`;
    console.log('Fetching posts from:', postsUrl);

    try {
        const res = await fetch(postsUrl);
        console.log('Posts response status:', res.status);
        console.log('Posts response ok:', res.ok);

        if (res.ok) {
            const posts = await res.json();
            console.log('Posts received:', posts.length, 'posts');
            displayPosts(posts);
        } else {
            const errorData = await res.json().catch(() => ({}));
            console.error('Không thể tải bài viết:', errorData.message || res.statusText);
            console.error('Response status:', res.status);
            showToast('Không thể tải bài viết. Vui lòng thử lại.');
        }
    } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        showToast('Lỗi kết nối. Vui lòng kiểm tra lại.');
    }
};

//Hiển thị bài đăng
const displayPosts = (posts) => {
    console.log('displayPosts called with', posts.length, 'posts');
    
    if (!postsContainer) {
        console.error('postsContainer is null in displayPosts!');
        return;
    }
    
    if (!Array.isArray(posts)) {
        console.error('Posts is not an array:', posts);
        return;
    }
    
    postsContainer.innerHTML = '';
    console.log('Cleared postsContainer, rendering', posts.length, 'posts');
    
    posts.forEach((post, index) => {
        console.log(`Rendering post ${index + 1}/${posts.length}:`, post._id);
        const postElement = document.createElement('div');
        postElement.className = 'post';
        const currentUserId = localStorage.getItem('userId'); 
        const isLiked = post.likes.includes(currentUserId); 
        const likeClass = isLiked ? 'fa-solid' : 'fa-regular'; 
        const likedClass = isLiked ? 'liked' : ''; 

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
        

            const defaultAvatar = '/img/profile-default.png';
            const avatarUrl = post.author.avatar ? post.author.avatar : defaultAvatar;
            const authorName = post.author.name || 'Người dùng ẩn danh';
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-header-info">
                        <img src="${avatarUrl}" alt="Avatar" class="post-avatar" onerror="this.src='${defaultAvatar}'">
                        <div class="post-info">
                            <h4 onclick="goToProfile('${post.author._id}')">${authorName}</h4>
                            <p onclick="goToProfile('${post.author._id}')"><small>${post.status}</small></p>
                            <a><small>${new Date(post.createdAt).toLocaleString()}</small></a>
                        </div>
                    </div>
                    <div class="post-setting">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                        <div class="post-menu hidden">
                            <button class="edit-post-btn" data-post-id="${post._id}" data-title="${post.title}" data-status="${post.status}">Chỉnh sửa bài viết</button>
                            <button class="delete-post-btn" data-post-id="${post._id}">Xóa bài viết</button>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <p class="post-title">${post.title ? post.title.replace(/\n/g, '<br>') : ''}</p>
                    ${post.title && post.title.split(/\r?\n/).length > 5 ? '<button class="toggle-content">Xem thêm</button>' : ''}
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
                                <img onclick="goToProfile('${comment.user._id}')" src="${comment.user?.avatar || '/img/profile-default.png'}" alt="Avatar" class="comment-avatar" onerror="this.src='/img/profile-default.png'">
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

            if (toggleBtn && post.title) {
                const lines = post.title.split(/\r?\n/);
                const truncatedText = lines.slice(0, 2).join('<br>') + '...';
                postTitle.innerHTML = truncatedText;
            
                let previousPosition = 0; 
                const offset = 100;
            
                toggleBtn.addEventListener('click', () => {
                    if (toggleBtn.textContent === 'Xem thêm') {
                        
                        previousPosition = postElement.getBoundingClientRect().top + window.scrollY;
            
                        postTitle.innerHTML = post.title.replace(/\n/g, '<br>');
                        toggleBtn.textContent = 'Thu gọn';
                    } else {
                        postTitle.innerHTML = truncatedText;
                        toggleBtn.textContent = 'Xem thêm';
            
                        
                        window.scrollTo({ top: previousPosition - offset, behavior: 'smooth' });
                    }
                });
            }

            const settingBtn = postElement.querySelector('.post-setting i');
            const menu = postElement.querySelector('.post-menu');

            if (settingBtn) {
                settingBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    menu.classList.toggle('show');
                });
                
                document.addEventListener('click', (e) => {
                    if (menu.classList.contains('show') && !menu.contains(e.target) && e.target !== settingBtn) {
                        menu.classList.remove('show');
                    }
                });
            }

        postsContainer.appendChild(postElement);
        const deleteBtn = postElement.querySelector('.delete-post-btn');

        if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const postId = deleteBtn.dataset.postId;

            Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: 'Bài viết sẽ bị xóa vĩnh viễn!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6'
            }).then((result) => {
            if (result.isConfirmed) {
                deletePost(postId);
                Swal.fire({
                icon: 'success',
                title: 'Đã xóa!',
                text: 'Bài viết đã được xóa thành công.',
                timer: 2000,
                showConfirmButton: false
                });
            }
            });
        });
        }

        const likeBtn = postElement.querySelector('.like-btn');
        likeBtn.addEventListener('click', async () => {
            await likePost(post._id, postElement);
        });

        const commentBtn = postElement.querySelector('.comment-btn');
        commentBtn.addEventListener('click', () => {
            const commentSection = postElement.querySelector('.post-comments');
            commentSection.classList.toggle('active'); 
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

//Lượt thích
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
                    <img onclick="goToProfile('${comment.user._id}')" src="${comment.user?.avatar || '/img/profile-default.png'}" alt="Avatar" class="comment-avatar" onerror="this.src='/img/profile-default.png'">
                    <div class="comment-content">
                        <div class="comment-user" onclick="goToProfile('${comment.user._id}')">${comment.user?.name || 'Ẩn danh'}</div>
                        <div class="comment-text">${comment.text}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Lỗi khi bình luận:', error);
    }
};


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
//Tạo post
postButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const title = postContent.value.trim();
    const files = postFiles.files;
    const status = postStatus.value;

    if (!title && files.length === 0) {
        showToast('Vui lòng nhập nội dung hoặc chọn tệp.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('status', status);

    for (let file of files) {
        formData.append('files', file);
    }

    try {
        const res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        
        if (res.ok) {
            postContent.value = '';
            postFiles.value = '';
            postStatus.value = 'public';
            showToast('Đăng bài thành công!');
            loadProfilePosts();
        } else {
            const errorMsg = await res.json();
            showToast(errorMsg.message || 'Đăng bài thất bại.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Khai báo biến cho popup edit
const popup = document.querySelector('.popup');
const closePopup = document.querySelector('.close-popup');
const editTitle = document.querySelector('#edit-title');
const editStatus = document.querySelector('#edit-status');
const saveEditBtn = document.querySelector('#save-edit-btn');
let currentPostId = '';

//Cập nhật bài đăng
postsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-post-btn')) {
        currentPostId = e.target.dataset.postId;
        editTitle.value = e.target.dataset.title;
        editStatus.value = e.target.dataset.status;
        popup.classList.remove('hidden');
    }
});

const updatePost = async (postId, title, status) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, status })
        });

        if (response.ok) {
            showToast('Cập nhật bài viết thành công');
            loadProfilePosts();
        } else {
            const data = await response.json();
            showToast(data.message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showToast('Có lỗi xảy ra.');
    }
};

closePopup.onclick = () => {
    popup.classList.add('hidden');
};

saveEditBtn.onclick = async () => {
    const newTitle = editTitle.value;
    const newStatus = editStatus.value;

    if (newTitle.trim() !== '') {
        await updatePost(currentPostId, newTitle, newStatus);
        popup.classList.add('hidden');
    } else {
        showToast('Nội dung bài viết không được để trống');
    }
};

window.onclick = (e) => {
    if (e.target === popup) {
        popup.classList.add('hidden');
    }
};

//Xóa Post
const deletePost = async (postId) => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await res.json();
        if (res.ok) {
            showToast(result.message);
            loadProfilePosts();
        } else {
            showToast(result.message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
};