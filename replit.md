# CoralScape Designer

## Overview
CoralScape Designer is a full-stack aquarium design application that enables users to create custom tank layouts by combining coral specimens from a Google Sheets database with an interactive canvas. Users can drag-and-drop coral overlays onto tank backgrounds, apply various transformations (rotate, flip, zoom, pan), and export the final compositions. The application aims to provide an intuitive and visually rich experience for designing virtual aquascapes, supporting both pre-defined and custom coral uploads, and offering features like hierarchical filtering, undo functionality, and responsive design across devices.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, supporting light/dark mode.
- **State Management**: React Query (TanStack Query) for server state, local React state for UI.
- **Routing**: Wouter
- **Drag & Drop**: React DnD for interactive coral placement.
- **UI/UX Decisions**: Three-panel layout (sidebar, canvas, controls); consistent component library; real-time design preview; responsive design for mobile/tablet (<1200px) and desktop (≥1200px); customizable theme (light/dark mode).
- **Core Features**: Interactive canvas for tank design; layered coral placement with transform controls (rotate, flip, zoom, pan); canvas-to-image export with watermarking; search and hierarchical filtering of coral specimens; custom coral upload persistence; undo system for actions; keyboard shortcuts for common actions; automatic HEIC to JPEG conversion for uploads; mobile/tablet optimization with touch support and precision controls.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM, utilizing Neon serverless PostgreSQL.
- **Storage Strategy**: Designed with an in-memory storage interface for future database migration.
- **Session Management**: Express sessions with PostgreSQL store.

### Key Components
- **Data Integration**: Fetches coral data via direct CSV export from public Google Sheets. Manages coral specimens with images, dimensions, and metadata.
- **Canvas System**: Provides an HTML5 canvas-based workspace for interactive design, including overlay management and export.
- **UI Components**: Modular design system built with shadcn/ui for consistent and accessible UI.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: For serverless PostgreSQL database connection.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: For server state management and caching.
- **react-dnd**: For drag and drop functionality.
- **@radix-ui/***: For accessible UI primitive components.
- **tailwindcss**: For utility-first CSS styling.
- **heic2any**: For HEIC file conversion to JPEG.

### Development Tools
- **tsx**: TypeScript execution for development.
- **esbuild**: Fast JavaScript bundler.
- **vite**: Frontend development server and build tool.
- **drizzle-kit**: For database migration and schema management.

### Image Processing
- **HTML5 Canvas API**: Utilized for client-side image manipulation and composition.
- **Blob/File APIs**: For image export and download functionality.