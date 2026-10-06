import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ENTITY_COLUMNS = {
  'Продажи и Сделки': ['ID сделки', 'Сумма продажи', 'Количество товаров', 'Скидка (%)', 'Статус сделки', 'Дата продажи'],
  'Клиенты': ['ID клиента', 'Имя', 'Email', 'Город', 'Дата регистрации'],
  'Товары': ['ID товара', 'Название товара', 'Категория', 'Цена', 'Остаток на складе']
};

// Функция-генератор тестовых данных для вывода в таблице отчёта
const generateMockData = (entityName) => {
  if (entityName === 'Клиенты') {
    return [
      { 'ID клиента': 101, 'Имя': 'Иван Иванов', 'Email': 'ivan@example.com', 'Город': 'Москва', 'Дата регистрации': '2024-01-15' },
      { 'ID клиента': 102, 'Имя': 'Анна Смирнова', 'Email': 'anna@example.com', 'Город': 'Санкт-Петербург', 'Дата регистрации': '2024-02-10' },
      { 'ID клиента': 103, 'Имя': 'Пётр Петров', 'Email': 'petr@example.com', 'Город': 'Казань', 'Дата регистрации': '2024-03-05' },
      { 'ID клиента': 104, 'Имя': 'Ольга Сидорова', 'Email': 'olga@example.com', 'Город': 'Москва', 'Дата регистрации': '2024-03-12' },
    ];
  }
  if (entityName === 'Товары') {
    return [
      { 'ID товара': 'P-01', 'Название товара': 'Ноутбук Pro 15', 'Категория': 'Электроника', 'Цена': 85000, 'Остаток на складе': 12 },
      { 'ID товара': 'P-02', 'Название товара': 'Смартфон X', 'Категория': 'Электроника', 'Цена': 45000, 'Остаток на складе': 25 },
      { 'ID товара': 'P-03', 'Название товара': 'Беспроводные наушники', 'Категория': 'Аксессуары', 'Цена': 7500, 'Остаток на складе': 50 },
      { 'ID товара': 'P-04', 'Название товара': 'Механическая клавиатура', 'Категория': 'Аксессуары', 'Цена': 6200, 'Остаток на складе': 18 },
    ];
  }
  // По умолчанию: 'Продажи и Сделки'
  return [
    { 'ID сделки': 'TRX-1001', 'Сумма продажи': 12500, 'Количество товаров': 2, 'Скидка (%)': 5, 'Статус сделки': 'Оплачено', 'Дата продажи': '2024-03-28' },
    { 'ID сделки': 'TRX-1002', 'Сумма продажи': 45000, 'Количество товаров': 1, 'Скидка (%)': 0, 'Статус сделки': 'Оплачено', 'Дата продажи': '2024-03-29' },
    { 'ID сделки': 'TRX-1003', 'Сумма продажи': 7800, 'Количество товаров': 3, 'Скидка (%)': 10, 'Статус сделки': 'В обработке', 'Дата продажи': '2024-03-30' },
    { 'ID сделки': 'TRX-1004', 'Сумма продажи': 21000, 'Количество товаров': 2, 'Скидка (%)': 0, 'Статус сделки': 'Отменено', 'Дата продажи': '2024-03-31' },
  ];
};

export default function ReportList({ reports = [], onCreate, onDelete }) {
  const { user, isAdmin, logout } = useAuth();

  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Состояния формы конструктора
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleSubmit = (e) => {
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
      description: `Создан пользователем ${user?.email || ''}`,
      userId: user?.id
    };

    if (typeof onCreate === 'function') {
      onCreate(newReport);
    }

    setReportTitle('');
    setFilterValue('');
  };

  const filteredReports = reports.filter((report) => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (report.title || '').toLowerCase().includes(query) ||
      (report.entityName || '').toLowerCase().includes(query)
    );
  });

  const availableColumns = ENTITY_COLUMNS[entityName] || [];

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      
      {/* Панель пользователя */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
        <div>
          Вы вошли как: <b>{user?.email}</b> ({isAdmin ? '👑 Администратор' : '👤 Пользователь'})
        </div>
        <button onClick={logout} style={{ padding: '6px 12px', cursor: 'pointer', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Выйти
        </button>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        📊 Конструктор отчётов по продажам и клиентам
      </h2>

      {/* --- ФОРМА КОНСТРУКТОРА --- */}
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

        {/* Агрегация и Группировка */}
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

        {/* Сортировка */}
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

      <h3>Сохранённые отчёты ({isAdmin ? 'Все пользователи' : 'Мои отчёты'})</h3>
      
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
                  onClick={() => setSelectedReport(report)}
                  style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  👁 Открыть отчёт
                </button>

                {isAdmin && (
                  <button
                    onClick={() => onDelete(report.id)}
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

      {/* --- МОДАЛЬНОЕ ОКНО: ТАБЛИЦА С ДАННЫМИ ОТЧЁТА --- */}
      {selectedReport && (() => {
        // Получаем тестовые данные для вывода в таблице
        const rawData = generateMockData(selectedReport.entityName);
        const displayFields = Array.isArray(selectedReport.selectedFields) && selectedReport.selectedFields.length > 0
          ? selectedReport.selectedFields
          : (ENTITY_COLUMNS[selectedReport.entityName] || []);

        return (
          <div
            onClick={() => setSelectedReport(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{selectedReport.title}</h3>
                <span style={{ fontSize: '12px', background: '#e9ecef', padding: '4px 8px', borderRadius: '4px' }}>
                  {selectedReport.entityName}
                </span>
              </div>

              {/* Блок с параметрами фильтрации */}
              {selectedReport.filters && (
                <div style={{ backgroundColor: '#f8f9fa', padding: '10px 14px', borderRadius: '6px', marginBottom: '15px', fontSize: '12px', color: '#555' }}>
                  <b>Применённые фильтры:</b>{' '}
                  {selectedReport.filters.column && selectedReport.filters.value ? (
                    <span>{selectedReport.filters.column} {selectedReport.filters.operator} "{selectedReport.filters.value}" | </span>
                  ) : null}
                  <span>Группировка: {selectedReport.filters.groupBy || 'Нет'} | </span>
                  <span>Сортировка: {selectedReport.filters.sortBy || 'Нет'} ({selectedReport.filters.sortOrder || ''})</span>
                </div>
              )}

              {/* ТАБЛИЦА С ДАННЫМИ */}
              <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#6c63ff', color: '#fff' }}>
                      {displayFields.map((field) => (
                        <th key={field} style={{ padding: '10px 12px', borderBottom: '2px solid #dee2e6' }}>
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.map((row, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                        {displayFields.map((field) => (
                          <td key={field} style={{ padding: '10px 12px', borderBottom: '1px solid #dee2e6' }}>
                            {row[field] !== undefined ? row[field] : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '12px', color: '#777' }}>Всего записей: {rawData.length}</span>
                <button
                  onClick={() => setSelectedReport(null)}
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
        );
      })()}

    </div>
  );
}