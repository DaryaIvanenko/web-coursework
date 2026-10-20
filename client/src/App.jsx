import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ReportList from './components/ReportList';
import { fetchReports, createReport, updateReport, deleteReport } from './api';

const errText = (e) =>
  e.response?.data?.error || e.response?.data?.message || e.message || 'Ошибка сети';

function MainContent() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadReports = useCallback(async (signal) => {
    setSearching(true);
    setError('');
    try {
      const { data } = await fetchReports({ search: searchTerm }, signal);
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      if (axios.isCancel(e)) return;
      setError(errText(e));
    } finally {
      if (!signal?.aborted) {
        setSearching(false);
        setInitialLoading(false);
      }
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    loadReports(controller.signal);
    return () => controller.abort();
  }, [user, loadReports]);

  const handleCreateReport = async (newData) => {
    const tempId = `tmp-${Date.now()}`;
    setReports((prev) => [{ ...newData, id: tempId, userId: user.id }, ...prev]);
    try {
      const { data } = await createReport(newData);
      setReports((prev) => prev.map((r) => (r.id === tempId ? data : r)));
    } catch (e) {
      setReports((prev) => prev.filter((r) => r.id !== tempId));
      throw new Error(errText(e));
    }
  };

  const handleUpdateReport = async (id, changes) => {
    const backup = reports;
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
    try {
      const { data } = await updateReport(id, changes);
      setReports((prev) => prev.map((r) => (r.id === id ? data : r)));
    } catch (e) {
      setReports(backup);
      alert('Не удалось обновить отчёт: ' + errText(e));
    }
  };

  const handleDeleteReport = async (id) => {
    const backup = reports;
    setReports((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReport(id);
    } catch (e) {
      setReports(backup);
      alert('Не удалось удалить отчёт: ' + errText(e));
    }
  };

  if (!user) return <LoginForm />;
  if (initialLoading) {
    return <p style={{ textAlign: 'center', marginTop: 50 }}>Загрузка...</p>;
  }

  return (
    <>
      {error && (
        <div style={{ maxWidth: 900, margin: '20px auto 0', padding: 12, textAlign: 'center', background: '#fdecea', border: '1px solid #f5c2c0', borderRadius: 6 }}>
          <p style={{ color: '#b00020', margin: '0 0 8px' }}>Ошибка: {error}</p>
          <button onClick={() => loadReports()}>Повторить</button>
        </div>
      )}
      <ReportList
        reports={reports}
        searching={searching}
        onSearch={setSearchTerm}
        onCreate={handleCreateReport}
        onUpdate={handleUpdateReport}
        onDelete={handleDeleteReport}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
