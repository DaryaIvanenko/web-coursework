import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Ленивая инициализация состояния из localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Ошибка чтения localStorage по ключу "${key}":`, error);
      return initialValue;
    }
  });

  // Эффект сохранения в localStorage при изменении value
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Ошибка записи в localStorage по ключу "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}