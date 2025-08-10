import React from 'react';

export default function DayTasksPopup({ date, tasks, onClose }) {
  if (!date) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content card">
        <div className="popup-header">
          <h3>Zadania na dzień: {new Date(date).toLocaleDateString('pl-PL')}</h3>
          <button onClick={onClose} className="popup-close-btn">&times;</button>
        </div>
        <div className="popup-body">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} className="task-summary-item">
                <span className={`importance-dot ${task.importance}`}></span>
                <div className="task-summary-details">
                  <h4>{task.title}</h4>
                  <p>Termin: {new Date(task.deadline).toLocaleString('pl-PL')}</p>
                  <p>Lider: {task.leaderName || 'Brak'}</p>
                  <p>Przypisani: {task.assignedUsers.join(', ')}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Brak zadań na ten dzień.</p>
          )}
        </div>
      </div>
    </div>
  );
}