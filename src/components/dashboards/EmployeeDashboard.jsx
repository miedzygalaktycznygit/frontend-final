import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TasksCalendarView from '../tasks/TasksCalendarView';
import DayTasksPopup from '../tasks/DayTasksPopup';
import { useAppData } from '../AppContext';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { calendarTasks, user: currentUser } = useAppData();
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
    const userDraft = calendarTasks.find(task => task.creator_id === currentUser.id && task.status === 'draft');
    
    if (userDraft) {
      navigate(`/zadanie/edytuj/${userDraft.id}`);
    } else {
      navigate('/zadanie/nowe');
    }
  };
  
  const tasksForSelectedDay = calendarTasks.filter(task => 
    new Date(task.publication_date).toDateString() === new Date(selectedDate).toDateString()
  );

  return (
    <div>
      <div className="task-header">
        <h2>Kalendarz Zadań</h2>
        <button onClick={handleCreateOrEditTask} className="btn btn-primary">
          {calendarTasks.some(t => t.creator_id === currentUser.id && t.status === 'draft') 
            ? 'Dokończ szkic zadania' 
            : 'Utwórz nowe zadanie'}
        </button>
      </div>
      
      <TasksCalendarView onDayClick={handleDayClick} date={calendarDate} onNavigate={handleNavigate} />

      <DayTasksPopup 
        date={selectedDate} 
        tasks={tasksForSelectedDay}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}