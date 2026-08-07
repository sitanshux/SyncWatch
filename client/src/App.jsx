import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';

/**
 * Main App Router Component
 * Supports direct invite links (/join/:roomCodeUrl)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/join/:roomCodeUrl" element={<JoinRoom />} />
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}
