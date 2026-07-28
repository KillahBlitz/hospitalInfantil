import { Navigate } from 'react-router-dom';

function isAuthenticated() {
  const user = localStorage.getItem('user');
  return user !== null && user !== 'undefined' && user !== '';
}

// Solo para usuarios sin sesion. Si ya existe user en localStorage,
// redirige a /menu (login, registrar, recuperar quedan bloqueados).
export function PublicRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/menu" replace /> : children;
}

// Solo para usuarios con sesion. Si no existe user en localStorage,
// redirige a la pantalla de login.
export function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
}
