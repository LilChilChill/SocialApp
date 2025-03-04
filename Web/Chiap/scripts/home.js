
const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap"

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = window.location.origin; 
    
}

window.logout = logout



//Home
const postsContainer = document.getElementById('posts')
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postFiles = document.getElementById('postImage'); 

const API_BASE_URL =`${API_URL}/api/feeds/posts` ;

const loadPosts = async (page = 1) => {
    currentPage = 1
    hasMorePost = true
    const res = await fetch(`${API_URL}/api/feeds/posts?page${page}`);

    if (res.ok) {
        const posts = await res.json();
        displayPosts(posts);
    } else {
        console.error('Không thể tải bài viết.');
    }
};

document.addEventListener('DOMContentLoaded', loadPosts);


const displayPosts = (posts) => {
    postsContainer.innerHTML = '';
    posts.forEach((post) => {
        if(post.status == 'public') {
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
                    <div class="post-setting"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                </div>
                <p>${post.title ? post.title.replace(/\n/g, '<br>') : ''}</p>
                ${filesHtml}
            `;

            postsContainer.appendChild(postElement);
        }
    });
};


let currentPage = 1
let hasMorePost = true
let isLoadPosts = false
function loadMorePosts() {
    if(!hasMorePost || isLoadPosts ) 
        return

    fetch(`${API_URL}/api/feeds/posts?page${currentPage + 1}`,{
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Lỗi lấy bài viết.')
        }
        return response.json()
    })
    .then(posts => {
        if(posts.length === 0) {
            hasMorePost = false
            return
        }
        displayPosts(posts)
        currentPage += 1
    })
}

let currentIndex = 0;
let currentImages = [];

const openLightbox = (src, images) => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  
  currentImages = images;
  currentIndex = images.indexOf(src);

  lightboxImage.src = src;
  lightbox.classList.add("show");
};

const closeLightbox = () => {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("show");
};
window.closeLightbox = closeLightbox

const prevImage = () => {
  if (currentIndex > 0) {
    currentIndex--;
    document.getElementById("lightboxImage").src = currentImages[currentIndex];
  }
};

const nextImage = () => {
  if (currentIndex < currentImages.length - 1) {
    currentIndex++;
    document.getElementById("lightboxImage").src = currentImages[currentIndex];
  }
};

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("post-image")) {
    const images = Array.from(e.target.closest(".post-images-grid").querySelectorAll("img")).map(img => img.src);
    openLightbox(e.target.src, images);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "ArrowRight") nextImage();
  if (e.key === "Escape") closeLightbox();
});


document.addEventListener('DOMContentLoaded', loadPosts);