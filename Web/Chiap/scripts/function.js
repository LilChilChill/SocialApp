const API_URL = import.meta.env.VITE_API_URL;

const userAvatar = document.getElementById('userAvatar');
let currentUser = {};

function listDisplay() {
    document.getElementById('list').style.display = document.getElementById('list').style.display === 'none' ? 'flex' : 'none';
}

const getUserInfo = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Vui lòng đăng nhập trước khi truy cập thông tin.');
        window.location.href = window.location.origin;
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            currentUser = await res.json();
            displayUserInfo(currentUser);
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Không thể lấy thông tin người dùng.');
            window.location.href = window.location.origin;
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
const displayUserInfo = (user) => {
    localStorage.setItem('userId', user._id);
    const avatarUrl = user.avatar ? user.avatar : '../assets/profile-default.png';

    userAvatar.innerHTML = `
        <img class="user-avatar" src="${avatarUrl}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border-color: #000">
    `;
};
getUserInfo()

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const userList = document.getElementById('userList');
const notification = document.getElementById('notification');
const error = document.getElementById('error');

const searchUsers = async () => {
    const query = searchInput.value.trim()
    // const query = removeAccents(searchInput.value.trim().toLowerCase());
    userList.innerHTML = ''
    notification.style.display = 'none'
    error.style.display = 'none'

    if (!query) {
        error.innerHTML = 'Vui lòng nhập tên để tìm kiếm.';
        error.style.display = 'block';
        return;
    }

    const token = localStorage.getItem('token'); 

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để thực hiện hành động này.'; 
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/search?query=${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorMessage = await response.json();
            error.innerHTML = errorMessage.message;
            error.style.display = 'block';
            return;
        }

        const users = await response.json();

        if (users.length === 0) {
            userList.innerHTML = '<p>Không tìm thấy người dùng nào.</p>';
        } else {
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.classList.add('user-item');
                
                const avatarUrl = user.avatar ? user.avatar : '../assets/profile-default.png';
                
                userItem.innerHTML = `
                    <div class='userName'> 
                        <img onclick="goToProfile('${user._id}')" src="${avatarUrl}" alt="${user.name}" id="avatar">
                        <span onclick="goToProfile('${user._id}')">${user.name}</span>    
                    </div>
                    <button onclick="addFriend('${user._id}')">Thêm bạn</button>
                `;
                userList.appendChild(userItem);
            });
        }
    } catch (error) {
        console.error(error);
        error.innerHTML = 'Có lỗi xảy ra trong quá trình tìm kiếm.';
        error.style.display = 'block';
    }
};



const addFriend = async (receiverId) => {
    notification.style.display = 'none'; 
    error.style.display = 'none'; 

    const token = localStorage.getItem('token'); 

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để thực hiện hành động này.'; 
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/friends/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ receiverId }) 
        });

        if (response.ok) {
            notification.innerHTML = `Đã gửi lời mời kết bạn tới người dùng ID: ${receiverId}`;
            notification.style.display = 'block';
            notification.style.justifyContent = 'center';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
        } else {
            const errorMessage = await response.json();
            error.innerHTML = `Lỗi: ${errorMessage.message}`;
            error.style.display = 'block';
            setTimeout(() => {
                error.style.display = 'none';
            }, 2000);
        }
    } catch (error) {
        console.error(error);
        error.innerHTML = 'Có lỗi xảy ra khi gửi lời mời kết bạn.';
        error.style.display = 'block';
    }
};

window.addFriend = addFriend;

searchButton.addEventListener('click', searchUsers);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchUsers();
        userList.style.display = 'flex';
    }
});

let debounceTimer;

searchInput.addEventListener('input', () => {
    userList.style.display = 'flex';

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        if (searchInput.value.trim() !== '') {
            searchUsers();
        } else {
            userList.innerHTML = '';
            userList.style.display = 'none';
        }
    }, 300);
});


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
                const friendAvatar = friend.avatar ? friend.avatar : '../assets/profile-default.png';

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

const goToProfile = (userId) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
        window.location.href = window.location.origin + '/components/profile.html';
    } else {
        window.location.href = window.location.origin + '/components/user.html?userId=' + userId;
        ;
        
    }
};

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
    event.preventDefault();
    const chatPopup = document.getElementById("chatPopup")
    chatPopup.style.display = "none";
    const messageInput = document.getElementById("messageInput")
    messageInput.value = '';
}
window.closeChat = closeChat;

function toggleMessage() {
    event.preventDefault();
    const chatMessage = document.getElementById("chatMessage");
    chatMessage.style.display = chatMessage.style.display === 'none' ? 'flex' : 'none';
}
window.toggleMessage = toggleMessage;

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeChat();
        const chatMessage = document.getElementById("chatMessage");
        chatMessage.style.display = 'none';

        userList.style.display = 'none'
        searchInput.value = '';
    }
})

getFriends();

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

const downloadImage = async () => {
    const imageSrc = document.getElementById("lightboxImage").src;
    
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "downloaded-image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
    }
  };
window.downloadImage = downloadImage;
    
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
    userList.style.display = "none";
    searchInput.value = '';
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "ArrowRight") nextImage();
  if (e.key === "Escape") closeLightbox();
});

