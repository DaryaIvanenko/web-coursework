import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ENTITY_COLUMNS = {
  'Продажи и Сделки': ['ID сделки', 'Сумма продажи', 'Количество товаров', 'Скидка (%)', 'Статус сделки', 'Дата продажи'],
  'Клиенты': ['ID клиента', 'Имя', 'Email', 'Город', 'Дата регистрации'],
  'Товары': ['ID товара', 'Название товара', 'Категория', 'Цена', 'Остаток на складе']
};

const mapColumnToKey = (columnName) => {
  const map = {
    'ID сделки': 'id',
    'Сумма продажи': 'amount',
    'Количество товаров': 'quantity',
    'Скидка (%)': 'discount',
    'Статус сделки': 'status',
    'Дата продажи': 'dealDate',
    
    'ID товара': 'id',
    'Название товара': 'title',
    'Категория': 'category',
    'Цена': 'price',
    'Остаток на складе': 'stock',

    'ID клиента': 'id',
    'Имя': 'name',
    'Email': 'email',
    'Город': 'city',
    'Дата регистрации': 'createdAt'
  };
  return map[columnName] || columnName;
};

export default function ReportList({ reports = [], onCreate, onDelete }) {
  const { user, isAdmin, logout } = useAuth();

  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [reportTitle, setReportTitle] = useState('');
  const [entityName, setEntityName] = useState('Продажи и Сделки');
  const [selectedColumns, setSelectedColumns] = useState(['Сумма продажи', 'Статус сделки', 'Дата продажи']);
  
  const [filterColumn, setFilterColumn] = useState('Статус сделки');
  const [filterOperator, setFilterOperator] = useState('Равно (=)');
  const [filterValue, setFilterValue] = useState('');

  const [groupBy, setGroupBy] = useState('Без группировки');
  const [aggregateFunc, setAggregateFunc] = useState('Без агрегации (вывести записи)');

  const [sortBy, setSortBy] = useState('Дата продажи');
  const [sortOrder, setSortOrder] = useState('По убыванию (DESC)');

  const fetchReportData = useCallback(async (entity) => {
    if (!entity) return;
    setLoading(true);
    try {
      const { data } = await api.get('/reports/data', { params: { entity } });
      setReportData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Не удалось загрузить данные:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenReport = async (report) => {
    setLoading(true);
    setSelectedReport(report);

    const entityString = typeof report === 'object' ? report.entityName : report;

    try {
      const { data } = await api.get('/reports/data', { params: { entity: entityString } });
      setReportData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки отчета:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
    setReportData([]);
  };

  useEffect(() => {
    document.title = `Отчётов: ${reports.length} — Конструктор отчётов`;
  }, [reports]);

  const handleEntityChange = (e) => {
    const newEntity = e.target.value;
    setEntityName(newEntity);
    const available = ENTITY_COLUMNS[newEntity] || [];
    setSelectedColumns(available.slice(0, 3));
    setFilterColumn(available[0] || '');
    setSortBy(available[0] || '');
  };

  const handleCheckboxChange = (column) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!reportTitle.trim()) return;

  const newReport = {
    title: reportTitle,
    entityName,
    selectedFields: selectedColumns,
    filters: { 
      column: filterColumn, 
      operator: filterOperator, 
      value: filterValue,
      groupBy,
      aggregateFunc,
      sortBy,
      sortOrder
    },
    description: `Создан пользователем ${user?.email || ''}`
  };

  try {
    if (typeof onCreate === 'function') {
      await onCreate(newReport);
    }
    setReportTitle('');
    setFilterValue('');
    alert('Отчёт успешно сохранён!');
  } catch (error) {
    console.error('Ошибка сохранения отчета:', error);
    alert('Не удалось сохранить отчёт');
  }
};
const handleDeleteReport = (reportId) => {
  if (!window.confirm('Вы уверены, что хотите удалить этот отчет?')) return;
  if (typeof onDelete === 'function') onDelete(reportId);
};
  const filteredReports = reports.filter((report) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (report.title || '').toLowerCase().includes(query) ||
      (report.entityName || '').toLowerCase().includes(query)
    );
  });

  const availableColumns = ENTITY_COLUMNS[entityName] || [];
  const isAdmin2 = user?.role?.toLowerCase() === 'admin' || isAdmin;

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
        <div>
          Вы вошли как: <strong>{isAdmin2 ? 'Администратор' : 'Пользователь'}</strong>
        </div>
        <button onClick={logout} style={{ padding: '6px 12px', cursor: 'pointer', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Выйти
        </button>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        📊 Конструктор отчётов по продажам и клиентам
      </h2>

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h3 style={{ textAlign: 'center', color: '#6c63ff', marginTop: 0, marginBottom: '20px' }}>
          Настроить новый отчёт
        </h3>

        <div style={{ marginBottom: '18px', textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
            Название отчёта:
          </label>
          <input
            type="text"
            placeholder="Например: Выручка по городам клиентов за месяц"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ marginBottom: '18px', textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
            Объект анализа (Сущность):
          </label>
          <select
            value={entityName}
            onChange={handleEntityChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#fff' }}
          >
            {Object.keys(ENTITY_COLUMNS).map((entity) => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>
            Колонки в отчёте:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
            {availableColumns.map((col) => (
              <label key={col} style={{ cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={() => handleCheckboxChange(col)}
                  style={{ marginRight: '6px' }}
                />
                {col}
              </label>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px dashed #e0e0e0', margin: '20px 0' }} />

        {/* Фильтр */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', color: '#555' }}>
            🎯 Фильтр (WHERE):
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select value={filterColumn} onChange={(e) => setFilterColumn(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              {availableColumns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            <select value={filterOperator} onChange={(e) => setFilterOperator(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="Равно (=)">Равно (=)</option>
              <option value="Не равно (!=)">Не равно (!=)</option>
              <option value="Больше (>)">Больше (&gt;)</option>
              <option value="Меньше (<)">Меньше (&lt;)</option>
              <option value="Содержит">Содержит</option>
            </select>
            <input
              type="text"
              placeholder="Значение..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '6px', marginBottom: '18px' }}>
          <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', color: '#555' }}>
            📊 Агрегация и Группировка (GROUP BY):
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'center' }}>Группировать по:</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Без группировки">Без группировки</option>
                {availableColumns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'center' }}>Вычислить:</label>
              <select value={aggregateFunc} onChange={(e) => setAggregateFunc(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Без агрегации (вывести записи)">Без агрегации (вывести записи)</option>
                <option value="SUM (Сумма)">SUM (Сумма)</option>
                <option value="AVG (Среднее)">AVG (Среднее)</option>
                <option value="COUNT (Количество)">COUNT (Количество)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', color: '#555' }}>
            ⇅ Сортировка (ORDER BY):
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              {availableColumns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="По возрастанию (ASC)">По возрастанию (ASC)</option>
              <option value="По убыванию (DESC)">По убыванию (DESC)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Сформировать и сохранить отчёт
        </button>
      </form>

      <h3>Сохранённые отчёты ({isAdmin2 ? 'Все пользователи' : 'Мои отчёты'})</h3>
      
      <input
        type="text"
        placeholder="Поиск по названию или сущности..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />

      {filteredReports.length === 0 ? (
        <p style={{ color: '#777' }}>Отчёты не найдены.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredReports.map((report) => (
            <div key={report.id} style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '16px', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#333' }}>{report.title}</h4>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <b>Объект:</b> {report.entityName} | <b>Автор:</b> {report.User?.email || report.userId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenReport(report)}
                  style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  👁 Открыть отчёт
                </button>

                {isAdmin2 && (
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🗑 Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div 
          className="modal-overlay" 
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h3>{selectedReport.title || 'Просмотр отчёта'}</h3>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>⏳ Загрузка данных из БД...</p>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                {(() => {
                  const fields = Array.isArray(selectedReport.selectedFields) && selectedReport.selectedFields.length > 0
                    ? selectedReport.selectedFields
                    : (ENTITY_COLUMNS[selectedReport.entityName] || ENTITY_COLUMNS[selectedReport.entity] || []);

                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#6c63ff', color: '#fff' }}>
                          {fields.map((field) => (
                            <th key={field} style={{ padding: '10px' }}>{field}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.length === 0 ? (
                          <tr>
                            <td colSpan={fields.length || 1} style={{ textAlign: 'center', padding: '15px' }}>
                              Записи не найдены
                            </td>
                          </tr>
                        ) : (
                          reportData.map((row, idx) => (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                              {fields.map((field) => (
                                <td key={field} style={{ padding: '10px' }}>
                                  {(() => {
                                    // сервер может вернуть ключи как на русском ('Имя'), так и как в модели ('name')
                                    const value = row[field] ?? row[mapColumnToKey(field)];
                                    return value !== undefined && value !== null ? String(value) : '—';
                                  })()}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}