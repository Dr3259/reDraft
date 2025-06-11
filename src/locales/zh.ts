export default {
  appTitle: '笔记画布',
  appDescription: '一个具有 AI 辅助功能的浏览器笔记应用。',
  header: {
    title: '笔记画布',
  },
  languageSwitcher: {
    english: 'English',
    chinese: '中文',
    changeLanguage: '切换语言',
  },
  editor: {
    placeholder: '开始你的杰作...',
    bold: '粗体',
    italic: '斜体',
    h1: '标题 1',
    h2: '标题 2',
    h3: '标题 3',
    ul: '无序列表',
    ol: '有序列表',
  },
  export: {
    title: '导出笔记',
    txt: '导出为 .txt',
    md: '导出为 .md',
    pdf: '导出为 .pdf',
  },
  aiAssistant: {
    title: 'AI 助手',
    description: '获取语法、清晰度和风格方面的建议。',
    getSuggestions: '获取建议',
    gettingSuggestions: '正在获取建议...',
    suggestionsReadyTitle: 'AI 建议已准备好',
    suggestionsReadyDescription: '建议已生成。',
    emptyNoteTitle: '笔记为空',
    emptyNoteDescription: '在获取建议前请先写点东西。',
    aiErrorTitle: 'AI 错误',
    aiErrorDescription: '无法获取建议。',
    suggestionsHeader: '建议:',
    failedToGetSuggestions: '获取建议失败，请重试。',
  },
  toast: {
    exportedAs: '已导出为 {format}',
    downloaded: '{filename} 已下载。',
    pdfExportErrorTitle: 'PDF 导出错误',
    pdfExportErrorDescription: '无法生成 PDF。',
  },
  footer: {
    copyright: '© {year} 笔记画布. 版权所有.',
  }
} as const;
