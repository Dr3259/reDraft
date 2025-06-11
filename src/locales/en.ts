export default {
  appTitle: 'NoteCanvas',
  appDescription: 'A browser-based scratchpad with AI-powered assistance.',
  header: {
    title: 'NoteCanvas',
  },
  languageSwitcher: {
    english: 'English',
    chinese: '中文',
    changeLanguage: 'Change language',
  },
  editor: {
    placeholder: 'Start your masterpiece...',
    bold: 'Bold',
    italic: 'Italic',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    ul: 'Unordered List',
    ol: 'Ordered List',
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
