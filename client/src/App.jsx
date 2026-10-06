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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchReports(undefined, signal);
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      if (axios.isCancel(e)) return;
      setError(errText(e));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    loadReports(controller.signal);
    return () => controller.abort(); // отмена при размонтировании
  }, [user, loadReports]);

  // CREATE: оптимистично, с временным id
  const handleCreateReport = async (newData) => {
    const tempId = `tmp-${Date.now()}`;
    setReports((prev) => [{ ...newData, id: tempId, userId: user.id }, ...prev]);
    try {
      const { data } = await createReport(newData);
      setReports((prev) => prev.map((r) => (r.id === tempId ? data : r)));
    } catch (e) {
      setReports((prev) => prev.filter((r) => r.id !== tempId));
      alert('Не удалось создать отчёт: ' + errText(e));
    }
  };

  // UPDATE: оптимистично, откат при ошибке
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

  // DELETE: оптимистично, возврат при ошибке
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
  if (loading) return <p style={{ textAlign: 'center', marginTop: 50 }}>Загрузка...</p>;
  if (error)
    return (
      <div style={{ textAlign: 'center', marginTop: 50 }}>
        <p style={{ color: 'red' }}>Ошибка: {error}</p>
        <button onClick={() => loadReports()}>Повторить</button>
      </div>
    );

  return (
    <ReportList
      reports={reports}
      onCreate={handleCreateReport}
      onUpdate={handleUpdateReport}
      onDelete={handleDeleteReport}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}