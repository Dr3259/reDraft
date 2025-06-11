
export default {
  appTitle: '笔记画布 白板',
  appDescription: '一个具有绘画和文本功能的浏览器白板应用。',
  header: {
    title: '笔记画布 白板',
  },
  languageSwitcher: {
    english: '英文',
    chinese: '中文',
    changeLanguage: '切换语言',
  },
  whiteboard: {
    textInputPlaceholder: '在此输入...',
    canvasLabel: '白板绘画区域',
    clearCanvasTooltip: '清空画布',
    undoTooltip: '撤销',
    eraserTooltip: '橡皮擦',
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

    