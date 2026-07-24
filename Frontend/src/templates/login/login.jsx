import { useState } from 'react';
import './login.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [recordar, setRecordar] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ usuario, contrasena, recordar });
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
            <label htmlFor="contrasena" className="form-label">Contrasena</label>
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
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span>Recordar acceso</span>
            </label>
            <a href="#" className="recuperar-link">Recuperar Contraseña</a>
          </div>

          <button type="submit" className="login-btn">Acceder</button>
        </form>

        <div className="color-bar">
          <span className="bar bar-red"></span>
          <span className="bar bar-teal"></span>
          <span className="bar bar-gold-light"></span>
          <span className="bar bar-gold-dark"></span>
          <span className="bar bar-gray"></span>
        </div>

        <p className="login-footer">
          Solicitar <strong>Credenciales de Acceso</strong>.
        </p>
      </div>
    </div>
  );
}

export default Login;
