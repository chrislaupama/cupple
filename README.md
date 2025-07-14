# Cupple - AI-Powered Therapy Platform

A sophisticated AI-powered communication platform designed to enhance emotional connection between couples through intelligent, real-time messaging and personalized interaction tools. The platform also provides personal therapy sessions for individual users.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.6.3-blue.svg)

## Features

### 🤝 Couples Therapy
- AI-guided therapy sessions for couples
- Real-time chat with both partners
- Partner relationship mapping
- Shared session history

### 👤 Personal Therapy
- Individual AI therapy sessions
- Private and secure conversations
- Personalized AI responses

### 🚀 Real-time Communication
- WebSocket-powered live messaging
- Character-by-character AI response streaming
- Typing indicators and visual effects
- Automatic session title generation

### 🎨 Modern UI/UX
- Responsive design for mobile, tablet, and desktop
- Light/dark theme support with system preference detection
- Modern component library with shadcn/ui
- Smooth animations and transitions

### 🔐 Secure Authentication
- Replit Auth integration with OpenID Connect
- Secure session management
- HTTP-only cookies with secure flags

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **shadcn/ui** component library built on Radix UI
- **TanStack React Query** for server state management
- **Wouter** for lightweight routing
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication
- **WebSocket** for real-time communication
- **OpenAI API** for AI therapy responses

### Database
- **PostgreSQL 16** via Neon serverless
- **Drizzle Kit** for schema management
- Session-based storage with connect-pg-simple

### Deployment
- **Replit** for hosting and deployment
- **Node.js 20** runtime
- **ESBuild** for production bundling

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configs
│   │   └── contexts/       # React contexts
├── server/                 # Backend Express.js application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── websocket.ts        # WebSocket server setup
│   ├── openai.ts           # AI integration
│   └── replitAuth.ts       # Authentication setup
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── dist/                   # Production build output
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- OpenAI API key
- Replit account (for authentication)

### Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
OPENAI_API_KEY=your_openai_api_key
REPLIT_DOMAINS=your_allowed_domains
ISSUER_URL=your_openid_connect_issuer_url
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cupple
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### Development Workflow

1. **Frontend Development**: The Vite dev server provides hot module replacement for React components
2. **Backend Development**: The server automatically restarts on file changes using tsx
3. **Database Changes**: Use Drizzle schema definitions and push changes with `npm run db:push`
4. **Real-time Features**: WebSocket server is integrated with the HTTP server for seamless development

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user information
- `POST /api/auth/logout` - Logout user

### Sessions
- `GET /api/sessions` - Get user's therapy sessions
- `POST /api/sessions` - Create new therapy session
- `DELETE /api/sessions/:id` - Delete therapy session

### Messages
- `GET /api/sessions/:id/messages` - Get session messages
- `POST /api/sessions/:id/messages` - Send new message

### WebSocket Events
- `message` - Send chat message
- `ai_response_stream` - Receive streaming AI response
- `title_update` - Receive session title updates

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User profiles and authentication data
- **therapy_sessions**: Chat sessions (couples or private)
- **messages**: Individual messages within therapy sessions
- **partners**: Relationship mapping for couples therapy
- **sessions**: Express session storage

## AI Integration

The platform integrates with OpenAI to provide therapy responses:

- **GPT-4**: Primary model for therapy conversations
- **GPT-3.5 Turbo**: Used for session title generation
- **Streaming**: Real-time character-by-character response display
- **Context**: Different prompts for couples vs personal therapy
- **Auto-titles**: Intelligent session naming based on conversation content

## Deployment

### Production Build

```bash
npm run build
```

This creates:
- `dist/public/` - Static frontend assets
- `dist/index.js` - Bundled server code

### Replit Deployment

The application is configured for Replit Autoscale deployment:

1. Connect your repository to Replit
2. Configure environment variables
3. Deploy using the Replit deploy button

The app will be available at your `.replit.app` domain.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow existing component patterns
- Use shadcn/ui components when possible
- Write meaningful commit messages
- Test your changes thoroughly

## Security

- All authentication is handled through Replit Auth
- Sessions are stored securely in PostgreSQL
- HTTP-only cookies prevent XSS attacks
- Environment variables protect sensitive keys
- AI responses are processed server-side for security

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

- **June 29, 2025**: Standardized naming conventions across all components
- **June 27, 2025**: Completed automatic session title generation with real-time streaming
- **June 27, 2025**: Implemented global WebSocket provider for title updates
- **June 26, 2025**: Added real-time text streaming for AI responses
- **June 26, 2025**: Initial project setup and core features

## Support

For questions, issues, or feature requests, please open an issue on the repository.

---

Built with ❤️ using React, Express.js, and OpenAI