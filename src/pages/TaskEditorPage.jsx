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
    const { name, value } = e.target;
    setTask(currentTask => ({ ...currentTask, [name]: value }));
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
    if (!task.title || task.assignedUserIds.length === 0 || !task.deadline) {
      alert("Tytuł, termin oraz przynajmniej jeden przypisany użytkownik są wymagani do publikacji!");
      return;
    }

    // Przygotowujemy dane do wysłania
    const taskData = {
        ...task,
        creator_id: currentUser.id,
        assignedUserIds: task.assignedUserIds.map(id => parseInt(id, 10)),
    };
    
    // Niezależnie czy to nowy task czy stary, wywołujemy tę samą funkcję
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