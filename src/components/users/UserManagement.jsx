import React, { useState } from 'react';
import { useAppData } from '../AppContext';

export default function UserManagement() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // Nowy stan do przechowywania użytkownika, który jest edytowany
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('pracownik');
    const [subRole, setSubRole] = useState('laserownia');
    const { users, deleteUser, addUser, updateUser, user: loggedInUser } = useAppData(); // Dodanie updateUser z kontekstu

    // Obsługa przesyłania formularza
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            // Logika aktualizacji użytkownika
            const updatedUser = { ...editingUser, username, role };
            if (role === 'pracownik') {
                updatedUser.subRole = subRole;
            } else {
                delete updatedUser.subRole; // Usunięcie subRole, jeśli rola nie jest pracownikiem
            }
            if (password) {
                updatedUser.password = password; // Aktualizacja hasła tylko, jeśli zostało podane
            }
            updateUser(updatedUser);
            setEditingUser(null);
        } else {
            // Logika dodawania nowego użytkownika
            const newUser = { id: Date.now(), username, password, role };
            if (role === 'pracownik') newUser.subRole = subRole;
            addUser(newUser);
        }
        // Resetowanie stanów
        setUsername(''); 
        setPassword(''); 
        setRole('pracownik'); 
        setSubRole('laserownia');
        setShowCreateForm(false);
    };

    // Funkcja do rozpoczęcia edycji
    const handleEditClick = (user) => {
        setEditingUser(user);
        setUsername(user.username);
        setRole(user.role);
        setSubRole(user.subRole || 'laserownia');
        setShowCreateForm(true);
    };

    // Funkcja do usuwania użytkownika z potwierdzeniem
    const handleDeleteUser = (user) => {
        const isConfirmed = window.confirm(
            `Czy na pewno chcesz usunąć użytkownika "${user.username}"?\n\nTa operacja jest nieodwracalna i usunie wszystkie dane związane z tym użytkownikiem.`
        );
        
        if (isConfirmed) {
            deleteUser(user.id);
        }
    };

    return (
        <div>
            <div className="task-header">
                <h2>Użytkownicy</h2>
                <button onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    setEditingUser(null); // Resetowanie edytowanego użytkownika przy przełączaniu formularza
                }} className="btn btn-primary">{showCreateForm ? 'Anuluj' : 'Dodaj użytkownika'}</button>
            </div>
            {showCreateForm && (
                <div className="card">
                    <h3>{editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</h3>
                    <form onSubmit={handleSubmit}>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nazwa użytkownika" className="input-field" required />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Hasło (pozostaw puste, aby nie zmieniać)" className="input-field" />
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
                        <button type="submit" className="btn btn-primary">{editingUser ? 'Zapisz zmiany' : 'Utwórz użytkownika'}</button>
                    </form>
                </div>
            )}
            <div className="card">
                <ul className="user-list">
                    {users.map(u => 
                        (loggedInUser.id !== u.id && (
                            <li key={u.id} className="user-list-item">
                                <span>{u.username}</span><span className="role">{u.role} {u.subRole && `(${u.subRole})`}</span>
                                <div>
                                    <button onClick={() => handleEditClick(u)} className='btn btn-secondary'>Edytuj</button>
                                    <button onClick={() => handleDeleteUser(u)} className='btn btn-danger'>Usuń</button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}