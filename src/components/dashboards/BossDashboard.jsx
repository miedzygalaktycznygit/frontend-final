import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TasksCalendarView from '../tasks/TasksCalendarView';
import DayTasksPopup from '../tasks/DayTasksPopup';
import UserManagement from '../users/UserManagement';
import StatisticsPage from '../stats/StatisticsPage';
import { useAppData } from '../AppContext';
import AllTasksView from '../tasks/AllTasksPage';
import TodayTasksView from '../tasks/TodayTasksView';

export default function BossDashboard() {
  const [view, setView] = useState('calendar');
  const navigate = useNavigate();
  const { calendarTasks, user: currentUser } = useAppData(); // Pobieramy też currentUser
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const handleDayClick = (date) => {
    setSelectedDate(date);
  };
  
  const handleNavigate = (newDate) => {
    setCalendarDate(newDate);
  };
  
  // NOWA LOGIKA: Znajdź ostatni szkic lub utwórz nowy
  const handleCreateOrEditTask = () => {
    // Szukamy zadania stworzonego przez obecnego użytkownika, które ma status 'draft'
    const userDraft = calendarTasks.find(task => task.creator_id === currentUser.id && task.status === 'draft');
    
    if (userDraft) {
      // Jeśli szkic istnieje, przejdź do jego edycji
      navigate(`/zadanie/edytuj/${userDraft.id}`);
    } else {
      // Jeśli nie, przejdź do tworzenia nowego zadania
      navigate('/zadanie/nowe');
    }
  };
  
  const tasksForSelectedDay = calendarTasks.filter(task => {
    if (!selectedDate) return false;
    
    // Dla zadań cyklicznych używamy deadline, dla zwykłych publication_date
    const taskDate = task.recurring_task_id && task.deadline 
      ? new Date(task.deadline) 
      : new Date(task.publication_date);
    
    return taskDate.toDateString() === new Date(selectedDate).toDateString();
  });

  return (
    <div>
      <div className="task-header">
        <h2>Panel Zarządzania</h2>
        <button onClick={handleCreateOrEditTask} className="btn btn-primary">
          {/* Zmieniamy tekst przycisku w zależności od kontekstu */}
          {calendarTasks.some(t => t.creator_id === currentUser.id && t.status === 'draft') 
            ? 'Dokończ szkic zadania' 
            : 'Utwórz nowe zadanie'}
        </button>
      </div>
      <nav className="dashboard-nav">
        <button onClick={() => setView('calendar')} className={view === 'calendar' ? 'active' : ''}>Kalendarz Zadań</button>
        <button onClick={() => setView('todayTasks')} className={view === 'todayTasks' ? 'active' : ''}>Zadania na dzisiaj</button>
        <button onClick={() => setView('allTasks')} className={view === 'allTasks' ? 'active' : ''}>Wszystkie Zadania</button>
        <button onClick={() => setView('users')} className={view === 'users' ? 'active' : ''}>Zarządzaj użytkownikami</button>
        <button onClick={() => setView('stats')} className={view === 'stats' ? 'active' : ''}>Statystyki</button>
      </nav>
      
      {view === 'calendar' && <TasksCalendarView onDayClick={handleDayClick} date={calendarDate} onNavigate={handleNavigate} />}
      {view === 'todayTasks' && <TodayTasksView />}
      {view === 'allTasks' && <AllTasksView />}
      {view === 'users' && <UserManagement />}
      {view === 'stats' && <StatisticsPage />}

      <DayTasksPopup 
        date={selectedDate} 
        tasks={tasksForSelectedDay}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}