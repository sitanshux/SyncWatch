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

- **Frontend**: React (Vite) on port `5173`
- **Backend**: Express + Node.js on port `3001`
- **Real-Time Link**: Socket.io (with CORS allowed between client and server)
- **Styling**: Tailwind CSS (custom dark theme, #111111 background, no glassmorphism or gradients)

## How to Install and Run

Follow these steps from the project root directory:

### 1. Install All Dependencies
To install dependencies for the root, frontend, and backend all at once, run:
```bash
npm run install:all
```
*Alternatively, you can manually run `npm install` inside the `client/` and `server/` directories.*

### 2. Run Both Frontend and Backend Simultaneously
To start the React frontend dev server and the Node.js backend server at the same time:
```bash
npm run dev
```
This runs the root orchestration script via `concurrently`, spinning up:
- The React Vite dev server on [http://localhost:5173](http://localhost:5173)
- The Node.js Express server on [http://localhost:3001](http://localhost:3001)

### 3. Verify Socket.io Connection
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. The UI will show a **System Status** card indicating `Connected` once the connection is established.
3. It will display the generated **Socket Connection ID** (e.g., `_H_KspP2gE5QfK4xAAAB`).
4. In your terminal, the backend logs will confirm connection:
   ```text
   [Socket.io] Client connected: _H_KspP2gE5QfK4xAAAB
   ```
## Project Documentation

Before contributing or modifying SyncWatch, read:

/docs/design-system/
/docs/engineering/

These documents define the official design language and engineering architecture of the project.

All future changes must follow these specifications.