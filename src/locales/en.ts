
export default {
  appTitle: 'NoteCanvas Whiteboard',
  appDescription: 'A browser-based whiteboard with drawing and text capabilities.',
  header: {
    title: 'NoteCanvas Whiteboard',
  },
  languageSwitcher: {
    english: 'English',
    chinese: '中文',
    changeLanguage: 'Change language',
  },
  whiteboard: {
    textInputPlaceholder: 'Type here...',
    canvasLabel: 'Whiteboard drawing area',
    clearCanvasTooltip: 'Clear Canvas',
    undoTooltip: 'Undo',
    eraserTooltip: 'Eraser',
    saveTooltip: 'Save',
    saveAsTooltip: 'Save As',
  },
  export: {
    title: 'Export Note',
    txt: 'Export as .txt',
    md: 'Export as .md',
    pdf: 'Export as .pdf',
  },
  aiAssistant: {
    title: 'AI Assistant',
    description: 'Get suggestions for grammar, clarity, and style.',
    getSuggestions: 'Get Suggestions',
    gettingSuggestions: 'Getting Suggestions...',
    suggestionsReadyTitle: 'AI Suggestions Ready',
    suggestionsReadyDescription: 'Suggestions have been generated.',
    emptyNoteTitle: 'Empty Note',
    emptyNoteDescription: 'Write something before getting suggestions.',
    aiErrorTitle: 'AI Error',
    aiErrorDescription: 'Could not fetch suggestions.',
    suggestionsHeader: 'Suggestions:',
    failedToGetSuggestions: 'Failed to get suggestions. Please try again.',
  },
  toast: {
    exportedAs: 'Exported as {format}',
    downloaded: '{filename} downloaded.',
    pdfExportErrorTitle: 'PDF Export Error',
    pdfExportErrorDescription: 'Could not generate PDF.',
  },
  footer: {
    copyright: '© {year} NoteCanvas. All rights reserved.',
  }
} as const;
