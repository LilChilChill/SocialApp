# Hướng dẫn Debug Profile Page trên Host

## Vấn đề
Trang profile hiển thị bình thường trên local nhưng không hiển thị nội dung trên host (chi404.id.vn).

## Các bước kiểm tra

### 1. Kiểm tra Console trong Browser
Mở Developer Tools (F12) và xem tab Console. Bạn sẽ thấy các log messages:
- `Profile page loaded`
- `API_URL: [giá trị]`
- `Environment: [mode]`
- `getUserInfo called`
- `Token exists: true/false`
- `Fetching profile from: [URL]`
- `Profile response status: [status]`

**Nếu thấy lỗi:**
- `VITE_API_URL is not defined!` → Biến môi trường chưa được set trên host
- `API_URL không được thiết lập` → Cần cấu hình biến môi trường
- `userId chưa có` → getUserInfo chưa hoàn thành
- `postsContainer không tìm thấy` → Có lỗi với DOM

### 2. Kiểm tra Network Tab
Xem tab Network trong Developer Tools:
- Tìm request đến `/api/users/profile`
- Kiểm tra Status Code:
  - `200` = OK
  - `401` = Unauthorized (token hết hạn)
  - `404` = Not Found (API URL sai)
  - `500` = Server Error
- Kiểm tra Request URL có đúng không
- Kiểm tra Response có dữ liệu không

### 3. Kiểm tra Environment Variables trên Host

#### Nếu dùng Netlify:
1. Vào Netlify Dashboard
2. Chọn site của bạn
3. Vào **Site settings** → **Environment variables**
4. Thêm hoặc kiểm tra:
   - Key: `VITE_API_URL`
   - Value: URL API của bạn (ví dụ: `https://your-api.com`)

#### Nếu dùng Vercel:
1. Vào Vercel Dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Thêm hoặc kiểm tra:
   - Key: `VITE_API_URL`
   - Value: URL API của bạn

#### Nếu dùng hosting khác:
Đảm bảo biến môi trường `VITE_API_URL` được set trước khi build.

### 4. Kiểm tra Build
Sau khi set environment variables, cần rebuild:
```bash
npm run build
```

### 5. Kiểm tra LocalStorage
Trong Console, chạy:
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('UserId:', localStorage.getItem('userId'));
```

Nếu `token` là `null`, bạn cần đăng nhập lại.

### 6. Kiểm tra CORS
Nếu thấy lỗi CORS trong Console:
- Kiểm tra server có cho phép origin của bạn không
- Kiểm tra `allowedOrigins` trong server config

## Các lỗi thường gặp

### Lỗi: "VITE_API_URL is not defined"
**Nguyên nhân:** Biến môi trường chưa được set trên host
**Giải pháp:** Set biến môi trường `VITE_API_URL` trên hosting platform

### Lỗi: "userId chưa có"
**Nguyên nhân:** getUserInfo chưa hoàn thành hoặc thất bại
**Giải pháp:** Kiểm tra API call đến `/api/users/profile` có thành công không

### Lỗi: "postsContainer không tìm thấy"
**Nguyên nhân:** DOM chưa sẵn sàng hoặc element không tồn tại
**Giải pháp:** Kiểm tra HTML có element với id="posts" không

### Lỗi: Network Error hoặc CORS
**Nguyên nhân:** API URL sai hoặc server không cho phép CORS
**Giải pháp:** 
- Kiểm tra API URL đúng chưa
- Kiểm tra server có cho phép origin của bạn không

## Log Messages để tìm

Khi mở Console, bạn sẽ thấy các messages theo thứ tự:
1. `Profile page loaded`
2. `API_URL: [value]` hoặc `VITE_API_URL is not defined!`
3. `Elements check: {...}`
4. `getUserInfo called`
5. `Token exists: true/false`
6. `Fetching profile from: [URL]`
7. `Profile response status: [status]`
8. `User data received: {...}`
9. `displayUserInfo called with: {...}`
10. `userId saved to localStorage: [id]`
11. `loadProfilePosts called`
12. `Fetching posts from: [URL]`
13. `Posts received: [count] posts`
14. `displayPosts called with [count] posts`

Nếu thiếu bất kỳ message nào, đó là nơi code bị dừng.

