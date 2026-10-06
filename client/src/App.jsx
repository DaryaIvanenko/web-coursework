import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ReportList from './components/ReportList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function MainContent() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
const loadReports = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    
    if (!token || !user) return;

    const response = await fetch(`${API_URL}/reports?userId=${user.id}&role=${user.role}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }

    const data = await response.json();
    console.log('Загруженные отчеты из БД:', data);

    // Сохраняем массив отчетов
    setReports(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(' Ошибка загрузки отчетов:', error);
  } finally {
    setLoading(false); 
  }
};

    loadReports();
  }, [user]);

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