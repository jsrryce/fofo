import { createI18n } from 'vue-i18n';
import en from './en.js'
import zh from './zh.js'

// ★ 新增：从 localStorage 读取语言（默认 en）
const savedLang = localStorage.getItem("lang") || "en";

const i18n = createI18n({
    legacy: false,

    // ★ 修改：使用 savedLang 作为当前语言
    locale: savedLang,

    messages: {
        zh,
        en
    },
});

export default i18n;
