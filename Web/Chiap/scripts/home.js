
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
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                localStorage.removeItem("token");
                window.location.href = window.location.origin;
            }
            throw new Error("Lỗi khi tải danh sách bạn bè.");
        }
        return response.json();
    })
    .then(friends => {
        const friendList = document.getElementById('friendList');
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar ? friend.avatar : '../img/default-avatar.png';

                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                friendItem.onclick = () => openChat(friend._id, friend.name, friendAvatar);

                friendItem.innerHTML = `
                    <div class='chatUser'>
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
const socket = io(`${API_URL}`);
socket.on('receiveMessage', (message) => {
    // console.log('Nhận tin nhắn:', message);
});

socket.on('disconnect', () => {
    console.log(Error);
});
function connectSocket() {
    socket.on('connect', () => {
        const userId = localStorage.getItem('userId');
        // console.log('Đã kết nối với server:', socket.id);
        if (userId) {
            socket.emit('register', userId);
            console.log(`Đã gửi sự kiện đăng ký userId: ${userId}`);
        } else {
            console.error('Không tìm thấy userId trong localStorage.');
        }
    });
}
window.connectSocket = connectSocket;

function openChat(friendId, friendName, friendAvatar, page = 1) {
    const chatPopup = document.getElementById("chatPopup")
    document.getElementById("username").textContent = friendName;
    document.getElementById("avatar").src = friendAvatar
    const chatArea = document.getElementById('chatMessages');

    fetch(`${API_URL}/api/messages/${friendId}?page=${page}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
        if (!response.ok) throw new Error('Lỗi khi lấy tin nhắn');
        return response.json();
    })
    .then(messages => {
        chatArea.innerHTML = '';

        if (messages.length === 0) {
            chatArea.innerHTML = '<p>Không có tin nhắn nào.</p>';
        } else {
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', message.sender === friendId ? 'received' : 'sent');

                const fileUrl = message.fileUrl;

                messageDiv.innerHTML = `
                    ${message.sender === friendId ? `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : '<img src="" alt="Bạn" style="display: none;">'}
                    <div class="msgContent">
                        ${message.content ? `<div class="messageContent"><p>${message.content.replace(/\n/g, '<br>')}</p></div>` : ''}
                        ${fileUrl ? `<img src="${fileUrl}" class="imgContent" onclick="openImage('${fileUrl}')"/>` : ''}
                    </div>
                `;
                chatArea.appendChild(messageDiv);
            });
        }

        chatArea.scrollTop = chatArea.scrollHeight;
        connectSocket()
    })
    .catch(error => {
        console.error('Lỗi khi lấy tin nhắn:', error);
        chatArea.innerHTML = '<p>Không thể tải tin nhắn. Vui lòng thử lại sau.</p>';
    });
    
    chatPopup.style.display = "flex";
    
}

function closeChat() {
    document.getElementById("chatPopup").style.display = "none";
}
window.closeChat = closeChat;

getFriends();


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
        const authorName = post.author.name || 'Người dùng ẩn danh'
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
document.addEventListener('DOMContentLoaded', loadPosts);