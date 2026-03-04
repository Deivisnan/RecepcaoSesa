import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Controller from './pages/Controller';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/controlador/:sectorId" element={<Controller />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
