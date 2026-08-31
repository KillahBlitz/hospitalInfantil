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

  const enviarFormulario = async (datos) => {
    try {
      const respuesta= await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/changePassword`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: formData.correo,
          nuevaContrasena: formData.contrasena
        }),
      });
      //El servidor devueleve un booleano (tru o false)
      const resultado = await respuesta.json();
      //Si devuelve true:Muestra pantalla de éxito con botón para volver al incio de de sesión
      if(resultado === true){
        alert('Contraseña actualizada con éxito. Por favor, inicia sesión con tu nueva contraseña.');
        navigate('/');
      }
      //Si devuelve false:Muestra que el correo no está registrado
      else{
        alert('El correo ingresado no está registrado. Por favor, verifica tu correo o regístrate.');
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      alert('No se pudo conectar con el servidor. Por favor, intenta nuevamente más tarde.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const resultado = validarFormulario(formData);
    setErrors(resultado);
    if (Object.keys(resultado).length === 0) {
      enviarFormulario(formData);
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
            />
            {errors.confirmacion && <span className="form-error">{errors.confirmacion}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="login-btn">Actualizar</button>
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
    </div>
  );
}

export default PasswordRecouperation;

