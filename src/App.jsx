import './App.css';
import React, { useState, createContext, useContext, useEffect, useCallback, useMemo } from 'react';

// WAŻNE: Wklej tutaj publiczny adres URL swojego serwera z Render!
// Pamiętaj, żeby na końcu było "/api"
const API_URL = 'https://serwer-for-render.onrender.com/api';

// --- Kontekst i Provider (dostawca stanu) ---
const AppContext = createContext(null);

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error('Błąd pobierania użytkowników');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setUsers([]);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error('Błąd pobierania zadań');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      setTasks([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/statystyki`);
      if (!res.ok) throw new Error('Błąd pobierania statystyk');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
      setStats([]);
    }
  }, []);


  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchTasks(), fetchStats()]);
      setIsLoading(false);
    };
    fetchAllData();
  }, [fetchUsers, fetchTasks, fetchStats]);

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        return false;
      }
      const loggedInUser = await res.json();
      setUser(loggedInUser);
      return true;
    } catch (error) {
      console.error("Błąd logowania:", error);
      return false;
    }
  };

  const logout = () => setUser(null);

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, 
        {method: 'DELETE',
      });

      if (!res.ok){
        throw new Error('Nie udało się usunąć użytkownika.');
      }
      fetchUsers();
    } catch (error) {
      console.error("Błąd podczas usuwania użytkownika: ", error);
    }
  };

  const value = { user, users, tasks, stats, login, logout, isLoading, fetchUsers, fetchTasks, fetchStats, deleteUser };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useAppData = () => useContext(AppContext);

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}

function Main() {
  const { user, isLoading } = useAppData();
  if (isLoading) {
    return <div className="login-page-container"><div className="login-form-container"><h2>Ładowanie danych...</h2></div></div>;
  }
  return user ? <Dashboard /> : <LoginPage />;
}

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Nieprawidłowa nazwa użytkownika lub hasło.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2>Logowanie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary submit-btn">Zaloguj</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAppData();
  const renderDashboard = () => {
    switch (user.role) {
      case 'szef':
      case 'kierownik':
        return <BossDashboard />;
      case 'pracownik':
        return <EmployeeDashboard />;
      default:
        return <div>Nieznana rola użytkownika.</div>;
    }
  };
  return (
    <div>
      <nav className="navbar">
        <h1>System Zarządzania</h1>
        <div className="user-info">
          <span>Zalogowano jako: <span className="username">{user.username} ({user.role})</span></span>
          <button onClick={logout} className="btn btn-secondary">Wyloguj</button>
        </div>
      </nav>
      <main className="main-content">{renderDashboard()}</main>
    </div>
  );
}

function EmployeeDashboard() {
  const { user, tasks, fetchTasks } = useAppData();
  const myTasks = tasks.filter(task => task.assignedTo === user.id);

  const addComment = async (taskId, commentText, status) => {
    try {
      await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: taskId,
          author: user.username,
          text: commentText,
          status: status,
        }),
      });
      fetchTasks();
    } catch (error) {
      console.error("Błąd dodawania komentarza:", error);
    }
  };

  return (
    <div>
      <h2>Moje zadania</h2>
      {myTasks.length > 0 ? myTasks.map(task => <TaskView key={task.id} task={task} onAddComment={addComment} />) : <p>Nie masz przypisanych żadnych zadań.</p>}
    </div>
  );
}

function TaskView({ task, onAddComment }) {
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState('normal');
    const handleAddComment = () => {
        if (comment.trim()) {
            onAddComment(task.id, comment, status);
            setComment('');
            setStatus('normal');
        }
    };
    return (
        <div className="card">
            <h3>{task.title}</h3>
            <div className="task-details"><p>Termin: {new Date(task.deadline).toLocaleString('pl-PL')}</p></div>
            <div className="comments-section">
                <h4>Komentarze:</h4>
                {task.comments.length > 0 ? (
                    <div>{task.comments.map((c) => <div key={c.id} className={`comment ${c.status === 'ważne' ? 'status-ważne' : 'status-normal'}`}><p className="comment-author">{c.by}:</p><p>{c.text}</p></div>)}</div>
                ) : <p>Brak komentarzy.</p>}
            </div>
            <div className="add-comment-section">
                <h4>Dodaj nowy komentarz:</h4>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="input-field" placeholder="Wpisz swój komentarz..."></textarea>
                <div className="important-checkbox">
                    <input type="checkbox" id={`status-${task.id}`} checked={status === 'ważne'} onChange={(e) => setStatus(e.target.checked ? 'ważne' : 'normal')} />
                    <label htmlFor={`status-${task.id}`}>Oznacz jako ważne</label>
                </div>
                <button onClick={handleAddComment} className="btn btn-primary">Dodaj komentarz</button>
            </div>
        </div>
    );
}

function BossDashboard() {
  const [view, setView] = useState('tasks');
  const { tasks, fetchTasks, fetchUsers } = useAppData();

  const addTask = async (newTaskData) => {
    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaskData),
    });
    fetchTasks();
  };

  const addUser = async (newUserData) => {
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUserData),
    });
    fetchUsers();
  };

  return (
    <div>
      <nav className="dashboard-nav">
        <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'active' : ''}>Zadania</button>
        <button onClick={() => setView('users')} className={view === 'users' ? 'active' : ''}>Zarządzaj użytkownikami</button>
        <button onClick={() => setView('stats')} className={view === 'stats' ? 'active' : ''}>Statystyki</button>
      </nav>
      {view === 'tasks' && <BossTaskView tasks={tasks} onAddTask={addTask} />}
      {view === 'users' && <UserManagement onAddUser={addUser} />}
      {view === 'stats' && <StatisticsPage />}
    </div>
  );
}

function BossTaskView({ tasks, onAddTask }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const { users } = useAppData();
    const getUsernameById = (id) => users.find(u => u.id === id)?.username || 'Nieznany';
    return (
        <div>
            <div className="task-header">
                <h2>Wszystkie zadania</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">{showCreateForm ? 'Anuluj' : 'Utwórz nowe zadanie'}</button>
            </div>
            {showCreateForm && <CreateTaskForm onAddTask={onAddTask} />}
            {tasks.map(task => (
                <div key={task.id} className="card">
                    <h3>{task.title}</h3>
                    <div className="task-details">
                        <p>Przypisano do: <span className="assigned-to">{getUsernameById(task.assignedTo)}</span></p>
                        <p>Termin: {new Date(task.deadline).toLocaleString('pl-PL')}</p>
                    </div>
                    <div className="comments-section">
                        <h4>Komentarze:</h4>
                        {task.comments.length > 0 ? (
                            <div>{task.comments.map((c) => <div key={c.id} className={`comment ${c.status === 'ważne' ? 'status-ważne' : 'status-normal'}`}><p className="comment-author">{c.by}:</p><p>{c.text}</p></div>)}</div>
                        ) : <p>Brak komentarzy.</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

function CreateTaskForm({ onAddTask }) {
    const [title, setTitle] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const { users } = useAppData();
    const employees = users.filter(u => u.role === 'pracownik');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && assignedTo && deadline) {
            onAddTask({ id: Date.now(), title, assignedTo: parseInt(assignedTo), deadline });
            setTitle(''); setAssignedTo(''); setDeadline('');
        }
    };
    return (
        <div className="card">
            <h3>Nowe zadanie</h3>
            <form onSubmit={handleSubmit}>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł zadania" className="input-field" required />
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="input-field" required>
                    <option value="">Wybierz pracownika</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.username} ({emp.subRole})</option>)}
                </select>
                <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="input-field" required />
                <button type="submit" className="btn btn-primary">Dodaj zadanie</button>
            </form>
        </div>
    );
}

function UserManagement({ onAddUser }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('pracownik');
    const [subRole, setSubRole] = useState('laserownia');
    const { users, deleteUser, user: loggedInUser } = useAppData();

    const handleSubmit = (e) => {
        e.preventDefault();
        const newUser = { id: Date.now(), username, password, role };
        if (role === 'pracownik') newUser.subRole = subRole;
        onAddUser(newUser);
        setUsername(''); setPassword(''); setRole('pracownik'); setSubRole('laserownia');
        setShowCreateForm(false);
    };
    return (
        <div>
            <div className="task-header">
                <h2>Użytkownicy</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">{showCreateForm ? 'Anuluj' : 'Dodaj użytkownika'}</button>
            </div>
            {showCreateForm && (
                <div className="card">
                    <h3>Nowy użytkownik</h3>
                    <form onSubmit={handleSubmit}>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nazwa użytkownika" className="input-field" required />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Hasło" className="input-field" required />
                        <select value={role} onChange={e => setRole(e.target.value)} className="input-field" required>
                            <option value="pracownik">Pracownik</option>
                            <option value="kierownik">Kierownik</option>
                        </select>
                        {role === 'pracownik' && (
                            <select value={subRole} onChange={e => setSubRole(e.target.value)} className="input-field" required>
                                <option value="laserownia">Laserownia</option>
                                <option value="marketing">Marketing</option>
                                <option value="grafik">Grafik</option>
                            </select>
                        )}
                        <button type="submit" className="btn btn-primary">Utwórz użytkownika</button>
                    </form>
                </div>
            )}
            <div className="card">
                <ul className="user-list">
                    {users.map(u => 
                        (loggedInUser.id !== u.id &&(
                            <li key={u.id} className="user-list-item">
                                <span>{u.username}</span><span className="role">{u.role} {u.subRole && `(${u.subRole})`}</span>
                                <button onClick={() => deleteUser(u.id)} className='btn btn-danger'>Usuń</button>
                            </li>
                        )
                    ))}
                </ul>
            </div>
        </div>
    );
}

function StatisticsPage() {
    const { stats, fetchStats } = useAppData();
    const [currentYearIndex, setCurrentYearIndex] = useState(0);
    const [localStats, setLocalStats] = useState(stats);

    useEffect(() => {
        setLocalStats(stats);
    }, [stats]);

    const statsByYear = useMemo(() => {
        return localStats.reduce((acc, stat) => {
            const year = stat.rok;
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(stat);
            acc[year].sort((a, b) => a.miesiac - b.miesiac);
            return acc;
        }, {});
    }, [localStats]);

    const availableYears = Object.keys(statsByYear).sort();
    const currentYearData = statsByYear[availableYears[currentYearIndex]] || [];
    
    const handlePrevYear = () => {
        setCurrentYearIndex(prev => Math.max(0, prev - 1));
    };
    const handleNextYear = () => {
        setCurrentYearIndex(prev => Math.min(availableYears.length - 1, prev + 1));
    };

    const updateStat = async (id, ilosc) => {
        try {
            await fetch(`${API_URL}/statystyki/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ilosc: ilosc === '' ? null : parseInt(ilosc, 10) })
            });
            fetchStats();
        } catch (error) {
            console.error("Błąd aktualizacji statystyk:", error);
        }
    };
    
    const handleInputChange = (id, newIlosc) => {
        const updatedStats = localStats.map(stat => 
            stat.id === id ? { ...stat, ilosc: newIlosc } : stat
        );
        setLocalStats(updatedStats);
    };

    const handleInputBlur = (id, ilosc) => {
        updateStat(id, ilosc);
    };

    const summary = useMemo(() => {
        const totalSales = stats.reduce((acc, curr) => acc + (curr.ilosc || 0), 0);
        
        // Sprzedaż w aktualnie wybranym roku
        const currentYearSales = currentYearData.reduce((sum, month) => sum + (month.ilosc || 0), 0);
        const currentYear = availableYears[currentYearIndex];
        
        const yearlySales = Object.entries(statsByYear).map(([year, yearData]) => {
            const total = yearData.reduce((sum, month) => sum + (month.ilosc || 0), 0);
            return { year: parseInt(year), total };
        }).filter(y => y.total > 0);

        let trend = "Brak wystarczających danych do predykcji.";
        if (yearlySales.length >= 2) {
            let n = yearlySales.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            yearlySales.forEach(p => {
                sumX += p.year;
                sumY += p.total;
                sumXY += p.year * p.total;
                sumX2 += p.year * p.year;
            });

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const lastYearData = yearlySales[yearlySales.length - 1];
            const nextYear = lastYearData.year + 1;
            const prediction = Math.round(Math.max(0, slope * nextYear + ((sumY / n) - slope * (sumX / n))));

            let percentageChange = 0;
            if (lastYearData.total > 0) {
                percentageChange = ((prediction - lastYearData.total) / lastYearData.total) * 100;
            }

            const trendDirection = percentageChange >= 0 ? "wzrost" : "spadek";
            trend = `Przewidywany ${trendDirection} o ${Math.abs(percentageChange).toFixed(2)}%. Prognoza na ${nextYear}: ~${prediction.toLocaleString('pl-PL')} szt.`;
        }
        
        return { totalSales, currentYearSales, currentYear, trend };
    }, [stats, statsByYear, currentYearData, availableYears, currentYearIndex]);

    // NOWA LOGIKA: Obliczanie podpowiedzi sezonowych
    const seasonalSuggestions = useMemo(() => {
        const suggestions = {};
        const currentYear = parseInt(availableYears[currentYearIndex]);
        const prevYear = currentYear - 1;
        const prevYearData = statsByYear[prevYear];

        if (prevYearData) {
            currentYearData.forEach(currentMonthStat => {
                if (currentMonthStat.miesiac > 1) {
                    const prevMonthInCurrentYear = currentYearData.find(s => s.miesiac === currentMonthStat.miesiac - 1);
                    const prevMonthInPrevYear = prevYearData.find(s => s.miesiac === currentMonthStat.miesiac - 1);
                    const currentMonthInPrevYear = prevYearData.find(s => s.miesiac === currentMonthStat.miesiac);

                    if (prevMonthInCurrentYear?.ilosc > 0 && prevMonthInPrevYear?.ilosc > 0 && currentMonthInPrevYear?.ilosc !== null) {
                        const seasonalChange = currentMonthInPrevYear.ilosc / prevMonthInPrevYear.ilosc;
                        const suggestion = Math.round(prevMonthInCurrentYear.ilosc * seasonalChange);
                        suggestions[currentMonthStat.id] = suggestion;
                    }
                }
            });
        }
        return suggestions;
    }, [currentYearData, statsByYear, availableYears, currentYearIndex]);


    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    return (
        <div className="stats-page-container">
            <div className="stats-table-container card">
                <div className="year-navigation">
                    <button onClick={handlePrevYear} disabled={currentYearIndex === 0} className="btn">‹ Poprzedni rok</button>
                    <h2>Statystyki za rok: {availableYears[currentYearIndex]}</h2>
                    <button onClick={handleNextYear} disabled={currentYearIndex === availableYears.length - 1} className="btn">Następny rok ›</button>
                </div>
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th>Miesiąc</th>
                            <th>Ilość sprzedanych produktów</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentYearData.map(stat => (
                            <tr key={stat.id}>
                                <td>{monthNames[stat.miesiac - 1]}</td>
                                <td>
                                    <div className="input-with-suggestion">
                                        <input
                                            type="number"
                                            value={stat.ilosc === null ? '' : stat.ilosc}
                                            onChange={(e) => handleInputChange(stat.id, e.target.value)}
                                            onBlur={(e) => handleInputBlur(stat.id, e.target.value)}
                                            className="input-field"
                                            placeholder="Wprowadź ilość..."
                                        />
                                        {seasonalSuggestions[stat.id] && (
                                            <span className="suggestion-text">
                                                (sugestia: {seasonalSuggestions[stat.id]}, roboczogodziny: {Math.ceil(seasonalSuggestions[stat.id] / 5)})
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="stats-summary-container card">
                <h3>Podsumowanie</h3>
                <div className="summary-item">
                    <h4>Sprzedaż w roku {summary.currentYear}</h4>
                    <p className="summary-value">{summary.currentYearSales.toLocaleString('pl-PL')} szt.</p>
                </div>
                <div className="summary-item">
                    <h4>Całkowita sprzedaż (wszystkie lata)</h4>
                    <p className="summary-value">{summary.totalSales.toLocaleString('pl-PL')} szt.</p>
                </div>
                <div className="summary-item">
                    <h4>Prognoza na następny rok</h4>
                    <p className="summary-value trend-text">{summary.trend}</p>
                </div>
            </div>
        </div>
    );
}
