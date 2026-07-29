import { useEffect, useMemo, useState } from 'react';
import { getUsers } from '../../../composable/PlatformApi';
import './accountsModule.css';

function AccountsModule({ module }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');

    useEffect(() => {
        let active = true;

        const loadUsers = async () => {
            try {
                const response = await getUsers();
                // UsersResponse es un Record<string, Users[]>; aplanamos los valores.
                const list = Object.values(response ?? {}).flat();
                if (active) setUsers(list);
            } catch {
                if (active) setError('No se pudieron cargar los usuarios.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadUsers();
        return () => {
            active = false;
        };
    }, []);

    const filteredUsers = useMemo(() => {
        const name = nameFilter.trim().toLowerCase();
        const email = emailFilter.trim().toLowerCase();

        return users.filter((u) => {
            const fullName = `${u.nombre ?? ''} ${u.apellidoPaterno ?? ''} ${u.apellidoMaterno ?? ''}`
                .toLowerCase();
            const matchesName = !name || fullName.includes(name);
            const matchesEmail = !email || (u.correo ?? '').toLowerCase().includes(email);
            return matchesName && matchesEmail;
        });
    }, [users, nameFilter, emailFilter]);

    return (
        <div className="accounts-module">
            <h2 className="area-module-title">{module?.name ?? 'Configuracion de cuentas'}</h2>

            {/* Filtros de busqueda */}
            <div className="accounts-filters">
                <div className="accounts-filter">
                    <label htmlFor="account-name" className="accounts-filter-label">
                        Buscar por nombre
                    </label>
                    <input
                        id="account-name"
                        type="text"
                        className="accounts-input"
                        placeholder="Nombre o apellidos"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                    />
                </div>
                <div className="accounts-filter">
                    <label htmlFor="account-email" className="accounts-filter-label">
                        Filtrar por correo
                    </label>
                    <input
                        id="account-email"
                        type="text"
                        className="accounts-input"
                        placeholder="correo@ejemplo.com"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Listado de registros */}
            {loading ? (
                <p className="content-placeholder">Cargando usuarios...</p>
            ) : error ? (
                <p className="accounts-error">{error}</p>
            ) : filteredUsers.length === 0 ? (
                <p className="content-placeholder">No se encontraron registros.</p>
            ) : (
                <ul className="accounts-list">
                    {filteredUsers.map((u) => (
                        <li key={u.id} className="accounts-item">
                            <span className="accounts-item-name">
                                {u.nombre} {u.apellidoPaterno} {u.apellidoMaterno}
                            </span>
                            <span className="accounts-item-sub">
                                {u.correo} - {u.usuario}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AccountsModule;
