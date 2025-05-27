# papeFlow

A privacy-centric process flow and note-taking desktop application built with Electron, React, and TypeScript.

## Features

- **Process Flow Visualization**: Create and manage visual process flows with drag-and-drop functionality
- **Multi-level Hierarchy**: Drill down into sub-processes with unlimited nesting
- **Rich Text Notes**: Create notes with formatted text and embedded media
- **Checklist Templates**: Define reusable checklist templates and attach instances to processes/notes
- **Media Support**: Embed images, videos, and other files directly in your content
- **Privacy-First**: All data stored locally on your device
- **Future-Ready**: Built with provisions for secure collaboration features

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Process Visualization**: React Flow
- **Rich Text Editor**: TipTap
- **State Management**: Zustand
- **Desktop Framework**: Electron
- **Database**: SQLite (better-sqlite3)
- **Build Tools**: Webpack

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd papeFlow
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the Electron main process and the React development server.

## Building for Production

### Build the application:
```bash
npm run build
```

### Package for distribution:
```bash
npm run dist
```

This will create distributable packages for your platform in the `release` directory.

## Project Structure

```
papeFlow/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── database/        # Database setup and migrations
│   │   ├── ipc/            # IPC communication handlers
│   │   ├── index.ts        # Main entry point
│   │   └── preload.ts      # Preload script
│   ├── renderer/            # React application
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── styles/         # Global styles
│   │   └── index.tsx       # Renderer entry point
│   └── shared/             # Shared types and constants
├── public/                 # Static assets
├── dist/                   # Build output
└── release/               # Packaged applications
```

## Key Features Implementation

### Process Flow Canvas
- Visual node-based interface using React Flow
- Drag and drop to reposition processes
- Connect processes with visual edges
- Double-click to drill down into sub-processes
- Breadcrumb navigation

### Data Model
- **Processes**: Hierarchical structure with parent-child relationships
- **Connections**: Visual links between processes
- **Notes**: Rich text documents with tagging and linking
- **Checklists**: Reusable templates with instance tracking
- **Media**: File attachments with metadata

### Privacy & Security
- All data stored locally in SQLite database
- No external API calls or telemetry
- Database location: `~/AppData/Roaming/papeFlow/` (Windows) or equivalent
- Optional data export/import functionality

## Future Enhancements

### Collaboration (Planned)
- Sync-based updates between authorized users
- Conflict resolution for concurrent edits
- Version history and rollback
- Encrypted peer-to-peer sync

### Additional Features
- Advanced search and filtering
- Process templates
- Reporting and analytics
- Plugin system
- Mobile companion app

## Scripts

- `npm run dev` - Start development environment
- `npm run build` - Build for production
- `npm run start` - Run built application
- `npm run dist` - Package for distribution
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

MIT

## Contributing

This is a private project for personal use. If you have access and want to contribute:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions, please open an issue in the repository.