// Shared by the browser and the server (plain ES module, no DOM access).
// `speech` is the BCP-47 tag used to pick a text-to-speech voice.

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', speech: 'en-US' },
  { code: 'es', name: 'Spanish', native: 'Español', speech: 'es-ES' },
  { code: 'zh', name: 'Chinese (Simplified)', native: '简体中文', speech: 'zh-CN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
  { code: 'ar', name: 'Arabic', native: 'العربية', speech: 'ar-SA', rtl: true },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speech: 'bn-IN' },
  { code: 'pt', name: 'Portuguese', native: 'Português', speech: 'pt-BR' },
  { code: 'fr', name: 'French', native: 'Français', speech: 'fr-FR' },
  { code: 'ru', name: 'Russian', native: 'Русский', speech: 'ru-RU' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', speech: 'vi-VN' },
  { code: 'tl', name: 'Tagalog', native: 'Tagalog', speech: 'fil-PH' },
  { code: 'ko', name: 'Korean', native: '한국어', speech: 'ko-KR' },
  { code: 'ja', name: 'Japanese', native: '日本語', speech: 'ja-JP' },
  { code: 'de', name: 'German', native: 'Deutsch', speech: 'de-DE' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speech: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', speech: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', speech: 'pa-IN' },
  { code: 'ur', name: 'Urdu', native: 'اردو', speech: 'ur-PK', rtl: true },
  { code: 'fa', name: 'Persian', native: 'فارسی', speech: 'fa-IR', rtl: true },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', speech: 'uk-UA' },
  { code: 'pl', name: 'Polish', native: 'Polski', speech: 'pl-PL' },
  { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl ayisyen', speech: 'fr-HT' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', speech: 'sw-KE' },
  { code: 'so', name: 'Somali', native: 'Soomaali', speech: 'so-SO' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', speech: 'am-ET' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá', speech: 'yo-NG' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', speech: 'ne-NP' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာ', speech: 'my-MM' },
];

export function findLanguage(code) {
  return LANGUAGES.find((lang) => lang.code === code) || LANGUAGES[0];
}
