import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginUser } from '../../composable/AuthApi.ts';
import './login.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage('');
      const request = {
        user: usuario,
        password: contrasena
      }
      setLoading(true);
      try {
        const UserAccess = await loginUser(request);
        if (UserAccess?.message) {
          setMessage(UserAccess.message);
        }
      } catch {
        setMessage('No se pudo conectar con el servidor. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Hospital Federico Gomez</h1>
        <p className="login-subtitle">Iniciar Sesion.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario" className="form-label">Usuario</label>
            <input
              id="usuario"
              type="text"
              className="form-input"
              placeholder="Ingresa tu Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="contrasena" className="form-label">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              className="form-input"
              placeholder="Ingresa tu contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          <div className="form-options">
            <Link to="/recuperar" className="recuperar-link">Recuperar Contraseña</Link>
          </div>

          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Accediendo...
              </>
            ) : (
              'Acceder'
            )}
          </button>
        </form>

        <div className="color-bar">
          <span className="bar bar-red"></span>
          <span className="bar bar-teal"></span>
          <span className="bar bar-gold-light"></span>
          <span className="bar bar-gold-dark"></span>
          <span className="bar bar-gray"></span>
        </div>

        <p className="login-footer">
          <Link to="/registrar" className="recuperar-link"> Registrar <strong>Acceso</strong></Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
