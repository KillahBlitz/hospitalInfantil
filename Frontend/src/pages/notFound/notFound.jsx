import { Link } from 'react-router-dom';
import '../login/login.css';
import './notFound.css';

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <span className="notfound-code" aria-hidden="true">404</span>
        <h1 className="notfound-title">Página no encontrada</h1>
        <p className="notfound-subtitle">
          La dirección que buscas no está disponible o fue movida. Verifica el enlace e inténtalo de nuevo.
        </p>

        <Link to="/" className="notfound-btn">Volver al Inicio de Sesion</Link>

        <div className="color-bar">
          <span className="bar bar-red"></span>
          <span className="bar bar-teal"></span>
          <span className="bar bar-gold-light"></span>
          <span className="bar bar-gold-dark"></span>
          <span className="bar bar-gray"></span>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
