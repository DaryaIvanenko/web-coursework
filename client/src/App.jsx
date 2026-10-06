import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ReportList from './components/ReportList';

// Берем URL из переменных окружения Vite (http://localhost:3000)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function MainContent() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. ЗАГРУЗКА ИЗ БАЗЫ ДАННЫХ
  useEffect(() => {
    if (!user) return;

    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/reports?userId=${user.id}&role=${user.role}`
        );

        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Не удалось загрузить отчёты из БД:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [user]);

  // 2. СОЗДАНИЕ ОТЧЁТА (Кнопка "Создать")
  const handleCreateReport = async (newReportData) => {
    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка при сохранении');
      }

      const savedReport = await response.json();
      setReports((prev) => [savedReport, ...prev]);
    } catch (error) {
      console.error('Ошибка создания:', error);
      alert('Не удалось создать отчёт: ' + error.message);
    }
  };

  // 3. УДАЛЕНИЕ ОТЧЁТА (Кнопка "Удалить")
  const handleDeleteReport = async (id) => {
    try {
      const response = await fetch(`${API_URL}/reports/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка при удалении');
      }

      setReports((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить отчёт: ' + error.message);
    }
  };

  if (!user) return <LoginForm />;
  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка из PostgreSQL...</p>;

  // Обязательно передаем пропсы onCreate и onDelete!
  return (
    <ReportList
      reports={reports}
      onCreate={handleCreateReport}
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