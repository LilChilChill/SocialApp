# Hệ thống Theme (Sáng/Tối)

## Tổng quan

Hệ thống theme cho phép chuyển đổi giữa chế độ sáng và tối một cách dễ dàng. Tất cả các màu được định nghĩa tập trung trong `theme.js` và được sử dụng thông qua CSS variables.

## Cấu trúc

### 1. File `theme.js` (`/src/scripts/theme.js`)

Định nghĩa 2 theme:
- **LightTheme**: Chế độ sáng (mặc định)
- **DarkTheme**: Chế độ tối

Mỗi theme là một object chứa các màu với key là UPPER_CASE:
```javascript
export const LightTheme = {
    PROFILE_BG_COLOR: "#f0f2f5",
    NAVBAR_BACKGROUND_COLOR: "#2573e0",
    // ... các màu khác
};
```

### 2. Function `applyTheme(theme)`

Chuyển đổi các key từ theme object thành CSS variables:
- `PROFILE_BG_COLOR` → `--profile-bg-color`
- `NAVBAR_BACKGROUND_COLOR` → `--navbar-background-color`
- `POST_FORM_BG_COLOR` → `--post-form-bg-color`

Quy tắc chuyển đổi:
1. Chuyển sang lowercase
2. Thay `_` bằng `-`
3. Thêm prefix `--`

### 3. CSS Variables

Tất cả các file CSS có định nghĩa CSS variables mặc định trong `:root`:
```css
:root {
  --profile-bg-color: #f0f2f5;
  --navbar-background-color: #2573e0;
  /* ... */
}
```

Các giá trị này khớp với `LightTheme` và sẽ được override bởi JavaScript khi `applyTheme()` được gọi.

### 4. Sử dụng trong CSS

Sử dụng CSS variables với fallback:
```css
body {
  background-color: var(--profile-bg-color, #f0f2f5);
}
```

## Cách hoạt động

### Khi trang load:

1. **settings.js được load đầu tiên** (trong `<head>` hoặc đầu `<body>`)
2. **initTheme() tự động chạy** (IIFE - Immediately Invoked Function Expression)
3. **Kiểm tra localStorage**:
   - Nếu `localStorage.getItem("theme") === "dark"` → apply DarkTheme
   - Ngược lại → apply LightTheme (mặc định)
4. **applyTheme() set các CSS variables** vào `document.documentElement`

### Khi user toggle:

1. User click vào toggle switch (`darkModeToggle`)
2. Event listener trong `settings.js` được trigger
3. Nếu checked → apply DarkTheme và lưu "dark" vào localStorage
4. Nếu unchecked → apply LightTheme và lưu "light" vào localStorage

## Danh sách CSS Variables

Tất cả các variables từ `theme.js`:

| Theme Key | CSS Variable | Mô tả |
|-----------|-------------|-------|
| `PURE_WHITE` | `--pure-white` | Màu trắng thuần |
| `PURE_BLACK` | `--pure-black` | Màu đen thuần |
| `WHITE_COLOR` | `--white-color` | Màu chữ chính (đen ở light, trắng ở dark) |
| `BLACK_COLOR` | `--black-color` | Màu nền chính |
| `BACKGROUND_COLOR` | `--background-color` | Màu nền chung |
| `TEXT_COLOR` | `--text-color` | Màu chữ |
| `POST_CONTENT_COLOR` | `--post-content-color` | Màu chữ trong post |
| `NAVBAR_BACKGROUND_COLOR` | `--navbar-background-color` | Màu nền navbar |
| `NAVBAR_TEXT_COLOR` | `--navbar-text-color` | Màu chữ navbar |
| `NAVBAR_ICON_COLOR` | `--navbar-icon-color` | Màu icon navbar |
| `SIDEBAR_BACKGROUND_COLOR` | `--sidebar-background-color` | Màu nền sidebar |
| `SIDEBAR_HOVER_BACKGROUND_COLOR` | `--sidebar-hover-background-color` | Màu hover sidebar |
| `SIDEBAR_TEXT_COLOR` | `--sidebar-text-color` | Màu chữ sidebar |
| `SIDEBAR_ICON_COLOR` | `--sidebar-icon-color` | Màu icon sidebar |
| `CHAT_HEADER_BACKGROUND_COLOR` | `--chat-header-background-color` | Màu nền header chat |
| `FEED_BACKGROUND_COLOR` | `--feed-background-color` | Màu nền feed |
| `POST_COMMENTS_COLOR` | `--post-comments-color` | Màu nền phần comments |
| `POST_COMMENTS_INPUT` | `--post-comments-input` | Màu nền input comment |
| `POST_COMMENTS_INPUT_FOCUS` | `--post-comments-input-focus` | Màu khi focus input |
| `BOX_SHADOW` | `--box-shadow` | Màu shadow |
| `PROFILE_BG_COLOR` | `--profile-bg-color` | Màu nền profile |
| `POST_FORM_BG_COLOR` | `--post-form-bg-color` | Màu nền form post |
| `POST_FORM_TXT_AREA_BG_COLOR` | `--post-form-txt-area-bg-color` | Màu nền textarea |
| `FORM_COLOR` | `--form-color` | Màu nền form |
| `LINK_COLOR` | `--link-color` | Màu link |
| `TEXT_AREA_COLOR` | `--text-area-color` | Màu nền textarea |
| `ICON_COLOR` | `--icon-color` | Màu icon |
| `MESSAGE_BG_COLOR` | `--message-bg-color` | Màu nền message |

## Thêm màu mới

1. **Thêm vào theme.js**:
```javascript
export const LightTheme = {
    // ... existing colors
    NEW_COLOR: "#ffffff",
};

export const DarkTheme = {
    // ... existing colors
    NEW_COLOR: "#000000",
};
```

2. **Thêm vào CSS** (tất cả các file CSS cần dùng):
```css
:root {
  /* ... existing variables */
  --new-color: #ffffff; /* giá trị từ LightTheme */
}
```

3. **Sử dụng trong CSS**:
```css
.my-element {
  color: var(--new-color);
}
```

## Lưu ý

1. **settings.js phải được load sớm** để theme được apply ngay khi trang load
2. **CSS variables mặc định** trong `:root` phải khớp với `LightTheme`
3. **Luôn có fallback** khi sử dụng `var()`: `var(--color, #default)`
4. **Theme được lưu trong localStorage** với key `"theme"` (giá trị: `"light"` hoặc `"dark"`)

## Debug

Để kiểm tra theme có được apply đúng không:

1. Mở Console (F12)
2. Chạy: `getComputedStyle(document.documentElement).getPropertyValue('--profile-bg-color')`
3. Kiểm tra giá trị có khớp với theme hiện tại không

Hoặc:
```javascript
// Xem tất cả CSS variables
const root = getComputedStyle(document.documentElement);
console.log('Profile BG:', root.getPropertyValue('--profile-bg-color'));
console.log('Navbar BG:', root.getPropertyValue('--navbar-background-color'));
```

