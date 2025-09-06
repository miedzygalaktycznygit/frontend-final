import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useAppData } from '../components/AppContext';

// Komponent paska narzędzi (bez zmian)
const MenuBar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="tiptap-menu">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>Lista</button>
    </div>
  );
};

export default function TaskEditorPage() {
  const { users, saveOrUpdateTask, publishTask, deleteTask, user: currentUser, calendarTasks } = useAppData();
  const navigate = useNavigate();
  const { taskId } = useParams();

  const [task, setTask] = useState({
    title: '',
    content_state: '',
    assignedUserIds: [],
    leader_id: '',
    deadline: '',
    importance: 'normalna',
    notify_on_completion: true, // NOWE POLE: domyślnie włączone powiadomienia
  });

  // Oddzielny stan dla pól cykliczności (nie zapisywane z zadaniem)
  const [recurringData, setRecurringData] = useState({
    isRecurring: false,
    recurrence_type: 'weekly',
    start_date: '',
    end_date: ''
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: task.content_state,
    onUpdate: ({ editor }) => {
      setTask(currentTask => ({ ...currentTask, content_state: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (taskId && calendarTasks.length > 0 && users.length > 0) {
      const existingTask = calendarTasks.find(t => String(t.id) === taskId);
      if (existingTask) {
        setTask({
          title: existingTask.title,
          content_state: existingTask.content_state || '',
          assignedUserIds: existingTask.assignedUsers ? existingTask.assignedUsers.map(name => {
              const userObj = users.find(u => u.username === name);
              return userObj ? String(userObj.id) : null;
          }).filter(id => id !== null) : [],
          leader_id: String(existingTask.leader_id || ''),
          deadline: existingTask.deadline ? new Date(existingTask.deadline).toISOString().slice(0, 16) : '',
          importance: existingTask.importance || 'normalna',
          notify_on_completion: existingTask.notify_on_completion !== undefined ? existingTask.notify_on_completion : true, // NOWE POLE
        });
      }
    }
  }, [taskId, calendarTasks, users]);
  
  useEffect(() => {
    if (editor && editor.getHTML() !== task.content_state) {
      editor.commands.setContent(task.content_state);
    }
  }, [task.content_state, editor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setTask(currentTask => ({ ...currentTask, [name]: fieldValue }));
  };

  const handleRecurringChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setRecurringData(current => ({ ...current, [name]: fieldValue }));
  };

  const handleMultiSelectChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    setTask(currentTask => ({ ...currentTask, assignedUserIds: selectedIds }));
  }

  const handleSave = async () => {
    const taskData = {
      ...task,
      creator_id: currentUser.id,
      assignedUserIds: task.assignedUserIds.map(id => parseInt(id, 10)),
    };
    const savedTask = await saveOrUpdateTask(taskData, taskId);
    if (savedTask) {
      alert("Postęp zapisany!");
      navigate('/');
    } else {
      alert("Błąd podczas zapisu postępu.");
    }
  };

  // ZMODYFIKOWANA LOGIKA PUBLIKACJI
  const handlePublish = async () => {
    // Walidacja podstawowa
    if (!task.title || task.assignedUserIds.length === 0) {
      alert("Tytuł oraz przynajmniej jeden przypisany użytkownik są wymagani do publikacji!");
      return;
    }

    // Walidacja dla zadań cyklicznych
    if (recurringData.isRecurring) {
      if (!recurringData.start_date || !recurringData.end_date) {
        alert("Dla zadań cyklicznych wymagana jest data rozpoczęcia i zakończenia cyklu!");
        return;
      }
      
      if (new Date(recurringData.start_date) >= new Date(recurringData.end_date)) {
        alert("Data rozpoczęcia musi być wcześniejsza niż data zakończenia!");
        return;
      }
    } else {
      // Dla zwykłych zadań wymagamy deadline
      if (!task.deadline) {
        alert("Termin wykonania jest wymagany dla zwykłych zadań!");
        return;
      }
    }

    // Przygotowujemy dane do wysłania
    const taskData = {
        ...task,
        creator_id: currentUser.id,
        assignedUserIds: task.assignedUserIds.map(id => parseInt(id, 10)),
        // Dodajemy dane cykliczności jeśli potrzebne
        ...(recurringData.isRecurring && recurringData)
    };
    
    const success = await publishTask(taskData, taskId);
    
    if (success) {
      alert("Zadanie zostało pomyślnie opublikowane!");
      navigate('/');
    } else {
      alert("Wystąpił błąd podczas publikacji zadania.");
    }
  };

  const handleDelete = async () => {
    if (!taskId) {
        alert("Nie można usunąć niezapisanego szkicu.");
        return;
    }
    if (window.confirm("Czy na pewno chcesz trwale usunąć ten szkic zadania?")) {
        const success = await deleteTask(parseInt(taskId, 10));
        if (success) {
            alert("Szkic został usunięty.");
            navigate('/');
        } else {
            alert("Wystąpił błąd podczas usuwania szkicu.");
        }
    }
  };
  
  return (
    <div className="main-content">
      <div className="card">
        <div className="popup-header">
          <h2>{taskId ? 'Edycja zadania' : 'Tworzenie nowego zadania'}</h2>
          <button onClick={() => navigate('/')} className="popup-close-btn">&times;</button>
        </div>
        
          {/* ... reszta formularza pozostaje bez zmian ... */}
          <div className="form-group">
            <label>Tytuł zadania</label>
            <input type="text" name="title" className="input-field" value={task.title} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label>Treść / Opis zadania</label>
            <div className="tiptap-container"><MenuBar editor={editor} /><EditorContent editor={editor} /></div>
          </div>
          <div className="form-group">
            <label>Przypisz do użytkowników (przytrzymaj Ctrl, aby zaznaczyć wielu)</label>
            <select multiple name="assignedUserIds" className="input-field" style={{ height: '150px' }} value={task.assignedUserIds} onChange={handleMultiSelectChange}>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Wybierz lidera zadania (opcjonalne)</label>
            <select name="leader_id" className="input-field" value={task.leader_id} onChange={handleChange}>
              <option value="">Brak lidera</option>
              {users.filter(u => task.assignedUserIds.includes(String(u.id))).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Termin wykonania</label>
            <input type="datetime-local" name="deadline" className="input-field" value={task.deadline} onChange={handleChange}/>
          </div>
          <div className="form-group">
            <label>Ważność zadania (kolor w kalendarzu)</label>
            <select name="importance" className="input-field" value={task.importance} onChange={handleChange}>
              <option value="niska">Niska</option>
              <option value="normalna">Normalna</option>
              <option value="wysoka">Wysoka</option>
            </select>
          </div>

          {/* NOWA SEKCJA: Kontrola powiadomień */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="notify_on_completion" 
                checked={task.notify_on_completion} 
                onChange={handleChange}
                style={{ marginRight: '10px', transform: 'scale(1.2)' }}
              />
              <span>
                🔔 Powiadom mnie o zakończeniu tego zadania
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', fontWeight: 'normal' }}>
                  Otrzymasz powiadomienie gdy ktoś oznaczy to zadanie jako zakończone
                </div>
              </span>
            </label>
          </div>

          {/* Sekcja zadań cyklicznych - oddzielne pola */}
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                name="isRecurring" 
                checked={recurringData.isRecurring} 
                onChange={handleRecurringChange}
                style={{ marginRight: '8px' }}
              />
              Zadanie cykliczne
            </label>
          </div>

          {recurringData.isRecurring && (
            <div className="recurring-section" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              <h4>Parametry cykliczności</h4>
              
              <div className="form-group">
                <label>Typ cyklu</label>
                <select name="recurrence_type" className="input-field" value={recurringData.recurrence_type} onChange={handleRecurringChange}>
                  <option value="daily">Codziennie</option>
                  <option value="weekly">Co tydzień</option>
                  <option value="monthly">Co miesiąc</option>
                </select>
              </div>

              <div className="form-group">
                <label>Data rozpoczęcia cyklu</label>
                <input 
                  type="date" 
                  name="start_date" 
                  className="input-field" 
                  value={recurringData.start_date} 
                  onChange={handleRecurringChange}
                />
              </div>

              <div className="form-group">
                <label>Data zakończenia cyklu</label>
                <input 
                  type="date" 
                  name="end_date" 
                  className="input-field" 
                  value={recurringData.end_date} 
                  onChange={handleRecurringChange}
                />
              </div>

              <p style={{ fontSize: '0.9em', color: '#666', fontStyle: 'italic' }}>
                💡 Zadania będą generowane automatycznie od daty rozpoczęcia do daty zakończenia.
                Termin wykonania zostanie zastąpiony datami z cyklu.
              </p>
            </div>
          )}

          <div className="form-actions">
            {taskId && ( <button type="button" onClick={handleDelete} className="btn btn-danger" style={{ marginRight: 'auto' }}>Usuń szkic</button> )}
            <button type="button" onClick={handleSave} className="btn btn-secondary">Zapisz i zamknij</button>
            {/* Przycisk publikacji nie jest już wyłączony */}
            <button type="button" onClick={handlePublish} className="btn btn-primary">Opublikuj zadanie</button>
          </div>
        
      </div>
    </div>
  );
}