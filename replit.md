# CoralScape Designer

## Overview

This is a full-stack aquarium design application that allows users to create custom tank layouts by combining coral specimens from Google Sheets with an interactive canvas interface. The application provides a drag-and-drop interface for positioning coral overlays on tank backgrounds and exporting the final compositions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state, local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: React DnD for interactive coral placement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Storage Strategy**: In-memory storage with interface for database migration
- **Session Management**: Express sessions with PostgreSQL store

### Key Components

#### Data Integration
- **Google Sheets Integration**: Direct CSV export fetching from public Google Sheets
- **Coral Data Management**: Stores coral specimens with images, dimensions, and metadata
- **Tank Composition Storage**: Saves canvas layouts with overlay positions and settings

#### Canvas System
- **Interactive Canvas**: HTML5 canvas-based workspace for tank design
- **Overlay Management**: Layered coral placement with transform controls
- **Export Functionality**: Canvas-to-image conversion with watermark support
- **Zoom and Pan**: Viewport controls for detailed editing

#### UI Components
- **Modular Design System**: Consistent component library using shadcn/ui
- **Responsive Layout**: Three-panel interface (sidebar, canvas, controls)
- **Real-time Updates**: Live preview of design changes
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

1. **Data Import**: User provides Google Sheets URL → Backend fetches CSV → Parses coral data → Stores in database
2. **Canvas Interaction**: User drags coral from sidebar → Drops on canvas → Creates overlay with position/size data
3. **Design Management**: Overlay modifications → Real-time canvas updates → Optional save to database
4. **Export Process**: Canvas state → Image generation → Watermark application → Download trigger

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **react-dnd**: Drag and drop functionality
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Frontend development server and build tool
- **drizzle-kit**: Database migration and schema management

### Image Processing
- **HTML5 Canvas API**: Client-side image manipulation and composition
- **Blob/File APIs**: Image export and download functionality

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: Express server with TypeScript compilation via tsx
- **Database**: Neon serverless PostgreSQL with connection pooling
- **File Serving**: Vite middleware for static assets in development

### Production Build
- **Frontend**: Static assets generated via Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js` with external dependencies
- **Database**: Production Neon database with migration support
- **Deployment**: Single Node.js process serving both API and static files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment detection for development/production modes
- **Session Management**: PostgreSQL-backed sessions for user state persistence

### Data Persistence
- **Development**: Optional in-memory storage fallback
- **Production**: Full PostgreSQL schema with coral data and tank compositions
- **Migration Strategy**: Drizzle migrations for schema versioning