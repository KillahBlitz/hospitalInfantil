import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../login/login.css';
import '../registry/registry.css';
import './passwordRecouperation.css';

function PasswordRecouperation() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    confirmacion: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = (datos) => {
    const errores = {};
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const formatoContrasena =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,15}$/;

    if (!formatoCorreo.test(datos.correo)) {
      errores.correo = 'Formato de correo inválido';
    }

    if (!formatoContrasena.test(datos.contrasena)) {
      errores.contrasena =
        'La contraseña debe tener entre 9 y 15 caracteres, con mayúscula, minúscula, dígito y carácter especial';
    }

    if (!datos.confirmacion) {
      errores.confirmacion = 'Confirma tu contraseña';
    } else if (datos.confirmacion !== datos.contrasena) {
      errores.confirmacion = 'Las contraseñas no coinciden';
    }

    return errores;
  };

  const enviarFormulario = async () => {
    setLoading(true);
    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_BASE_URL}/Auth/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.correo,
          password: formData.contrasena,
        }),
      });

      const resultado = await respuesta.json();

      if (resultado === true) {
        setModal({
          type: 'success',
          message: 'contraseña actualizada',
          onAccept: () => navigate('/'),
        });
      } else {
        setModal({
          type: 'error',
          message: 'El correo no está registrado, por favor contacta al soporte de la plataforma.',
          onAccept: () => setModal(null),
        });
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      setModal({
        type: 'error',
        message: 'No se pudo conectar con el servidor. Por favor, intenta nuevamente más tarde.',
        onAccept: () => setModal(null),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const resultado = validarFormulario(formData);
    setErrors(resultado);
    if (Object.keys(resultado).length === 0) {
      enviarFormulario();
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Hospital Federico Gomez</h1>
        <p className="login-subtitle">Recuperación de contraseña.</p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="correo" className="form-label">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              className="form-input"
              placeholder="usuario@dominio.com"
              value={formData.correo}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.correo && <span className="form-error">{errors.correo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contrasena" className="form-label">Nueva Contraseña</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              className="form-input"
              placeholder="Ingresa tu nueva contraseña"
              value={formData.contrasena}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.contrasena && <span className="form-error">{errors.contrasena}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmacion" className="form-label">Confirmar Contraseña</label>
            <input
              id="confirmacion"
              name="confirmacion"
              type="password"
              className="form-input"
              placeholder="Repite tu nueva contraseña"
              value={formData.confirmacion}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.confirmacion && <span className="form-error">{errors.confirmacion}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  Actualizando...
                </>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>
        </form>

        <div className="color-bar">
          <span className="bar bar-red"></span>
          <span className="bar bar-teal"></span>
          <span className="bar bar-gold-light"></span>
          <span className="bar bar-gold-dark"></span>
          <span className="bar bar-gray"></span>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="modal-title">Hospital Federico Gomez</h2>
            <div className="modal-icon-wrapper">
              {modal.type === 'success' ? (
                <svg className="modal-svg-icon modal-svg-success" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="42" stroke="var(--color-secondary)" strokeWidth="6" />
                  <path d="M30 52 L43 65 L70 36" stroke="var(--color-secondary)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="modal-svg-icon modal-svg-error" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="42" stroke="var(--color-primary)" strokeWidth="6" />
                  <path d="M34 34 L66 66 M66 34 L34 66" stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p className="modal-message">{modal.message}</p>
            <button
              type="button"
              className="login-btn"
              onClick={() => {
                if (modal.onAccept) {
                  modal.onAccept();
                } else {
                  setModal(null);
                }
              }}
            >
              Aceptar
            </button>
            <div className="color-bar">
              <span className="bar bar-red"></span>
              <span className="bar bar-teal"></span>
              <span className="bar bar-gold-light"></span>
              <span className="bar bar-gold-dark"></span>
              <span className="bar bar-gray"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordRecouperation;
