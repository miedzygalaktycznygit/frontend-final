import React, { useState } from 'react';
import { useAppData } from '../AppContext';

export default function UserManagement() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('pracownik');
    const [subRole, setSubRole] = useState('laserownia');
    const { users, deleteUser, addUser, user: loggedInUser } = useAppData();

    const handleSubmit = (e) => {
        e.preventDefault();
        const newUser = { id: Date.now(), username, password, role };
        if (role === 'pracownik') newUser.subRole = subRole;
        addUser(newUser);
        setUsername(''); 
        setPassword(''); 
        setRole('pracownik'); 
        setSubRole('laserownia');
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
                        (loggedInUser.id !== u.id && (
                            <li key={u.id} className="user-list-item">
                                <span>{u.username}</span><span className="role">{u.role} {u.subRole && `(${u.subRole})`}</span>
                                <button onClick={() => deleteUser(u.id)} className='btn btn-danger'>Usuń</button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}