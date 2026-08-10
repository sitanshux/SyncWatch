# SyncWatch

SyncWatch is a full-stack real-time web application foundation built using React (Vite), Node.js, Express, and Socket.io. It utilizes Tailwind CSS for its minimal dark styling.

## Project Structure

```text
client/                  # Frontend React application
  src/
    components/          # UI Components (StatusCard, etc.)
    hooks/               # Custom React hooks (useSocket)
    pages/               # Page layouts (Home)
    socket/              # Socket.io client setup
    utils/               # Common helper utilities
server/                  # Backend Node.js / Express application
  routes/                # Express API router and routes
  socket/                # Socket.io connection & event handlers
package.json             # Root-level configuration for orchestration
```

## Tech Stack & Configuration

- **Frontend**: React (Vite) 
- **Backend**: Express + Node.js 
- **Real-Time Link**: Socket.io (with CORS allowed between client and server)
- **Styling**: Tailwind CSS (custom dark theme, #111111 background, no glassmorphism or gradients)

