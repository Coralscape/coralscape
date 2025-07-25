# CoralScape Designer

## Overview

This is a full-stack aquarium design application that allows users to create custom tank layouts by combining coral specimens from Google Sheets with an interactive canvas interface. The application provides a drag-and-drop interface for positioning coral overlays on tank backgrounds and exporting the final compositions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Fixed Google Sheets integration to use user's specific sheet URL: 1j4ZgG9NFOfB_H4ExYY8mKzUQuflXmRa6pP8fsdDxt-4
- Updated CSV parsing to handle proper column mapping (B=name, C=fullImageUrl, D=thumbnailUrl, E=width, F=height)
- Removed manual URL input - app now automatically connects to the coral database
- Fixed React DnD context provider for drag and drop functionality
- Updated UI text: "Canvas" → "Tank", "Overlay Images" → "Corals & Inverts", "Image Composition Studio" → "CoralScape"
- Added search and filtering functionality for coral types and colors
- Implemented visual badges showing coral type (SPS, LPS, Soft, Zoa, Clam) and colors
- Added filter dropdowns for Type and Color with automatic detection from coral names
- Added clear filters functionality when search or filters are active
- Implemented auto-loading of coral database on app startup
- Added proportional image scaling for coral overlays (maintains aspect ratio)
- Added clickable zoom functionality on tank background image
- Integrated watermark system fetching from Google Sheets sheet 2, column A, row 1
- Watermark displays at 20% width in lower right corner and cannot be removed
- Added clickable zoom percentage input for precise zoom control (10-500%)
- Implemented image transform controls: rotate 90°, flip horizontal, flip vertical
- Transform controls appear above selected coral overlays
- Enhanced watermark to support both text and image URLs from Google Sheets
- All transforms (rotation, flips) are maintained during canvas export
- Added continuous rotation (0-360°) by holding down rotate button
- Implemented dynamic filter counts showing specimen numbers for each category
- Color filters now update based on selected type showing relevant counts
- Fixed watermark to use specific CoralScape logo image at 20% width
- Implemented PowerPoint-style smooth rotation by dragging rotation handle
- Watermark now tracks with base image zoom and position (no white border)
- Rotation control shows real-time degree values during manipulation
- Changed rotation click increment from 90° to 10° for finer control
- Modified base image click to select (deselect overlays) instead of auto-zoom
- Zoom control now exclusively managed through zoom buttons/percentage input
- Reduced rotation sensitivity by 70% for smoother, more precise control
- Fixed watermark positioning to stay attached to base image corner during zoom
- Changed "Upload Base Image" to "Upload Tank Image" throughout interface
- Added coral name tooltips on hover when overlays are placed on tank
- Implemented randomize button to shuffle specimen order in sidebar
- Watermark now stays sticky to tank image at fixed position (bottom-right corner)
- Replaced "CoralScape Designer" title with watermark logo in top navigation
- Removed gear/settings icon from top right navigation
- Removed "Coral & Invertebrate Database" text from top center
- Added email tooltip "inquiries.coralscape@gmail.com" to help/question mark icon

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