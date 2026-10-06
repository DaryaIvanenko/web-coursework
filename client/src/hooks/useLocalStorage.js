import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Ленивая инициализация
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Ошибка чтения localStorage по ключу "${key}":`, error);
      return initialValue;
    }
  });

  // Запись в localStorage при изменении значения
  useEffect(() => {
    try {
      if (storedValue === undefined || storedValue === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Ошибка записи в localStorage по ключу "${key}":`, error);
    }
  }, [key, storedValue]);

  // Слушатель изменений в localStorage (для синхронизации между вкладками/компонентами)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        try {
          setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
        } catch (error) {
          console.error(`Ошибка синхронизации localStorage по ключу "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setStoredValue];
}