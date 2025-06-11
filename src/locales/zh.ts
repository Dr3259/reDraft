
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
    saveDraftTooltip: '保存新草稿', // 更新
    downloadTooltip: '下载为 PNG 图片',
    manageDraftsTooltip: '管理已存草稿', // 新增
    draftSavedTitle: '草稿已保存',
    draftSavedDescription: "草稿 '{draftName}' 已保存在此浏览器中。", // 更新
    draftLoadedTitle: '草稿已加载',
    draftLoadedDescription: "草稿 '{draftName}' 已加载。", // 更新
    draftSaveErrorTitle: '保存错误',
    draftSaveErrorDescription: '无法将草稿保存到浏览器存储。',
    draftLoadErrorTitle: '加载错误',
    draftLoadErrorSpecificDescription: '无法加载选中的草稿，它可能已损坏。', // 更新
    draftsDialogTitle: '已存草稿', // 新增
    draftsDialogDescription: '选择一个草稿加载到画布上进行编辑。', // 新增
    loadDraftButton: '加载', // 新增
    noDraftsMessage: '暂无已存草稿。', // 新增
    draftNamePrefix: '草稿', // 新增
    closeDialogButton: '关闭', // 新增
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
    downloadedTitle: '下载已开始',
    downloadedDescription: '{filename} 将被下载。',
    pdfExportErrorTitle: 'PDF 导出错误',
    pdfExportErrorDescription: '无法生成 PDF。',
  },
  footer: {
    copyright: '© {year} 笔记画布. 版权所有.',
  }
} as const;
