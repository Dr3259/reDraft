# redraft

`redraft` is a versatile, browser-based tool designed for thinking, note-taking, and organizing ideas. It combines the freedom of a whiteboard, the structure of a note-taking system, and the flexibility of a mind-mapping tool into one seamless experience. All your work is saved locally in your browser, ensuring privacy and quick access.

## Core Features

The application is built around three distinct modes, allowing you to switch between different methods of thinking and ideation seamlessly.

### 1. Draft Mode (草稿本 - Digital Whiteboard)

This mode provides a free-form digital canvas, perfect for brainstorming, sketching, and visual thinking.

- **Infinite Canvas**: Draw and write freely without constraints.
- **Drawing Tools**: A customizable pen with adjustable width and a selection of colors, alongside an eraser for corrections.
- **Text Input**: Add text anywhere on the canvas by right-clicking.
- **Undo Functionality**: Easily revert your last action.
- **Save & Load Drafts**: Save your entire canvas as a draft in your browser's local storage and load it back anytime.
- **Export**: Download your masterpiece as a PNG image file.

### 2. Organize Mode (笔记本 - Cornell Notes System)

This mode implements the Cornell Notes method, a structured system for taking effective, organized notes. It's ideal for lectures, meetings, or studying.

- **Structured Layout**: The interface is divided into three sections:
    - **Cues / Questions**: For keywords, main ideas, and questions.
    - **Main Notes**: For detailed notes taken during the session.
    - **Summary**: For summarizing the key points of the page afterward.
- **Rich Text Editor**: Each section uses a rich text editor, allowing for basic formatting like bold, italics, lists, etc.
- **Save & Load Notes**: Save your structured notes as drafts and manage them easily.
- **Multiple Export Options**: Export your notes as `.txt` (plain text), `.md` (Markdown), or `.pdf` files.

### 3. Tree Mode (梳理 - Mind-Mapping / Outlining)

This mode is designed for hierarchical thinking, allowing you to break down complex topics into a nested tree structure. It's perfect for outlining projects, structuring essays, or exploring ideas.

- **Hierarchical Structure**: Start with a central topic and branch out with child and sibling nodes.
- **Expand & Collapse**: Easily hide or show branches to focus on specific parts of your tree.
- **Flexible Editing**: Add child nodes (deeper level) or sibling nodes (same level) to build out your structure.
- **Copy to Clipboard**: Instantly copy the entire tree structure as Markdown, which can be pasted directly into other applications like Notion.
- **Save & Load Trees**: Save your entire mind map as a draft for later editing.
- **Export Options**: Export your tree as a `.txt` outline, `.md` list, or a `.json` file that preserves the full structure.

## General Features

- **Theme Switching**: Choose from four different canvas themes (Whiteboard, Blackboard, Eye Care, Reading Mode) to suit your preference and reduce eye strain.
- **Multi-language Support**: The interface is available in English and Chinese (中文).
- **Local Storage**: All your drafts are securely saved in your browser's local storage. No cloud account is needed, ensuring your data stays private.
- **Responsive Design**: The interface is optimized for use on desktops, tablets, and mobile devices.
- **Fullscreen Mode**: Immerse yourself in your work without distractions.
- **Internationalization**: The app supports English and Chinese languages.

This project was built with Next.js, React, ShadCN, Tailwind CSS, and Genkit.
