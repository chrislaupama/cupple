# replit.md

## Overview

This is a full-stack AI therapy application called "cupple" that provides both couples and personal therapy sessions through AI-powered conversations. The application features a modern web interface with real-time chat functionality and user authentication.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **AI Integration**: OpenAI API for therapy responses
- **Real-time Communication**: WebSocket for live chat

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme system
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Theme**: Light/dark mode support with system preference detection

### Backend Architecture
- **Server**: Express.js with TypeScript
- **ORM**: Drizzle with PostgreSQL dialect
- **Database Connection**: Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL storage
- **WebSocket**: Custom WebSocket server for real-time messaging
- **AI Service**: OpenAI integration for therapy responses

### Database Schema
The application uses a PostgreSQL database with the following key tables:
- `users`: User profiles and authentication data
- `sessions`: Session storage for authentication
- `therapy_sessions`: Chat sessions (couples or private)
- `messages`: Individual messages within therapy sessions
- `partners`: Relationship mapping for couples therapy

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Strategy**: Passport.js with custom OIDC strategy
- **Session Storage**: PostgreSQL-backed sessions
- **Security**: HTTP-only cookies with secure flag

### AI Integration
- **Provider**: OpenAI API
- **Models**: GPT-4 for therapy responses, GPT-3.5 Turbo for title generation
- **Streaming**: Real-time text streaming with character-by-character display
- **Context**: Different system prompts for couples vs personal therapy
- **Visual Effects**: Typing indicators and blinking cursor during streaming
- **Auto Titles**: Intelligent session title generation based on conversation topics
- **Title Streaming**: Real-time title updates via WebSocket for immediate UI feedback

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or updating user records
2. **Session Creation**: Users can create either couples or personal therapy sessions
3. **Real-time Chat**: Messages are sent via WebSocket, stored in database, and AI responses are generated
4. **AI Processing**: OpenAI processes user messages with appropriate therapy context and streams responses
5. **State Management**: React Query manages client-side data synchronization

## External Dependencies

### Production Dependencies
- **@anthropic-ai/sdk**: Alternative AI provider (configured but not actively used)
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **@radix-ui/***: UI primitive components
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Database ORM
- **express**: Web server framework
- **openai**: AI service integration
- **passport**: Authentication middleware
- **ws**: WebSocket implementation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS framework
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit modules
- **Database**: PostgreSQL 16 via Replit
- **Dev Server**: Vite dev server with HMR on port 5000
- **WebSocket**: Integrated with HTTP server

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Migrations handled via Drizzle Kit
- **Deployment**: Replit Autoscale with external port 80

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `OPENAI_API_KEY`: OpenAI API authentication
- `REPLIT_DOMAINS`: Allowed domains for OIDC
- `ISSUER_URL`: OpenID Connect issuer URL

## Changelog

```
Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Implemented real-time text streaming for AI responses with visual indicators
- June 26, 2025. Added automatic session title generation with streaming and WebSocket broadcasting
- June 27, 2025. Fixed UI reactivity for automatic title updates - sessions now update in real-time
- June 27, 2025. Implemented global WebSocket provider to ensure title updates work across all pages
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```