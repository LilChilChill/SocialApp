const API_URL = import.meta.env.VITE_API_URL;
const socket = io(`${API_URL}`);

const userAvatar = document.getElementById('userAvatar');
let currentUser = {};

let currentFriendId = null;
let friendAvatar = null;
let friendName = null; 
let currentPage = 1;
let selectedFile = null; 
let cachedImages = [];
let imagesFetched = false;
let tempImages = [];
let currentImageIndex = 0;
let hasMoreImages = true;

let localStream;
let peerConnection;


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
    const avatarUrl = user.avatar ? user.avatar : '../img/profile-default.png';

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
                
                const avatarUrl = user.avatar ? user.avatar : '../img/profile-default.png';
                
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
    connectSocket()
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
        const chatMessage = document.getElementById('chatMessage');
        chatMessage.style.display = 'none';

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar 
                    ? friend.avatar 
                    : '../img/profile-default.png';
                    
                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                // friendItem.onclick = () => {
                //     openChat(friend._id, friend.name, friendAvatar);
                // };
                friendItem.innerHTML = `
                    <div class='chatUser' onclick="openChatEncoded('${encodeBase64Unicode(friend._id)}', '${encodeBase64Unicode(friend.name)}', '${encodeBase64Unicode(friendAvatar)}')" >
                        <img  src="${friendAvatar}" alt="${friend.name}" class="avatar">
                        <div class='content'>
                            <span>${friend.name}</span>
                        </div>
                    </div>
                `;
                friendList.appendChild(friendItem);
                
                const friendItemClone = friendItem.cloneNode(true);
                chatMessage.appendChild(friendItemClone);

                friendItemClone.onclick = () => {
                    chatMessage.style.display = 'none';
                
                };
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách bạn bè:', error);
        document.getElementById('friendList').innerHTML = '<p>Không thể tải danh sách bạn bè. Vui lòng thử lại sau.</p>';
    });
}

function decodeBase64Unicode(str) {
    return decodeURIComponent(escape(atob(str)));
}
function encodeBase64Unicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}
function openChatEncoded(encodedId, encodedName, encodedAvatar) {
    const friendId = decodeBase64Unicode(encodedId);
    const friendName = decodeBase64Unicode(encodedName);
    const friendAvatar = decodeBase64Unicode(encodedAvatar);

    openChat(friendId, friendName, friendAvatar);
}
window.openChatEncoded = openChatEncoded;



const goToProfile = (userId) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
        window.location.href = window.location.origin + '/components/profile.html';
    } else {
        window.location.href = window.location.origin + '/components/user.html?userId=' + userId;
        ;
        
    }
};


socket.on('disconnect', () => {
    console.log(Error);
});
function connectSocket() {
    socket.on('connect', () => {
        // console.log('Đã kết nối với server:', socket.id);

        const userId = localStorage.getItem('userId');
        if (userId) {
            socket.emit('register', userId);
            // console.log(`Đã gửi sự kiện đăng ký userId: ${userId}`);
        } else {
            console.error('Không tìm thấy userId trong localStorage.');
        }
    });

    socket.on('disconnect', () => {
        console.warn('Mất kết nối với server.');
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`Đã kết nối lại sau lần thử thứ ${attemptNumber}`);
        const userId = localStorage.getItem('userId');
        if (userId) {
            socket.emit('register', userId);
            console.log(`Đã gửi lại sự kiện đăng ký userId: ${userId} sau khi reconnect.`);
        }
    });
}

window.connectSocket = connectSocket;


socket.on('receiveMessage', (message) => {
    // console.log('Nhận tin nhắn:', message);
});
const chatArea = document.getElementById('chatArea');

function openChat(friendId, friendName, avatar, page = 1) {
    currentFriendId = friendId;
    friendAvatar = avatar;
    const chatPopup = document.getElementById("chatPopup")
    document.getElementById("username").textContent = friendName;
    document.getElementById("avatar").src = friendAvatar
    const chatArea = document.getElementById('chatArea');

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
                const fileType = message.fileType;
                let filePreviewHtml = '';

                if (fileUrl) {
                    if (fileType.startsWith('image/')) {
                        filePreviewHtml = `<img src="${fileUrl}" class="imgContent" onclick="openImage('${fileUrl}')"/>`;
                    } else if (fileType.startsWith('video/')) {
                        filePreviewHtml = `<video controls class="videoContent"><source src="${fileUrl}" type="${fileType}">Trình duyệt không hỗ trợ video.</video>`;
                    } else if (fileType === 'application/pdf') {
                        filePreviewHtml = `<a href="${fileUrl}" target="_blank" class="fileLink">📄 Xem PDF</a>`;
                    } else {
                        filePreviewHtml = `<a href="${fileUrl}" download class="fileLink">📎 ${message.fileName || 'Tải xuống file'}</a>`;
                    }
                }

                messageDiv.innerHTML = `
                    ${message.sender === friendId ? `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : '<img src="" alt="Bạn" style="display: none;">'}
                    <div class="msgContent">
                        ${message.content ? `<div class="messageContent"><p>${message.content.replace(/\n/g, '<br>')}</p></div>` : ''}
                        ${filePreviewHtml}
                    </div>
                `;
                chatArea.appendChild(messageDiv);
            });
        }

        chatArea.scrollTop = chatArea.scrollHeight;
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
    const messageInput = document.getElementById("chatInput")
    messageInput.value = '';
    const fileInput = document.getElementById("inputPreview")
    fileInput.innerHTML = '';
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

//-------------------------------MESSAGE FUNCTION
document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileInput = event.target;
    selectedFile = fileInput.files[0]; 

    const chatInput = document.getElementById('inputPreview');
    chatInput.innerHTML = ''; 

    if (selectedFile) {
        if (selectedFile.type.startsWith('image/')) {
            chatInput.innerHTML = `<img src="${URL.createObjectURL(selectedFile)}" alt="Selected File" class="imgPreview"/>`;
        } else {
            chatInput.innerHTML = `<p>${selectedFile.name}</p>`;
        }
    }
});

async function compressImage(file, maxSizeMB = 25, quality = 0.8) { 
    if (file.size / 1024 / 1024 <= maxSizeMB) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const maxWidth = 1920;
                const maxHeight = 1080;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    } else {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(async (blob) => {
                    if (blob.size / 1024 / 1024 > maxSizeMB && quality > 0.1) {
                        resolve(await compressImage(file, maxSizeMB, quality - 0.1));
                    } else {
                        resolve(new File([blob], file.name, { type: "image/jpeg" }));
                    }
                }, "image/jpeg", quality);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// window.openImage = openImage

document.getElementById('sendButton').addEventListener('click', async () => {
    const messageInput = document.getElementById('chatInput');
    const content = messageInput.value.trim();

    if (!content && !selectedFile) return;
    if (!currentFriendId) return;

    let fileToSend = selectedFile;
    let previewUrl = null;
    let filePreviewHtml = '';

    // Nếu có file ảnh thì nén
    if (fileToSend && fileToSend.type.startsWith('image/')) {
        try {
            fileToSend = await compressImage(fileToSend);
        } catch (error) {
            console.error('Lỗi khi nén ảnh:', error);
            return;
        }
    }

    if (fileToSend) {
        const fileType = fileToSend.type;
        const tempUrl = URL.createObjectURL(fileToSend);
        previewUrl = tempUrl;

        if (fileType.startsWith('image/')) {
            filePreviewHtml = `<img src="${tempUrl}" class="imgContent" onclick="openImage('${tempUrl}')"/>`;
        } else if (fileType.startsWith('video/')) {
            filePreviewHtml = `<video controls class="videoContent"><source src="${tempUrl}" type="${fileType}">Trình duyệt không hỗ trợ video.</video>`;
        } else if (fileType === 'application/pdf') {
            filePreviewHtml = `<a href="${tempUrl}" target="_blank" class="fileLink">📄 Xem PDF</a>`;
        } else {
            filePreviewHtml = `<a href="${tempUrl}" download class="fileLink">📎 ${fileToSend.name}</a>`;
        }
    }

    const messageData = new FormData();
    messageData.append('receiverId', currentFriendId);
    messageData.append('content', content);
    if (fileToSend) messageData.append('file', fileToSend);

    // Hiển thị tin nhắn tạm thời
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'sent');

    if (chatArea.innerHTML === '<p>Không có tin nhắn nào.</p>') {
        chatArea.innerHTML = '';
    }

    messageDiv.innerHTML = `
        <div class="msgContent">
            ${content ? `<div class="messageContent"><p>${content.replace(/\n/g, '<br>')}</p></div>` : ''}
            ${filePreviewHtml}
        </div>
    `;
    document.getElementById('chatArea').appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: messageData
    })
    .then(response => response.json())
    .then(data => {
        messageInput.value = '';
        document.getElementById('inputPreview').innerHTML = '';

        const messagePayload = {
            chatType: 'private',
            receiverId: currentFriendId,
            sender: localStorage.getItem('userId'),
            content: content,
            fileUrl: data.messageData.fileUrl || null,
            fileType: data.messageData.fileType || null,
            date: data.messageData.date
        };

        // Gửi socket
        socket.emit('sendMessage', messagePayload);
        // Cập nhật file URL chính xác từ GCS
        if (data.messageData.fileUrl) {
            setTimeout(() => {
                const img = messageDiv.querySelector(".imgContent");
                const video = messageDiv.querySelector("video source");
                const fileLink = messageDiv.querySelector(".fileLink");

                if (img) {
                    img.src = data.messageData.fileUrl;
                } else if (video) {
                    video.src = data.messageData.fileUrl;
                    video.parentElement.load();
                } else if (fileLink) {
                    fileLink.href = data.messageData.fileUrl;
                }
            }, 0);
        }

        selectedFile = null;
    })
    .catch(error => {
        console.error('Lỗi khi gửi tin nhắn:', error);
    });
});

// Nhận tin nhắn
socket.on('receiveMessage', (messageData) => {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageData.sender === currentFriendId ? 'received' : 'sent');

    const fileUrl = messageData.fileUrl; 
    const fileType = messageData.fileType;
    const avatarUrl = messageData.sender === currentFriendId ? friendAvatar : '../img/profile-default.png';

    if (chatArea.innerHTML === '<p>Không có tin nhắn nào.</p>') {
        chatArea.innerHTML = '';
    }
    let fileElement = '';

    if (fileUrl) {
        if (fileType.startsWith('image/')) {
            fileElement = `<img src="${fileUrl}" class="imgContent" onclick="openImage(this.src)" />`;
        } else if (fileType === 'application/pdf') {
            fileElement = `<a href="${fileUrl}" target="_blank" class="fileLink">📄 Xem PDF</a>`;
        } else if (fileType.startsWith('video/')) {
            fileElement = `<video controls class="videoContent"><source src="${fileUrl}" type="${fileType}">Trình duyệt không hỗ trợ video.</video>`;
        } else {
            const fileName = fileUrl.split('/').pop();
            fileElement = `<a href="${fileUrl}" download class="fileLink">📎 Tải xuống: ${fileName}</a>`;
        }
    }

    messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="${messageData.sender === currentFriendId ? friendName : 'Bạn'}" class="avatar">
        <div class="msgContent" id="msgContent">
            ${messageData.content ? `<div class="messageContent"><p>${messageData.content.replace(/\n/g, '<br>')}</p></div>` : ''}
            ${fileElement}
        </div>
    `;

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
});

let isLoadingMessages = false; 

document.getElementById('chatArea').addEventListener('scroll', () => {
    const chatArea = document.getElementById('chatArea');
    
    if (chatArea.scrollTop === 0 && !isLoadingMessages) {
        loadOlderMessages();
    }
});

let hasMoreMessages = true;
function loadOlderMessages() {
    if (!hasMoreMessages || isLoadingMessages) return;
    
    isLoadingMessages = true;

    fetch(`${API_URL}/api/messages/${currentFriendId}?page=${currentPage + 1}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi lấy tin nhắn cũ');
        }
        return response.json();
    })
    .then(messages => {
        if (messages.length === 0) {
            hasMoreMessages = false; 
            return;
        }

        const chatArea = document.getElementById('chatArea');
        const fragment = document.createDocumentFragment(); 

        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', message.sender === currentFriendId ? 'received' : 'sent');

            const fileUrl = message.fileUrl;
            const fileType = message.fileType;
            let fileElement = '';
            if (fileUrl) {
                if (fileType.startsWith('image/')) {
                    fileElement = `<img src="${fileUrl}" class="imgContent" onclick="openImage(this.src)" />`;
                } else if (fileType === 'application/pdf') {
                    fileElement = `<a href="${fileUrl}" target="_blank" class="fileLink">📄 Xem PDF</a>`;
                } else if (fileType.startsWith('video/')) {
                    fileElement = `<video controls class="videoContent"><source src="${fileUrl}" type="${fileType}">Trình duyệt không hỗ trợ video.</video>`;
                } else {
                    const fileName = fileUrl.split('/').pop();
                    fileElement = `<a href="${fileUrl}" download class="fileLink">📎 Tải xuống: ${fileName}</a>`;
                }
            }

            messageDiv.innerHTML = `
                ${message.sender === currentFriendId ? 
                    `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : 
                    `<img src="" alt="Bạn" style="display: none;">`}
                <div class="msgContent">
                    <div class="messageContent">
                        <p>${message.content.replace(/\n/g, '<br>')}</p>
                    </div>
                    ${fileElement}
                </div>
            `;

            fragment.appendChild(messageDiv);
        });

        chatArea.insertBefore(fragment, chatArea.firstChild);

        currentPage++; 
        
    })
    .catch(error => {
        console.error('Lỗi khi lấy tin nhắn cũ:', error);
    })
    .finally(() => {
        isLoadingMessages = false;
    });
}


getFriends();