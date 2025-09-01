import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TasksCalendarView from '../tasks/TasksCalendarView';
import DayTasksPopup from '../tasks/DayTasksPopup';
import { useAppData } from '../AppContext';
import TodayTasksView from '../tasks/TodayTasksView'; // ZMIANA: Importujemy nowy widok

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { calendarTasks, user: currentUser } = useAppData();
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // ZMIANA: Dodajemy stan do zarządzania widokiem (tak jak w BossDashboard)
  const [view, setView] = useState('calendar'); 

  const handleDayClick = (date) => {
    setSelectedDate(date);
  };

  const handleNavigate = (newDate) => {
    setCalendarDate(newDate);
  };
  
  const handleCreateOrEditTask = () => {
    const userDraft = calendarTasks.find(task => task.creator_id === currentUser.id && task.status === 'draft');
    
    if (userDraft) {
      navigate(`/zadanie/edytuj/${userDraft.id}`);
    } else {
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
        {/* ZMIANA: Nagłówek jest teraz dynamiczny w zależności od widoku */}
        <h2>{view === 'calendar' ? 'Kalendarz Zadań' : 'Aktywne Zadania'}</h2>
        <button onClick={handleCreateOrEditTask} className="btn btn-primary">
          {calendarTasks.some(t => t.creator_id === currentUser.id && t.status === 'draft') 
            ? 'Dokończ szkic zadania' 
            : 'Utwórz nowe zadanie'}
        </button>
      </div>
      
      {/* ZMIANA: Dodajemy nawigację do przełączania widoków */}
      <nav className="dashboard-nav">
        <button onClick={() => setView('calendar')} className={view === 'calendar' ? 'active' : ''}>Kalendarz Zadań</button>
        <button onClick={() => setView('todayTasks')} className={view === 'todayTasks' ? 'active' : ''}>Zadania na dzisiaj</button>
      </nav>
      
      {/* ZMIANA: Renderujemy komponenty warunkowo na podstawie stanu 'view' */}
      {view === 'calendar' && (
        <>
          <TasksCalendarView onDayClick={handleDayClick} date={calendarDate} onNavigate={handleNavigate} />
          <DayTasksPopup 
            date={selectedDate} 
            tasks={tasksForSelectedDay}
            onClose={() => setSelectedDate(null)}
          />
        </>
      )}

      {view === 'todayTasks' && <TodayTasksView />}
    </div>
  );
}