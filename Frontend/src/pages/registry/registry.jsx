import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../login/login.css';
import './registry.css';
import { registerUser } from '../../composable/AuthApi.ts';

function Registry() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    sexo: '',
    fechaNacimiento: '',
    usuario: '',
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
    const alfabeticoConEspacios = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    const alfabeticoSinEspacios = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/;
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const formatoContrasena =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,15}$/;

    if (!datos.nombres.trim()) {
      errores.nombres = 'El nombre es obligatorio';
    } else if (datos.nombres.length > 50) {
      errores.nombres = 'El nombre no debe exceder 50 caracteres';
    } else if (!alfabeticoConEspacios.test(datos.nombres)) {
      errores.nombres = 'El nombre solo acepta valores alfabéticos';
    }

    if (!datos.apellidoPaterno.trim()) {
      errores.apellidoPaterno = 'El apellido paterno es obligatorio';
    } else if (datos.apellidoPaterno.length > 25) {
      errores.apellidoPaterno = 'No debe exceder 25 caracteres';
    } else if (!alfabeticoConEspacios.test(datos.apellidoPaterno)) {
      errores.apellidoPaterno = 'Solo acepta valores alfabéticos';
    }

    if (!datos.apellidoMaterno.trim()) {
      errores.apellidoMaterno = 'El apellido materno es obligatorio';
    } else if (datos.apellidoMaterno.length > 25) {
      errores.apellidoMaterno = 'No debe exceder 25 caracteres';
    } else if (!alfabeticoConEspacios.test(datos.apellidoMaterno)) {
      errores.apellidoMaterno = 'Solo acepta valores alfabéticos';
    }

    if (!['M', 'F', 'X'].includes(datos.sexo)) {
      errores.sexo = 'seleccion Invalida';
    }

    if (!datos.fechaNacimiento) {
      errores.fechaNacimiento = 'Selecciona tu fecha de nacimiento';
    }else if (Number.isNaN(new Date(datos.fechaNacimiento).getTime())) {
      errores.fechaNacimiento = 'Fecha inválida';
    }else if (new Date(datos.fechaNacimiento) > new Date()) {
      errores.fechaNacimiento = 'La fecha no puede ser futura';
    }

    if (!datos.usuario.trim()) {
      errores.usuario = 'El usuario es obligatorio';
    } else if (datos.usuario.length > 10) {
      errores.usuario = 'No debe exceder 10 caracteres';
    } else if (!alfabeticoSinEspacios.test(datos.usuario)) {
      errores.usuario = 'Solo acepta valores alfabéticos';
    }

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

  const enviarFormulario = (datos) => {
    const payload = {
      name: datos.nombres,
      lastName: datos.apellidoPaterno,
      lastNameTwo: datos.apellidoMaterno,
      sex: datos.sexo,
      birthDate: datos.fechaNacimiento,
      user: datos.usuario,
      email: datos.correo,
      password: datos.contrasena,
    };
    registerUser(payload);
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
      <div className="login-card registry-card">
        <h1 className="login-title">Hospital Federico Gomez</h1>
        <p className="login-subtitle">Registro de credenciales de acceso.</p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="nombres" className="form-label">Nombre(s)</label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              className="form-input"
              placeholder="Ingresa tu(s) nombre(s)"
              maxLength="50"
              value={formData.nombres}
              onChange={handleChange}
            />
            {errors.nombres && <span className="form-error">{errors.nombres}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="apellidoPaterno" className="form-label">Apellido Paterno</label>
              <input
                id="apellidoPaterno"
                name="apellidoPaterno"
                type="text"
                className="form-input"
                placeholder="Apellido paterno"
                maxLength="25"
                value={formData.apellidoPaterno}
                onChange={handleChange}
              />
              {errors.apellidoPaterno && <span className="form-error">{errors.apellidoPaterno}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apellidoMaterno" className="form-label">Apellido Materno</label>
              <input
                id="apellidoMaterno"
                name="apellidoMaterno"
                type="text"
                className="form-input"
                placeholder="Apellido materno"
                maxLength="25"
                value={formData.apellidoMaterno}
                onChange={handleChange}
              />
              {errors.apellidoMaterno && <span className="form-error">{errors.apellidoMaterno}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sexo" className="form-label">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                className="form-input"
                value={formData.sexo}
                onChange={handleChange}
              >
                <option value="">Selecciona</option>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="X">X</option>
              </select>
              {errors.sexo && <span className="form-error">{errors.sexo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fechaNacimiento" className="form-label">Fecha de Nacimiento</label>
              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                className="form-input"
                max={new Date().toISOString().split('T')[0]}
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
              {errors.fechaNacimiento && <span className="form-error">{errors.fechaNacimiento}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="usuario" className="form-label">Usuario</label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              className="form-input"
              placeholder="Máximo 10 caracteres alfabéticos"
              maxLength="10"
              value={formData.usuario}
              onChange={handleChange}
            />
            {errors.usuario && <span className="form-error">{errors.usuario}</span>}
          </div>

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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contrasena" className="form-label">Contraseña</label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                className="form-input"
                placeholder="Ingresa tu contraseña"
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
                placeholder="Repite tu contraseña"
                value={formData.confirmacion}
                onChange={handleChange}
              />
              {errors.confirmacion && <span className="form-error">{errors.confirmacion}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="login-btn">Registrarse</button>
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

export default Registry;
