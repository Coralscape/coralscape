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
- Added clickable email dropdown "inquiries.coralscape@gmail.com" to help/question mark icon
- Fixed coral positioning offset in exported images by using actual base image dimensions
- Made canvas dashed border scale to match tank image size exactly
- Increased top navigation logo size by 50% again (from h-12 to h-18)
- Updated search placeholder to "Search corals & inverts..."
- Added "Buy me a frag" donation button with coral emoji next to logo
- Added color wheel image from Google Sheets (sheet 2, column A, row 2) in top right
- Adjusted logo size to h-15 for better balance
- Made entire site responsive for mobile/tablet with adaptive layouts, spacing, and text sizes
- Mobile: Sidebar appears above canvas, layer controls hidden
- Tablet: Similar to mobile but with better spacing
- Desktop: Full three-panel layout with all controls visible
- Reverted sidebar to show 5 specimens in scrollable format
- Added export success popup with "Buy me a frag" donation option after successful export
- Color wheel image now displays in top right navigation from Google Sheets
- Fixed color wheel positioning to appear left of help icon in top navigation
- Added custom coral upload feature with separate "Custom" tab in sidebar
- Users can upload their own coral images which persist for the session
- Custom corals appear in dedicated tab with remove buttons
- Custom uploads create draggable coral items just like database specimens
- Fixed custom coral display issue - uploaded corals now properly show in Custom tab
- Updated color wheel to fetch from same sheet as logo (gid=1974654707) row 2
- Moved export options section above layer controls for better visibility and accessibility
- Added hierarchical filtering system with subcategories (SPS→Acropora, LPS→Hammer, etc.)
- Subtype filters appear indented when main type is selected, showing specific coral classifications
- Updated filter dependencies to include subtype filtering in coral search results
- Fixed canvas export alignment by making dashed border scale to tank image size exactly
- Moved dashed border to wrap only the tank image area instead of entire canvas workspace
- Made border container scale with zoom level for consistent visual appearance at all zoom levels
- Fixed export button to prevent page refresh by adding preventDefault and explicit button type
- Added pan/drag functionality for navigating around zoomed tank images
- Tank image becomes draggable (grab cursor) when zoomed in above 100%
- Pan state resets to (0,0) when uploading new tank image
- Transform now combines zoom and pan using CSS translate for smooth movement
- Auto-centers tank image when zooming back to 100% while preserving coral overlay positions
- Moved export options to the very top of the right panel above layer controls header
- Added trashcan delete icon next to mirror icons for direct layer deletion from canvas
- Fixed custom images to use proportional sizing instead of fixed 150x150 dimensions
- Custom coral uploads now maintain aspect ratio with automatic sizing calculations
- Added keyboard delete functionality (Delete/Backspace keys) to remove selected coral overlays
- Implemented comprehensive undo system with Undo button and Ctrl+Z/Cmd+Z keyboard shortcuts
- Fixed keyboard event handling to prevent conflicts with input fields and support Mac shortcuts
- Redesigned undo system to track individual actions instead of full canvas states
- Undo now reverses single actions: add coral, delete coral, rotate, flip transformations
- Added duplicate action detection and debugging to prevent multiple undos
- Undo button appears next to zoom controls and shows enabled/disabled state
- Fixed drag operation tracking to save only one undo action per complete coral movement
- Resolved coral "sticking" issue by coordinating drag detection systems between components
- Coral overlays now properly release when mouse button is released during dragging
- Added HEIC file support for both tank images and custom coral uploads using heic2any library
- HEIC files are automatically converted to JPEG format for web compatibility with user feedback
- Successfully tested and working - users can now upload iPhone HEIC photos seamlessly
- Implemented automatic coral randomization on page load - different corals appear each time the page opens
- Reverted sidebar to show 5 specimens in scrollable format
- Added anemone filter category to type dropdown with pink badge styling
- Updated coral type detection to identify anemones in specimen names
- Added NPS (Non-Photosynthetic) filter category with red badge styling for NPS corals
- Expanded LPS subtype filters to include micromussa, trachy, chalice, duncan, goniopora, alveopora, lobophyllia, symphyllia, scolymia, acanthophyllia, cynarina, and catalaphyllia
- Fixed coral filtering logic to properly handle type/subtype hierarchical relationships
- Added "color wheel" type filter positioned at bottom of alphabetical type list for color wheel images
- Updated top navigation logo to new image: https://i.ibb.co/KcqLs8LM/Screen-Shot-2025-07-27-at-8-11-42-PM.png
- Updated watermark image to match new logo while maintaining 20% width sizing in canvas and export
- Implemented comprehensive light/dark mode toggle system with theme provider and localStorage persistence
- Set dark mode as the default theme on app startup with fallback to user's saved preference
- Added theme toggle button with moon/sun icons and text labels positioned next to "Buy me a frag" button
- Fixed theme toggle icons to show correctly (moon for dark mode, sun for light mode)
- Applied dark mode styling throughout all components using Tailwind CSS dark variants
- Dark mode features deeper black backgrounds (hsl(240, 10%, 3.9%)) with high contrast for better visibility
- Updated coral card backgrounds to use dark theme colors (bg-card, text-foreground, border-border)
- Layer Controls header text now properly displays white in dark mode
- Updated upload tank image box styling for dark mode with proper text and border colors
- Fixed dashed border colors to use border-border class for consistent dark mode appearance
- Enhanced coral transform controls popup (trash, rotate, mirror icons) with dark mode styling
- Transform controls now use proper background, border, and text colors for better visibility in dark mode
- Delete button maintains red color scheme with appropriate dark mode variants
- Fixed selected coral layer controls panel with dark mode styling for "Selected:" box and all labels
- Updated all text colors in layer controls to use proper foreground/muted-foreground classes
- Export section labels now properly styled for dark mode visibility
- Made tank workspace background black in dark mode for better contrast
- Updated export options section background to black in dark mode
- All UI elements adapt to theme changes including sidebars, canvas workspace, layer controls, and navigation

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