import React, { useState, useEffect } from 'react';
import { useAppData } from '../AppContext';

export default function TodayTasksView() {
    const { user: currentUser } = useAppData();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ZMIANA: Dodajemy stan do zarządzania modalem (tak jak we "Wszystkich zadaniach")
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTaskContent, setSelectedTaskContent] = useState('');

    const API_BASE_URL = 'https://serwer-for-render.onrender.com';

    const fetchActiveTasks = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/active?userId=${currentUser.id}`);
            if (!response.ok) {
                throw new Error('Błąd sieci podczas pobierania aktywnych zadań.');
            }
            const data = await response.json();
            setTasks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveTasks();
    }, [currentUser]);

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

            if (newStatus === 'zakończone') {
                setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
            } else {
                setTasks(currentTasks => currentTasks.map(task => 
                    task.id === taskId ? { ...task, status: newStatus } : task
                ));
            }

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
                                <td>{task.title}</td>
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