export const LightTheme = {
    WHITE_COLOR: '#000000',
    BLACK_COLOR: '#ffffff',
    BACKGROUND_COLOR: "#ffffff",
    TEXT_COLOR: "#000619",
    POST_CONTENT_COLOR: "#333",
    NAVBAR_BACKGROUND_COLOR: "#2573e0",
    NAVBAR_TEXT_COLOR: "#ffffff",
    NAVBAR_ICON_COLOR: "#feffff",
    SIDEBAR_BACKGROUND_COLOR: "#ffffff",
    SIDEBAR_HOVER_BACKGROUND_COLOR: "e4e6eb",
    SIDEBAR_TEXT_COLOR: "#010611",
    SIDEBAR_ICON_COLOR: "#000401",
    CHAT_HEADER_BACKGROUND_COLOR: "#007bff",
    FEED_BACKGROUND_COLOR: "#ffffff",
    POST_COMMENTS_COLOR: "#f9f9f9",
    POST_COMMENTS_INPUT: "#fff",
    POST_COMMENTS_INPUT_FOCUS: "#007bff",
    BOX_SHADOW: "#0000004d",
    PROFILE_BG_COLOR: "#f0f2f5",
    POST_FORM_BG_COLOR: "#f9f9f9",
    POST_FORM_TXT_AREA_BG_COLOR: "#fff"

};

export const DarkTheme = {
    WHITE_COLOR: '#FFFFFF',
    BLACK_COLOR: '#000000',
    BACKGROUND_COLOR: "#1a1a1a",
    TEXT_COLOR: "#ffffff",
    POST_CONTENT_COLOR: "#d1d1d1",
    NAVBAR_BACKGROUND_COLOR: "#1e1e1e",
    NAVBAR_TEXT_COLOR: "#ffffff",
    NAVBAR_ICON_COLOR: "#f0f0f0",
    SIDEBAR_BACKGROUND_COLOR: "#1a1a1a",
    SIDEBAR_HOVER_BACKGROUND_COLOR: "#333333",
    SIDEBAR_TEXT_COLOR: "#e0e0e0",
    SIDEBAR_ICON_COLOR: "#c0c0c0",
    CHAT_HEADER_BACKGROUND_COLOR: "#0056b3",
    FEED_BACKGROUND_COLOR: "#121212",
    POST_COMMENTS_COLOR: "#1e1e1e",
    POST_COMMENTS_INPUT: "#333",
    POST_COMMENTS_INPUT_FOCUS: "#0056b3",
    BOX_SHADOW: "#1a1a1a4d",
    PROFILE_BG_COLOR: "#18191A",
    POST_FORM_BG_COLOR: "#1e1e1e",
    POST_FORM_TXT_AREA_BG_COLOR: "#303030"


};


export function applyTheme(theme) {
    Object.keys(theme).forEach(key => {
        document.documentElement.style.setProperty(`--${key.toLowerCase().replace(/_/g, '-')}`, theme[key]);
    });
}