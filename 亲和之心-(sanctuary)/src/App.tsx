import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Session from './pages/Session';
import Summary from './pages/Summary';
import { ensureSpeechVoicesLoaded } from './lib/zhAssistantVoice';

export default function App() {
  useEffect(() => {
    void ensureSpeechVoicesLoaded();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/session" element={<Session />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
