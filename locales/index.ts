// 다국어 지원 - 11개 언어
import { ko } from './ko';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { pt } from './pt';
import { ar } from './ar';
import { th } from './th';
import { vi } from './vi';
import { ru } from './ru';
import { zh } from './zh';
import { ja } from './ja';

export type Language = 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'th' | 'vi' | 'ru' | 'zh' | 'ja' | 'ko';

export const LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

export type TranslationType = typeof ko;

export const translations: Record<Language, TranslationType> = {
  ko, en, es, fr, pt, ar, th, vi, ru, zh, ja,
};

// 언어 감지 (기본값: 영어)
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // 저장된 언어가 있으면 사용, 없으면 영어
  const stored = localStorage.getItem('hairfit_language');
  if (stored && LANGUAGES.find(l => l.code === stored)) {
    return stored as Language;
  }

  return 'en'; // 기본값: 영어
}

// 언어 저장
export function saveLanguage(lang: Language): void {
  localStorage.setItem('hairfit_language', lang);
}

// 번역 가져오기
export function getTranslation(lang: Language): TranslationType {
  return translations[lang] || translations.en;
}

// RTL 언어 확인 (아랍어)
export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}
