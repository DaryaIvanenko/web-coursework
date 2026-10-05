import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MOCK_DATABASE = {
  clients: [
    { id: 1, fullName: 'Иванов Иван Петрович', email: 'ivanov@mail.ru', registrationDate: '2026-01-15', status: 'Активен' },
    { id: 2, fullName: 'Петров Сергей Васильевич', email: 'petrov@gmail.com', registrationDate: '2026-03-20', status: 'Заблокирован' },
    { id: 3, fullName: 'Сидорова Анна Сергеевна', email: 'sidorova@yandex.ru', registrationDate: '2026-05-10', status: 'Активен' }
  ],
  orders: [
    { id: 101, orderNumber: 'ORD-001', clientName: 'Иванов И.П.', totalAmount: 1500, orderDate: '2026-09-01' },
    { id: 102, orderNumber: 'ORD-002', clientName: 'Сидорова А.С.', totalAmount: 450, orderDate: '2026-09-12' },
    { id: 103, orderNumber: 'ORD-003', clientName: 'Петров С.В.', totalAmount: 3200, orderDate: '2026-09-25' }
  ]
};

const AVAILABLE_MODULES = [
  {
    id: 'clients',
    label: 'Клиенты и пользователи',
    fields: [
      { id: 'fullName', label: 'ФИО / Имя' },
      { id: 'email', label: 'Электронная почта' },
      { id: 'registrationDate', label: 'Дата регистрации' },
      { id: 'status', label: 'Статус аккаунта' }
    ]
  },
  {
    id: 'orders',
    label: 'Заказы и продажи',
    fields: [
      { id: 'orderNumber', label: 'Номер заказа' },
      { id: 'clientName', label: 'Имя клиента' },
      { id: 'totalAmount', label: 'Сумма заказа (руб.)' },
      { id: 'orderDate', label: 'Дата оформления' }
    ]
  }
];

const INITIAL_REPORTS = [
  {
    id: 1,
    title: 'Отчёт по активным клиентам',
    moduleId: 'clients',
    selectedFields: ['fullName', 'email', 'status'],
    filterField: 'status',
    filterOperator: 'equals',
    filterValue: 'Активен'
  }
];

export default function ReportList() {
  const [reports, setReports] = useLocalStorage('user_reports_v4', INITIAL_REPORTS);
  const [editingId, setEditingId] = useState(null);

  const [activeReport, setActiveReport] = useState(null);

  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState('clients');
  const [selectedFields, setSelectedFields] = useState(['fullName', 'email']);
  const [filterField, setFilterField] = useState('status');
  const [filterOperator, setFilterOperator] = useState('equals');
  const [filterValue, setFilterValue] = useState('');

  const currentModule = AVAILABLE_MODULES.find((m) => m.id === moduleId);

  const generateReportData = (report) => {
    if (!report) return [];
    const rawData = MOCK_DATABASE[report.moduleId] || [];

    return rawData.filter((item) => {
      if (!report.filterValue) return true;
      const fieldValue = String(item[report.filterField] || '').toLowerCase();
      const targetValue = report.filterValue.toLowerCase();

      switch (report.filterOperator) {
        case 'equals':
          return fieldValue === targetValue;
        case 'contains':
          return fieldValue.includes(targetValue);
        case 'greater':
          return Number(item[report.filterField]) > Number(targetValue);
        case 'less':
          return Number(item[report.filterField]) < Number(targetValue);
        default:
          return true;
      }
    });
  };

useEffect(() => {
  if (activeReport) {
    const resultsCount = generateReportData(activeReport).length;
    // Название: "[Записей: 3] Отчёт по клиентам (Всего шаблонов: 2)"
    document.title = `Записей в "${activeReport.title}": ${resultsCount}, отчётов: ${reports.length})`;
  } else {
    document.title = `Отчётов: ${reports.length} — Конструктор отчётов`;
  }
}, [reports, activeReport, generateReportData]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setModuleId('clients');
    setSelectedFields(['fullName', 'email']);
    setFilterField('status');
    setFilterOperator('equals');
    setFilterValue('');
  };

  const handleModuleChange = (newModuleId) => {
    setModuleId(newModuleId);
    const newMod = AVAILABLE_MODULES.find((m) => m.id === newModuleId);
    setSelectedFields([newMod.fields[0].id]);
    setFilterField(newMod.fields[0].id);
  };

  const handleFieldToggle = (fieldId) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleStartEdit = (report) => {
    setEditingId(report.id);
    setTitle(report.title);
    setModuleId(report.moduleId);
    setSelectedFields(report.selectedFields);
    setFilterField(report.filterField);
    setFilterOperator(report.filterOperator);
    setFilterValue(report.filterValue || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || selectedFields.length === 0) return;

    const reportData = {
      title: title.trim(),
      moduleId,
      selectedFields,
      filterField,
      filterOperator,
      filterValue: filterValue.trim()
    };

    if (editingId) {
      setReports((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...reportData } : r)));
    } else {
      setReports((prev) => [{ id: Date.now(), ...reportData }, ...prev]);
    }

    resetForm();
  };

  const handleDelete = (id) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) resetForm();
    if (activeReport?.id === id) setActiveReport(null);
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>📊 Конструктор пользовательских отчётов</h2>

      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e9ecef' }}>
        <h3>{editingId ? '✏️ Редактирование шаблона' : 'Создать новый шаблон отчёта'}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Название отчёта:</label>
            <input
              type="text"
              placeholder="Например: Выборка крупных заказов"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Раздел данных:</label>
            <select value={moduleId} onChange={(e) => handleModuleChange(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
              {AVAILABLE_MODULES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Колонки для выборки:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {currentModule.fields.map((field) => (
              <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={selectedFields.includes(field.id)} onChange={() => handleFieldToggle(field.id)} />
                {field.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Условие фильтрации:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <select value={filterField} onChange={(e) => setFilterField(e.target.value)} style={{ padding: '8px' }}>
              {currentModule.fields.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <select value={filterOperator} onChange={(e) => setFilterOperator(e.target.value)} style={{ padding: '8px' }}>
              <option value="equals">Равно</option>
              <option value="contains">Содержит</option>
              <option value="greater">Больше чем</option>
              <option value="less">Меньше чем</option>
            </select>
            <input type="text" placeholder="Значение..." value={filterValue} onChange={(e) => setFilterValue(e.target.value)} style={{ padding: '8px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: editingId ? '#1890ff' : '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {editingId ? 'Сохранить изменения' : 'Сохранить шаблон'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3>Сохранённые шаблоны отчётов</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reports.map((report) => {
          const mod = AVAILABLE_MODULES.find((m) => m.id === report.moduleId);
          return (
            <li key={report.id} style={{ border: '1px solid #ddd', padding: '12px 16px', borderRadius: '6px', marginBottom: '10px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0' }}>{report.title}</h4>
                <div style={{ fontSize: '13px', color: '#555' }}>Раздел: <b>{mod?.label}</b></div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setActiveReport(report)} style={{ backgroundColor: '#52c41a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  Просмотреть
                </button>
                <button onClick={() => handleStartEdit(report)} style={{ backgroundColor: '#1890ff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  Изменить
                </button>
                <button onClick={() => handleDelete(report.id)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  Удалить
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {activeReport && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>📋 Результат отчёта: "{activeReport.title}"</h3>
            <button onClick={() => setActiveReport(null)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer' }}>❌ Закрыть</button>
          </div>

          {(() => {
            const reportData = generateReportData(activeReport);
            const mod = AVAILABLE_MODULES.find((m) => m.id === activeReport.moduleId);

            if (reportData.length === 0) {
              return <p style={{ color: '#888' }}>По заданным условиям данные не найдены.</p>;
            }

            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                    {activeReport.selectedFields.map((fId) => {
                      const fieldInfo = mod?.fields.find((f) => f.id === fId);
                      return <th key={fId} style={{ padding: '10px', textAlign: 'left', border: '1px solid #f0f0f0' }}>{fieldInfo?.label || fId}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {activeReport.selectedFields.map((fId) => (
                        <td key={fId} style={{ padding: '10px', border: '1px solid #f0f0f0' }}>{row[fId]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
    </div>
  );
}