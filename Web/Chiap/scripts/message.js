const API_URL = import.meta.env.VITE_API_URL
document.title = "Chiap"

const socket = io(`${API_URL}`);
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

socket.on('signal', ({ type, data }) => {
    handleSignal(type, data);
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
connectSocket()

socket.on('receiveMessage', (message) => {
    // console.log('Nhận tin nhắn:', message);
});

socket.on('disconnect', () => {
    console.log(Error);
});

//----------------------------------------------------- PRIVATE CHAT -------------------------------------------------------------\\
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
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar 
                    ? friend.avatar 
                    : '../img/profile-default.png';

                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                friendItem.innerHTML = `
                   <div class='chatUser' onclick="openChatEncoded('${encodeBase64Unicode(friend._id)}', '${encodeBase64Unicode(friend.name)}', '${encodeBase64Unicode(friendAvatar)}')">
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

function openChat(friendId, name, avatar, page = 1) {
    friendName = name;
    friendAvatar = avatar;
    document.getElementById('username').textContent = friendName;
    document.getElementById('avatar').src = friendAvatar;
    currentFriendId = friendId;
    currentPage = 1;
    hasMoreMessages = true;
    console.log(`Current friend ID: ${currentFriendId}`)

    const deleteBtn = document.getElementById('deleteChatButton');
    const friendInfo = document.getElementById('headerSide');
    const chatArea = document.getElementById('chatArea');
    const fileData = document.getElementById('file');

    friendInfo.innerHTML = `<div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div>`;
    chatArea.innerHTML = `<div style="display: flex; justify-content: center;"><div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div></div>`;
    fileData.innerHTML = '';

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
        friendInfo.innerHTML = '';
        fileData.innerHTML = '';
        deleteBtn.innerHTML = '';

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

        friendInfo.innerHTML = `
            <img src="${friendAvatar}" alt="Ảnh đại diện" id="headerAva"/>
            <p>${friendName}</p>
            <div>
                <a href="#"><i class="fa-solid fa-bell"></i></a>
                <a href="#"><i class="fa-solid fa-magnifying-glass"></i></a>
            </div>
        `;

        fileData.innerHTML = `
            <a href="#" onclick="fileToggle()"><p>File phương tiện & file</p></a>
            <div style="display: none" id="fileDisplay">
                <a href="#" onclick="toggleImages()"><p>- File phương tiện</p></a>
                <div style="display: none" id="fileImageDisplay"></div>
                <a href="#"><p>- File</p></a>
            </div>
        `;

        deleteBtn.innerHTML = `
            <i class="fa-regular fa-trash-can"></i>
            <p>Xóa lịch sử trò chuyện</p>
        `;

        chatArea.scrollTop = chatArea.scrollHeight;
        fetchAllImages();
    })
    .catch(error => {
        console.error('Lỗi khi lấy tin nhắn:', error);
        chatArea.innerHTML = '<p>Không thể tải tin nhắn. Vui lòng thử lại sau.</p>';
    });
}

window.openChat = openChat;

function encodeBase64Unicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64Unicode(str) {
    return decodeURIComponent(escape(atob(str)));
}

function openChatEncoded(encodedId, encodedName, encodedAvatar) {
    const friendId = decodeBase64Unicode(encodedId);
    const friendName = decodeBase64Unicode(encodedName);
    const friendAvatar = decodeBase64Unicode(encodedAvatar);

    openChat(friendId, friendName, friendAvatar);
}
window.openChatEncoded = openChatEncoded;


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

window.openImage = openImage

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
    const avatarUrl = messageData.sender === currentFriendId ? friendAvatar : '../img/default-avatar.png';

    console.log('FriendAvatar', friendAvatar);

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



window.toggleImages = toggleImages;



document.getElementById('deleteChatButton').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không?')) {
        fetch(`${API_URL}/api/messages/delete/${currentFriendId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi xóa lịch sử chat');
            }
            document.getElementById('chatArea').innerHTML = '<p>Đã xóa lịch sử chat.</p>';
            openChat(currentFriendId, friendName, friendAvatar);
        })
        .catch(error => {
            console.error('Lỗi khi xóa lịch sử chat:', error);
        });
    }
});



let isLoadingMessages = false; 

document.getElementById('chatArea').addEventListener('scroll', () => {
    const chatArea = document.getElementById('chatArea');
    
    if (chatArea.scrollTop === 0 && !isLoadingMessages) {
        loadOlderMessages();
    }
});

function switchChat(newFriendId, newFriendAvatar, newFriendName) {
    if (currentFriendId === newFriendId) return;

    currentFriendId = newFriendId;
    friendAvatar = newFriendAvatar;
    friendName = newFriendName;

    currentPage = 1;
    hasMoreMessages = true;
    isLoadingMessages = false;
    document.getElementById('chatArea').innerHTML = ''; 
    loadOlderMessages();

    cachedImages = [];
    imagesFetched = false;
    hasMoreImages = true;

    document.getElementById('fileImageDisplay').innerHTML = '';

    console.log(`Đã chuyển sang chat với ${friendName} - ID: ${currentFriendId}`);
}



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
                ${message.sender === currentFriendId ? 
                    `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : 
                    `<img src="" alt="Bạn" style="display: none;">`}
                <div class="msgContent">
                    <div class="messageContent">
                        <p>${message.content.replace(/\n/g, '<br>')}</p>
                    </div>
                    ${filePreviewHtml}
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


document.getElementById('chatInput').addEventListener('keydown', (event) => {
    
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        document.getElementById('sendButton').click(); 
    }
});


function imgFileToggle(){
    document.getElementById('imgFile').style.display = document.getElementById('imgFile').style.display === 'none'? 'flex' : 'none';
}


function sideMenu(){
    document.getElementById('sideMenu').style.display = document.getElementById('sideMenu').style.display === 'none'? 'flex' : 'none';
    document.getElementById('icon').style.left = document.getElementById('icon').style.left === '65%' ? '86%' : '65%';
}
window.sideMenu = sideMenu

function emojiToggle(){
    document.getElementById('emoji').style.display = document.getElementById('emoji').style.display === 'none'? 'flex' : 'none';
}
function fileToggle(){
    document.getElementById('fileDisplay').style.display = document.getElementById('fileDisplay').style.display === 'none'? 'flex' : 'none';
}
window.fileToggle = fileToggle

function fetchAllImages() {
    return fetch(`${API_URL}/api/messages/images/${currentFriendId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi lấy ảnh');
        }
        return response.json();
    })
    .then(data => {
        cachedImages = data.images || []; 
        imagesFetched = true;
        renderImages();
    })
    .catch(error => {
        console.error('Lỗi khi tải ảnh:', error);
        document.getElementById('fileImageDisplay').innerHTML = '<p>Lỗi khi tải ảnh.</p>';
    });
}

function toggleImages() {
    const fileImageDisplay = document.getElementById('fileImageDisplay');
    
    if (fileImageDisplay.style.display === 'block') {
        fileImageDisplay.style.display = 'none';
        return;
    }
    
    fileImageDisplay.style.display = 'block';
    fileImageDisplay.innerHTML = '<p>Đang tải ảnh...</p>';
    
    // if (!imagesFetched) {
    //     fetchAllImages();
    // } else {
    //     renderImages();
    // }
    renderImages()
}

function renderImages() {
    const fileImageDisplay = document.getElementById('fileImageDisplay');
    fileImageDisplay.innerHTML = '';
    
    if (cachedImages.length === 0) {
        fileImageDisplay.innerHTML = '<p>Không có ảnh nào.</p>';
        return;
    }
    
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');
    
    cachedImages.forEach(image => {
        if (!image.fileUrl) return;
        
        const imgElement = document.createElement('img');
        imgElement.src = image.fileUrl;
        imgElement.onclick = () => openImage(image.fileUrl);
        imageContainer.appendChild(imgElement);
    });
    
    fileImageDisplay.appendChild(imageContainer);
}

function openImage(src) {
    document.getElementById('popupImage').src = src;
    document.getElementById('imagePopup').style.display = 'block';
    currentImageIndex = cachedImages.findIndex(image => image.fileUrl === src);

    updateImage();

}

function closeImage() {
    document.getElementById('imagePopup').style.display = 'none';
}

function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateImage();
    }
}

function nextImage() {
    if (currentImageIndex < cachedImages.length - 1) {
        currentImageIndex++;
        updateImage();
    }
}

function updateImage() {
    const image = cachedImages[currentImageIndex];
    if (!image) return;

    const fileUrl = image.fileUrl
    
    if(fileUrl){
        document.getElementById('popupImage').src = fileUrl
        updateDownloadLink();
    }
    
    document.querySelector('.prev-btn').style.display = currentImageIndex === 0 ? 'none' : 'block';
    document.querySelector('.next-btn').style.display = currentImageIndex === cachedImages.length - 1 ? 'none' : 'block';
}

function updateDownloadLink() {
    const downloadBtn = document.getElementById('downloadBtn');
    const imageUrl = document.getElementById('popupImage').src;

    fetch(imageUrl)
        .then(response => response.blob())  
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            downloadBtn.href = blobUrl;
            downloadBtn.setAttribute('download', `image_${currentImageIndex + 1}.jpg`);
        })
        .catch(error => console.error("Lỗi khi tải ảnh:", error));
}


window.toggleImages = toggleImages;
window.closeImage = closeImage;
window.prevImage = prevImage;
window.nextImage = nextImage;


document.addEventListener("click", function (event) {
    if (event.target.id === "imagePopup") {
        closeImage();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeImage();
    }
    if (event.key === "ArrowLeft") {
        prevImage();
    }
    if (event.key === "ArrowRight") {
        nextImage();
    }
});

getFriends();