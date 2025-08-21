import React, { useState, createContext, useContext, useEffect, useCallback, useMemo } from 'react';

const API_URL = 'https://serwer-for-render.onrender.com/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // ZMODYFIKOWANA linia: stan początkowy pobierany z localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [users, setUsers] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error('Błąd pobierania użytkowników');
      const data = await res.json();
      setUsers(data);
    } catch (error) { console.error(error); setUsers([]); }
  }, []);

  const fetchCalendarTasks = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/tasks/calendar?userId=${userId}`);
      if (!res.ok) throw new Error('Błąd pobierania zadań kalendarza');
      const data = await res.json();
      setCalendarTasks(data);
    } catch (error) { console.error(error); setCalendarTasks([]); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/statystyki`);
      if (!res.ok) throw new Error('Błąd pobierania statystyk');
      const data = await res.json();
      setStats(data);
    } catch (error) { console.error(error); setStats([]); }
  }, []);

  useEffect(() => {
    if (user) {
        setIsLoading(true);
        Promise.all([fetchUsers(), fetchCalendarTasks(user.id), fetchStats()])
            .finally(() => setIsLoading(false));
    } else {
        setCalendarTasks([]);
        setIsLoading(false);
    }
  }, [user, fetchUsers, fetchCalendarTasks, fetchStats]);

  // ZMODYFIKOWANY useEffect do zapisu stanu user w localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const loggedInUser = await res.json();
      setUser(loggedInUser);
      return true;
    } catch (error) {
      console.error("Błąd logowania:", error);
      return false;
    }
  };
  
  const logout = () => setUser(null);

  const saveOrUpdateTask = async (taskData, taskId) => {
    try {
      const method = taskId ? 'PUT' : 'POST';
      const endpoint = taskId ? `${API_URL}/tasks/${taskId}` : `${API_URL}/tasks`;
      const res = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error('Błąd serwera przy zapisie szkicu');
      await fetchCalendarTasks(user.id);
      return await res.json();
    } catch (error) {
        console.error("Błąd [saveOrUpdateTask]:", error);
        return null;
    }
  };

  const publishTask = async (taskPayload, taskId) => {
    try {
      if (!taskId) {
        const newDraft = await saveOrUpdateTask(taskPayload, null);
        if (!newDraft) throw new Error("Nie udało się stworzyć szkicu przed publikacją.");
        taskId = newDraft.id;
      }
      
      const res = await fetch(`${API_URL}/tasks/${taskId}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error('Błąd serwera przy publikacji zadania');
      
      await fetchCalendarTasks(user.id);
      return true;
    } catch (error) {
      console.error("Błąd [publishTask]:", error);
      return false;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' });
       if (!res.ok) {
        throw new Error('Błąd serwera przy usuwaniu zadania');
      }
      await fetchCalendarTasks(user.id);
      return true;
    } catch (error) {
      console.error("Błąd [deleteTask]:", error);
      return false;
    }
  };

  const value = useMemo(() => ({
    user,
    users,
    calendarTasks,
    stats,
    isLoading,
    login,
    logout,
    fetchUsers,
    fetchCalendarTasks,
    fetchStats,
    saveOrUpdateTask,
    publishTask,
    deleteTask,
    API_URL 
  }), [user, users, calendarTasks, stats, isLoading, fetchCalendarTasks]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppData = () => useContext(AppContext);