import React, { useState, useEffect } from 'react';
import { useAppData } from '../AppContext';

export default function TodayTasksView() {
    const { user: currentUser, calendarTasks, fetchCalendarTasks } = useAppData();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ZMIANA: Dodajemy stan do zarządzania modalem (tak jak we "Wszystkich zadaniach")
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTaskContent, setSelectedTaskContent] = useState('');

    const API_BASE_URL = 'https://serwer-for-render.onrender.com';

    // Nowa logika filtrowania zadań na dzisiaj
    useEffect(() => {
        if (!currentUser || !calendarTasks) {
            setTasks([]);
            setIsLoading(false);
            return;
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // Filtrujemy zadania na dzisiaj (tylko aktywne)
            let todayTasks = calendarTasks.filter(task => {
                // Sprawdź czy zadanie jest przypisane do użytkownika
                const isAssigned = task.assignedUsers && task.assignedUsers.includes(currentUser.username);
                
                // Sprawdź czy zadanie nie jest zakończone
                const isActive = task.status === 'w toku' || task.status === 'draft';
                
                // Sprawdź czy zadanie jest na dzisiaj (używamy deadline dla zadań cyklicznych)
                const taskDate = task.recurring_task_id && task.deadline 
                    ? new Date(task.deadline) 
                    : new Date(task.publication_date);
                const isToday = taskDate >= today && taskDate <= todayEnd;
                
                return isAssigned && isActive && isToday;
            });

            // Dla zadań cyklicznych pokazuj tylko pierwsze aktywne z każdej serii
            const recurringGroups = {};
            const filteredTasks = [];

            todayTasks.forEach(task => {
                if (task.recurring_task_id) {
                    // To jest zadanie cykliczne - grupuj według recurring_task_id
                    if (!recurringGroups[task.recurring_task_id]) {
                        recurringGroups[task.recurring_task_id] = task;
                    } else {
                        // Porównaj numery w tytule (#1, #2, itd.) - wybierz z najmniejszym numerem
                        const currentMatch = task.title.match(/#(\d+)$/);
                        const existingMatch = recurringGroups[task.recurring_task_id].title.match(/#(\d+)$/);
                        
                        if (currentMatch && existingMatch) {
                            const currentNum = parseInt(currentMatch[1]);
                            const existingNum = parseInt(existingMatch[1]);
                            
                            if (currentNum < existingNum) {
                                recurringGroups[task.recurring_task_id] = task;
                            }
                        }
                    }
                } else {
                    // To jest zwykłe zadanie - dodaj bezpośrednio
                    filteredTasks.push(task);
                }
            });

            // Dodaj pierwsze zadania z każdej serii cyklicznej
            Object.values(recurringGroups).forEach(task => {
                filteredTasks.push(task);
            });

            setTasks(filteredTasks);
            setError(null);
        } catch (err) {
            setError('Błąd podczas filtrowania zadań');
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, calendarTasks]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Nie udało się zaktualizować statusu.');
            }

            // Dla zadań cyklicznych - po zmianie statusu odświeżamy calendarTasks
            // żeby przeliczyć które zadanie ma się pokazać jako następne
            await fetchCalendarTasks(currentUser.id);

        } catch (err) {
            console.error("Błąd podczas zmiany statusu:", err);
        }
    };

    // ZMIANA: Kopiujemy funkcje do otwierania i zamykania modala
    const openModal = (content) => {
        if (content && content !== '<p></p>') {
            setSelectedTaskContent(content);
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTaskContent('');
    };


    if (isLoading) return <p>Ładowanie zadań...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="all-tasks-container">
            <h2>Aktywne zadania</h2>
            <p>Lista wszystkich zadań przypisanych do Ciebie, które nie zostały jeszcze zakończone.</p>
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Tytuł</th>
                            <th>Termin</th>
                            <th>Ważność</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length > 0 ? tasks.map(task => (
                            // ZMIANA: Cały wiersz jest teraz klikalny
                            <tr 
                                key={task.id} 
                                className={`${task.importance === 'wysoka' || task.importance === 'ważne' ? 'importance-high' : ''} clickable-row`}
                                onClick={() => openModal(task.content_state)}
                            >
                                <td>
                                    {task.recurring_task_id && (
                                        <span style={{ marginRight: '5px', fontSize: '14px' }} title="Zadanie cykliczne">
                                            🔄
                                        </span>
                                    )}
                                    {task.title}
                                </td>
                                <td className={new Date(task.deadline) < new Date() && task.status !== 'zakończone' ? 'overdue-deadline' : ''}>
                                    {task.deadline ? new Date(task.deadline).toLocaleDateString('pl-PL') : 'Brak'}
                                </td>
                                <td>{task.importance}</td>
                                <td>
                                    {/* Zatrzymujemy propagację, aby zmiana statusu nie otwierała modala */}
                                    <select 
                                        value={task.status} 
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()} 
                                        className="filter-select"
                                    >
                                        <option value="w toku">W toku</option>
                                        <option value="zakończone">Zakończone</option>
                                        <option value="draft">Szkic</option>
                                    </select>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4">Brak aktywnych zadań. Dobra robota!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ZMIANA: Renderujemy modal, jeśli isModalOpen jest true */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal}>×</button>
                        <h3>Opis Zadania</h3>
                        <div 
                            className="task-description-content"
                            dangerouslySetInnerHTML={{ __html: selectedTaskContent }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}