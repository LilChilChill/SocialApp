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
let mediaIndexes = [];      
let currentMediaPos = 0;


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
    // ===== RESET SIDE MENU STATE =====
    cachedImages = [];
    currentImageIndex = 0;

    const imgBox = document.getElementById('fileImageDisplay');
    const otherBox = document.getElementById('fileOtherDisplay');
    if (imgBox) imgBox.innerHTML = '';
    if (otherBox) otherBox.innerHTML = '';

    // ===== SET CHAT INFO =====
    friendName = name;
    friendAvatar = avatar;
    currentFriendId = friendId;

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

                // Xử lý mảng files
                let filePreviewHtml = '';
                if (message.files && message.files.length > 0) {
                    message.files.forEach(file => {
                        if (file.mimeType.startsWith('image/')) {
                            filePreviewHtml += `<img src="${file.url}" class="imgContent" onclick="openImage('${file.url}')"/>`;
                        } else if (file.mimeType.startsWith('video/')) {
                            filePreviewHtml += `
                                                <video 
                                                    class="videoContent"
                                                    controls
                                                    preload="metadata"
                                                    playsinline
                                                >
                                                    <source src="${file.url}" type="${file.mimeType}">
                                                    Trình duyệt không hỗ trợ video.
                                                </video>
                                                `;
                        } else if (file.mimeType === 'application/pdf') {
                            filePreviewHtml += `<a href="${file.url}" target="_blank" class="fileLink">📄 Xem PDF</a>`;
                        } else {
                            const fileName = file.fileName || 'Tệp đính kèm';
                            filePreviewHtml += `
                                <div class="fileAttachment">
                                    <div class="fileIcon">📎</div>
                                    <div class="fileInfo">
                                        <span class="fileName">${fileName}</span>
                                        <a href="${file.url}" download class="downloadBtn">Tải xuống</a>
                                    </div>
                                </div>`;
                        }
                    });
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
        <a href="#" onclick="fileToggle()">
            <p>File phương tiện & file</p>
        </a>
    
        <div style="display:none" id="fileDisplay">
            <a href="#" onclick="toggleImages()">
                <p>- Hình ảnh / Video</p>
            </a>
            <div style="display:none" id="fileImageDisplay"></div>
    
            <a href="#" onclick="toggleOtherFiles()">
                <p>- Tệp khác</p>
            </a>
            <div style="display:none" id="fileOtherDisplay"></div>
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

// ---------- Gửi tin nhắn ----------
document.getElementById('sendButton').addEventListener('click', async () => {
    const messageInput = document.getElementById('chatInput');
    const content = messageInput.value.trim();
    if (!content && !selectedFile) return; 
    if (!currentFriendId) return;

    let fileToSend = selectedFile;

    // Nén ảnh nếu quá lớn
    if (fileToSend && fileToSend.type.startsWith('image/')) {
        try {
            fileToSend = await compressImage(fileToSend);
        } catch (error) {
            console.error('Lỗi khi nén ảnh:', error);
            return;
        }
    }

    // Tạo FormData gửi lên server
    const messageData = new FormData();
    messageData.append('receiverId', currentFriendId);
    messageData.append('content', content);
    if (fileToSend) messageData.append('file', fileToSend);

    // Append tin nhắn tạm thời vào DOM
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'sent');

    let filePreviewHtml = '';
    if (fileToSend) {
        const tempUrl = URL.createObjectURL(fileToSend);
        if (fileToSend.type.startsWith('image/')) {
            filePreviewHtml = `<img src="${tempUrl}" class="imgContent"/>`;
        } else if (fileToSend.type.startsWith('video/')) {
            filePreviewHtml = `<video controls class="videoContent"><source src="${tempUrl}" type="${fileToSend.type}"></video>`;
        } else if (fileToSend.type === 'application/pdf') {
            filePreviewHtml = `<a href="${tempUrl}" target="_blank" class="fileLink">📄 ${fileToSend.name}</a>`;
        } else {
            filePreviewHtml = `
                <div class="fileAttachment">
                    <div class="fileIcon">📎</div>
                    <div class="fileInfo">
                        <span class="fileName">${fileToSend.name}</span>
                        <a href="${tempUrl}" download class="downloadBtn">Tải xuống</a>
                    </div>
                </div>`;
        }
    }

    messageDiv.innerHTML = `
        <div class="msgContent">
            ${content ? `<div class="messageContent"><p>${content.replace(/\n/g, '<br>')}</p></div>` : ''}
            ${filePreviewHtml}
        </div>
    `;
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    // Gửi lên server
    fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: messageData
    })
    .then(res => res.json())
    .then(data => {
        messageInput.value = '';
        document.getElementById('inputPreview').innerHTML = '';
        selectedFile = null;

        const messagePayload = {
            chatType: "private",
            receiverId: currentFriendId,
            sender: localStorage.getItem("userId"),
            content: content,
            date: data.messageData.date,
        
            files: data.messageData.files.map(f => ({
                fileUrl: f.url,
                fileType: f.mimeType,
                fileName: f.fileName
            }))
        };
        

        // // Cập nhật DOM với URL thực sự từ server
        // const fileElement = messageDiv.querySelector(".imgContent, video source, .fileLink, .downloadBtn");
        // if (fileElement && messagePayload.fileUrl) {
        //     if (fileElement.tagName === 'IMG') fileElement.src = messagePayload.fileUrl;
        //     if (fileElement.tagName === 'SOURCE') {
        //         fileElement.src = messagePayload.fileUrl;
        //         fileElement.parentElement.load();
        //     }
        //     if (fileElement.classList.contains('fileLink') || fileElement.classList.contains('downloadBtn')) {
        //         fileElement.href = messagePayload.fileUrl;
        //     }
        // }

        if (messagePayload.files.length > 0) {
            const firstFile = messagePayload.files[0];
            const fileElement = messageDiv.querySelector(".imgContent, video source, .fileLink, .downloadBtn");
        
            if (fileElement) {
                if (fileElement.tagName === "IMG") fileElement.src = firstFile.fileUrl;
        
                if (fileElement.tagName === "SOURCE") {
                    fileElement.src = firstFile.fileUrl;
                    fileElement.parentElement.load();
                }
        
                if (fileElement.classList.contains("fileLink") || 
                    fileElement.classList.contains("downloadBtn")) 
                {
                    fileElement.href = firstFile.fileUrl;
                }
            }
        }
        

        // Gửi socket
        socket.emit('sendMessage', messagePayload);
    })
    .catch(err => console.error('Lỗi khi gửi tin nhắn:', err));
});

// ---------- Nhận tin nhắn từ socket ----------
socket.on("receiveMessage", (messageData) => {
    if (!currentFriendId) return;

    const chatArea = document.getElementById("chatArea");
    const messageDiv = document.createElement("div");

    messageDiv.classList.add(
        "message",
        messageData.sender === currentFriendId ? "received" : "sent"
    );

    const avatarUrl =
        messageData.sender === currentFriendId
            ? friendAvatar
            : "../img/default-avatar.png";

    let fileHtml = "";

    // ---------- XỬ LÝ MẢNG FILES ----------
    if (messageData.files && messageData.files.length > 0) {
        messageData.files.forEach((file) => {
            const url = file.fileUrl;
            const type = file.fileType;

            if (type.startsWith("image/")) {
                fileHtml += `
                    <img src="${url}" 
                         class="imgContent" 
                         onclick="openImage('${url}')"/>`;
            }
            else if (type.startsWith("video/")) {
                fileHtml += `
                    <video class="videoContent" muted onclick="openVideo('${url}')">
                        <source src="${url}" type="${type}">
                        Trình duyệt không hỗ trợ video.
                    </video>
                `;
            }
            
            else if (type === "application/pdf") {
                fileHtml += `
                    <a href="${url}" target="_blank" class="fileLink">
                        📄 ${file.fileName || "PDF"}
                    </a>`;
            }
            else {
                fileHtml += `
                    <div class="fileAttachment">
                        <div class="fileIcon">📎</div>
                        <div class="fileInfo">
                            <span class="fileName">${file.fileName || "Tệp"}</span>
                            <a href="${url}" download class="downloadBtn">Tải xuống</a>
                        </div>
                    </div>`;
            }
        });
    }

    messageDiv.innerHTML = `
        <img src="${avatarUrl}" class="avatar">
        <div class="msgContent">
            ${
                messageData.content
                    ? `<div class="messageContent"><p>${messageData.content.replace(
                          /\n/g,
                          "<br>"
                      )}</p></div>`
                    : ""
            }
            ${fileHtml}
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
            messageDiv.classList.add(
                'message',
                message.sender === currentFriendId ? 'received' : 'sent'
            );

            // ------ Xử lý FILE ĐÚNG FORMAT MỚI ------
            let filePreviewHtml = "";

            if (message.files && message.files.length > 0) {
                message.files.forEach(file => {
                    if (file.mimeType.startsWith("image/")) {
                        filePreviewHtml += `
                            <img src="${file.url}" 
                                 class="imgContent" 
                                 onclick="openImage('${file.url}')"/>`;
                    }
                    else if (file.mimeType.startsWith("video/")) {
                        filePreviewHtml += `
                                            <video 
                                                class="videoContent"
                                                controls
                                                preload="metadata"
                                                playsinline
                                            >
                                                <source src="${file.url}" type="${file.mimeType}">
                                                Trình duyệt không hỗ trợ video.
                                            </video>
                                            `;
                    }
                    else if (file.mimeType === "application/pdf") {
                        filePreviewHtml += `
                            <a href="${file.url}" target="_blank" class="fileLink">
                                📄 Xem PDF
                            </a>`;
                    }
                    else {
                        const fileName = file.fileName || file.url.split("/").pop();
                        filePreviewHtml += `
                            <div class="fileAttachment">
                                <div class="fileIcon">📎</div>
                                <div class="fileInfo">
                                    <span class="fileName">${fileName}</span>
                                    <a href="${file.url}" download class="downloadBtn">Tải xuống</a>
                                </div>
                            </div>`;
                    }
                });
            }

            // ------ Render full message ------
            messageDiv.innerHTML = `
                ${
                    message.sender === currentFriendId
                        ? `<img src="${friendAvatar}" alt="${friendName}" class="avatar">`
                        : `<img src="" style="display:none;">`
                }
                <div class="msgContent">
                    ${
                        message.content
                            ? `<div class="messageContent"><p>${message.content.replace(/\n/g, "<br>")}</p></div>`
                            : ""
                    }
                    ${filePreviewHtml}
                </div>
            `;

            fragment.appendChild(messageDiv);
        });

        chatArea.insertBefore(fragment, chatArea.firstChild);
        currentPage++;

    })
    .catch(error => {
        console.error("Lỗi khi lấy tin nhắn cũ:", error);
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



// --- Side menu toggle và render file/ảnh ---
function sideMenu() {
    if (!currentFriendId) {
        alert("Vui lòng chọn cuộc trò chuyện trước");
        return;
    }

    const side = document.getElementById('sideMenu');
    side.style.display = side.style.display === 'none' ? 'flex' : 'none';

    if (side.style.display === 'flex') {
        fetchAllImages();
    }
}
window.sideMenu = sideMenu;

function emojiToggle(){
    document.getElementById('emoji').style.display = document.getElementById('emoji').style.display === 'none'? 'flex' : 'none';
}
function fileToggle(){
    document.getElementById('fileDisplay').style.display = document.getElementById('fileDisplay').style.display === 'none'? 'flex' : 'none';
}
window.fileToggle = fileToggle

function fetchAllImages() {
    if (!currentFriendId) return;

    return fetch(`${API_URL}/api/messages/images/${currentFriendId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => res.json())
    .then(data => {
        cachedImages = data.files || [];
        buildMediaIndexes();
    })
    .catch(() => {
        cachedImages = [];
        mediaIndexes = [];
    });
}

function buildMediaIndexes() {
    mediaIndexes = [];

    cachedImages.forEach((file, index) => {
        if (
            file.fileType?.startsWith('image/') ||
            file.fileType?.startsWith('video/')
        ) {
            mediaIndexes.push(index);
        }
    });
}


function toggleImages() {
    const box = document.getElementById('fileImageDisplay');
    box.style.display = box.style.display === 'none' ? 'grid' : 'none';

    if (box.style.display === 'grid') {
        renderImages();
    }
}

function renderImages() {
    const box = document.getElementById('fileImageDisplay');
    box.innerHTML = '';

    const media = cachedImages.filter(f =>
        f.fileType?.startsWith('image/') ||
        f.fileType?.startsWith('video/')
    );

    if (media.length === 0) {
        box.innerHTML = '<p>Không có hình ảnh hoặc video</p>';
        return;
    }

    media.forEach(file => {
        // IMAGE
        if (file.fileType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = file.fileUrl;
            img.className = 'file-thumb';
            img.onclick = () => openImage(file.fileUrl);
            box.appendChild(img);
        }
        // VIDEO
        else {
            const video = document.createElement('video');
            video.src = file.fileUrl;
            video.muted = true;
            video.preload = 'metadata';
            video.className = 'file-thumb';
            video.onclick = () => openVideo(file.fileUrl);
            box.appendChild(video);
        }
    });
}


function toggleOtherFiles() {
    const box = document.getElementById('fileOtherDisplay');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';

    if (box.style.display === 'block') {
        renderOtherFiles();
    }
}

function renderOtherFiles() {
    const box = document.getElementById('fileOtherDisplay');
    box.innerHTML = '';

    const files = cachedImages.filter(f =>
        !f.fileType?.startsWith('image/') &&
        !f.fileType?.startsWith('video/')
    );

    if (files.length === 0) {
        box.innerHTML = '<p>Không có tệp khác</p>';
        return;
    }

    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'fileAttachment';
        div.innerHTML = `
            <span>${file.fileName || 'Tệp đính kèm'}</span>
            <a href="${file.fileUrl}" download>Tải xuống</a>
        `;
        box.appendChild(div);
    });
}

function openImage(src) {
    const fileIndex = cachedImages.findIndex(f => f.fileUrl === src);
    const mediaPos = mediaIndexes.indexOf(fileIndex);

    if (mediaPos === -1) return;

    currentMediaPos = mediaPos;
    updateMedia();
}

function closeImage() {
    document.getElementById('imagePopup').style.display = 'none';
}

function openVideo(src) {
    const fileIndex = cachedImages.findIndex(f => f.fileUrl === src);
    const mediaPos = mediaIndexes.indexOf(fileIndex);

    if (mediaPos === -1) return;

    currentMediaPos = mediaPos;
    updateMedia();
}

function closeVideo() {
    const popup = document.getElementById("videoPopup");
    const video = document.getElementById("popupVideo");

    video.pause();
    video.src = "";
    popup.style.display = "none";
}


window.openVideo = openVideo;
window.closeVideo = closeVideo;

function prevImage() {
    if (currentMediaPos > 0) {
        currentMediaPos--;
        updateMedia();
    }
}

function nextImage() {
    if (currentMediaPos < mediaIndexes.length - 1) {
        currentMediaPos++;
        updateMedia();
    }
}

function updateMedia() {
    const fileIndex = mediaIndexes[currentMediaPos];
    const media = cachedImages[fileIndex];
    if (!media) return;

    const imagePopup = document.getElementById('imagePopup');   
    const videoPopup = document.getElementById('videoPopup');
    const imgEl = document.getElementById('popupImage');
    const videoEl = document.getElementById('popupVideo');

    // RESET
    imgEl.style.display = 'none';
    videoEl.style.display = 'none';
    videoEl.pause();
    videoEl.src = '';

    imagePopup.style.display = 'none';
    videoPopup.style.display = 'none';

    // IMAGE
    if (media.fileType.startsWith('image/')) {
        imgEl.src = media.fileUrl;
        imgEl.style.display = 'block';
        imagePopup.style.display = 'flex';
    }

    // VIDEO
    else if (media.fileType.startsWith('video/')) {
        videoEl.src = media.fileUrl;
        videoEl.style.display = 'block';
        videoEl.load();
        videoPopup.style.display = 'flex';
    }

    updateDownloadLink(media);
    updateNavButtons();
}


function updateNavButtons() {
    document.querySelector('.prev-btn').style.display =
        currentMediaPos === 0 ? 'none' : 'block';

    document.querySelector('.next-btn').style.display =
        currentMediaPos === mediaIndexes.length - 1 ? 'none' : 'block';
}

function updateDownloadLink(media) {
    const downloadBtn = document.getElementById("downloadBtn");

    const fileName =
        media.fileName ||
        `file.${media.fileType.startsWith("image/") ? "jpg" : "mp4"}`;

    downloadBtn.onclick = (e) => {
        e.preventDefault();
        forceDownload(media.fileUrl, fileName);
    };
}


async function forceDownload(url, filename = "file") {
    try {
        const response = await fetch(url, { mode: "cors" });
        const blob = await response.blob();

        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error("Download failed:", err);
        alert("Không thể tải file");
    }
}

window.toggleOtherFiles = toggleOtherFiles;
window.toggleImages = toggleImages;
window.closeImage = closeImage;
window.prevImage = prevImage;
window.nextImage = nextImage;


document.addEventListener("click", function (event) {
    if (event.target.id === "imagePopup") {
        closeImage();
        closeVideo();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeImage();
        closeVideo();
    }
    if (event.key === "ArrowLeft") {
        prevImage();
    }
    if (event.key === "ArrowRight") {
        nextImage();
    }
});

getFriends();