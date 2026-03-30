import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.myDashboard': 'My Dashboard',
    'nav.markets': 'Markets',
    'nav.planning': 'Planning',
    'nav.investments': 'Investments',
    'nav.netWorth': 'Net Worth',
    'nav.sharesEtfs': 'Shares & ETFs',
    'nav.bonds': 'Bonds',
    'nav.hybrids': 'Hybrids',
    'nav.property': 'Property',
    'nav.unlisted': 'Unlisted',
    'nav.cashTds': 'Cash & TDs',
    'nav.managedFunds': 'Managed Funds',
    'nav.crypto': 'Crypto',
    'nav.superPension': 'Super & Pension',
    'nav.tools': 'Tools',
    'nav.settings': 'Settings',
    // Common
    'common.search': 'Search...',
    'common.refresh': 'Refresh',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    // Voice Assistant
    'voice.title': 'Financial Planning Assistant',
    'voice.subtitle': 'Ask me anything about your finances',
    'voice.placeholder': 'Type your question or click the mic...',
    'voice.recording': 'Listening...',
    'voice.processing': 'Processing...',
    'voice.disclaimer': 'General advice only. Consult a licensed financial adviser for personal advice.',
    // Stock Trading
    'stocks.title': 'Shares & ETFs',
    'stocks.subtitle': 'Trade, analyze, and optimize your equity portfolio',
    'stocks.portfolio': 'Portfolio',
    'stocks.buffettIdeas': 'Buffett Ideas',
    'stocks.valuations': 'Valuations',
    'stocks.backtest': 'Backtest',
    'stocks.news': 'News',
    'stocks.liveMarkets': 'Live Markets',
    // Compliance
    'compliance.title': 'Adviser Compliance Dashboard',
    'compliance.subtitle': 'Monitor advice quality, ASIC compliance, and regulatory alignment',
    // Language
    'lang.english': 'English',
    'lang.mandarin': '中文',
    'lang.vietnamese': 'Tiếng Việt',
    'lang.greek': 'Ελληνικά',
  },
  zh: {
    'nav.dashboard': '仪表板',
    'nav.myDashboard': '我的仪表板',
    'nav.markets': '市场',
    'nav.planning': '规划',
    'nav.investments': '投资',
    'nav.netWorth': '净资产',
    'nav.sharesEtfs': '股票和ETF',
    'nav.bonds': '债券',
    'nav.hybrids': '混合型',
    'nav.property': '房产',
    'nav.unlisted': '非上市',
    'nav.cashTds': '现金和定期存款',
    'nav.managedFunds': '管理基金',
    'nav.crypto': '加密货币',
    'nav.superPension': '养老金',
    'nav.tools': '工具',
    'nav.settings': '设置',
    'common.search': '搜索...',
    'common.refresh': '刷新',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'voice.title': '财务规划助手',
    'voice.subtitle': '询问有关您财务的任何问题',
    'voice.placeholder': '输入您的问题或点击麦克风...',
    'voice.recording': '正在聆听...',
    'voice.processing': '处理中...',
    'voice.disclaimer': '仅供一般建议。请咨询持牌财务顾问获取个人建议。',
    'stocks.title': '股票和ETF',
    'stocks.subtitle': '交易、分析和优化您的股票投资组合',
    'stocks.portfolio': '投资组合',
    'stocks.buffettIdeas': '巴菲特理念',
    'stocks.valuations': '估值',
    'stocks.backtest': '回测',
    'stocks.news': '新闻',
    'stocks.liveMarkets': '实时市场',
    'compliance.title': '顾问合规仪表板',
    'compliance.subtitle': '监控建议质量、ASIC合规性和监管一致性',
    'lang.english': 'English',
    'lang.mandarin': '中文',
    'lang.vietnamese': 'Tiếng Việt',
    'lang.greek': 'Ελληνικά',
  },
  vi: {
    'nav.dashboard': 'Bảng điều khiển',
    'nav.myDashboard': 'Bảng điều khiển của tôi',
    'nav.markets': 'Thị trường',
    'nav.planning': 'Kế hoạch',
    'nav.investments': 'Đầu tư',
    'nav.netWorth': 'Giá trị ròng',
    'nav.sharesEtfs': 'Cổ phiếu & ETF',
    'nav.bonds': 'Trái phiếu',
    'nav.hybrids': 'Kết hợp',
    'nav.property': 'Bất động sản',
    'nav.unlisted': 'Chưa niêm yết',
    'nav.cashTds': 'Tiền mặt & Tiền gửi',
    'nav.managedFunds': 'Quỹ quản lý',
    'nav.crypto': 'Tiền điện tử',
    'nav.superPension': 'Hưu trí',
    'nav.tools': 'Công cụ',
    'nav.settings': 'Cài đặt',
    'common.search': 'Tìm kiếm...',
    'common.refresh': 'Làm mới',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.close': 'Đóng',
    'common.loading': 'Đang tải...',
    'common.error': 'Lỗi',
    'common.success': 'Thành công',
    'voice.title': 'Trợ lý Kế hoạch Tài chính',
    'voice.subtitle': 'Hỏi bất cứ điều gì về tài chính của bạn',
    'voice.placeholder': 'Nhập câu hỏi hoặc nhấn micro...',
    'voice.recording': 'Đang nghe...',
    'voice.processing': 'Đang xử lý...',
    'voice.disclaimer': 'Chỉ tư vấn chung. Hãy tham khảo cố vấn tài chính được cấp phép.',
    'stocks.title': 'Cổ phiếu & ETF',
    'stocks.subtitle': 'Giao dịch, phân tích và tối ưu hóa danh mục cổ phiếu',
    'stocks.portfolio': 'Danh mục',
    'stocks.buffettIdeas': 'Ý tưởng Buffett',
    'stocks.valuations': 'Định giá',
    'stocks.backtest': 'Kiểm tra lịch sử',
    'stocks.news': 'Tin tức',
    'stocks.liveMarkets': 'Thị trường trực tiếp',
    'compliance.title': 'Bảng Tuân thủ Cố vấn',
    'compliance.subtitle': 'Giám sát chất lượng tư vấn, tuân thủ ASIC và phù hợp quy định',
    'lang.english': 'English',
    'lang.mandarin': '中文',
    'lang.vietnamese': 'Tiếng Việt',
    'lang.greek': 'Ελληνικά',
  },
  el: {
    'nav.dashboard': 'Πίνακας ελέγχου',
    'nav.myDashboard': 'Ο πίνακάς μου',
    'nav.markets': 'Αγορές',
    'nav.planning': 'Σχεδιασμός',
    'nav.investments': 'Επενδύσεις',
    'nav.netWorth': 'Καθαρή αξία',
    'nav.sharesEtfs': 'Μετοχές & ETF',
    'nav.bonds': 'Ομόλογα',
    'nav.hybrids': 'Υβριδικά',
    'nav.property': 'Ακίνητα',
    'nav.unlisted': 'Μη εισηγμένα',
    'nav.cashTds': 'Μετρητά & Προθεσμιακές',
    'nav.managedFunds': 'Διαχειριζόμενα κεφάλαια',
    'nav.crypto': 'Κρυπτονομίσματα',
    'nav.superPension': 'Σύνταξη',
    'nav.tools': 'Εργαλεία',
    'nav.settings': 'Ρυθμίσεις',
    'common.search': 'Αναζήτηση...',
    'common.refresh': 'Ανανέωση',
    'common.save': 'Αποθήκευση',
    'common.cancel': 'Ακύρωση',
    'common.close': 'Κλείσιμο',
    'common.loading': 'Φόρτωση...',
    'common.error': 'Σφάλμα',
    'common.success': 'Επιτυχία',
    'voice.title': 'Βοηθός Οικονομικού Σχεδιασμού',
    'voice.subtitle': 'Ρωτήστε οτιδήποτε για τα οικονομικά σας',
    'voice.placeholder': 'Πληκτρολογήστε την ερώτησή σας ή πατήστε το μικρόφωνο...',
    'voice.recording': 'Ακούω...',
    'voice.processing': 'Επεξεργασία...',
    'voice.disclaimer': 'Μόνο γενικές συμβουλές. Συμβουλευτείτε αδειοδοτημένο σύμβουλο.',
    'stocks.title': 'Μετοχές & ETF',
    'stocks.subtitle': 'Συναλλαγές, ανάλυση και βελτιστοποίηση του χαρτοφυλακίου',
    'stocks.portfolio': 'Χαρτοφυλάκιο',
    'stocks.buffettIdeas': 'Ιδέες Buffett',
    'stocks.valuations': 'Αποτιμήσεις',
    'stocks.backtest': 'Ιστορικός έλεγχος',
    'stocks.news': 'Νέα',
    'stocks.liveMarkets': 'Ζωντανές αγορές',
    'compliance.title': 'Πίνακας Συμμόρφωσης Συμβούλου',
    'compliance.subtitle': 'Παρακολούθηση ποιότητας συμβουλών, συμμόρφωση ASIC',
    'lang.english': 'English',
    'lang.mandarin': '中文',
    'lang.vietnamese': 'Tiếng Việt',
    'lang.greek': 'Ελληνικά',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('halcyon_language') || 'en';
    }
    return 'en';
  });

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('halcyon_language', lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, availableLanguages: Object.keys(translations) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'en', changeLanguage: () => {}, t: (key) => key, availableLanguages: ['en'] };
  }
  return context;
};

export const LANGUAGE_LABELS = {
  en: 'English',
  zh: '中文 (Mandarin)',
  vi: 'Tiếng Việt',
  el: 'Ελληνικά (Greek)',
};

export default LanguageContext;
