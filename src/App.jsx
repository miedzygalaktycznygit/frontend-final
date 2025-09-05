// plik: src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './components/AppContext';
import Main from './components/Main';
import TaskEditorPage from './pages/TaskEditorPage';
import NotificationControlPanel from './components/FCMTestPanel';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Główna ścieżka, która renderuje komponent Main */}
        <Route path="/" element={<Main />} />
        
        {/* Ścieżka do tworzenia nowego zadania */}
        <Route path="/zadanie/nowe" element={<TaskEditorPage />} />
        
        {/* NOWA ŚCIEŻKA do edycji istniejącego zadania */}
        <Route path="/zadanie/edytuj/:taskId" element={<TaskEditorPage />} />
      </Routes>
      
      {/* Panel sterowania powiadomieniami - pojawi się na wszystkich stronach */}
      <NotificationControlPanel />
    </AppProvider>
  );
}