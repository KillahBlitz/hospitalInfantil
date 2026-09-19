USE [hospital_infantil];
GO

-- ========================================================
-- Crear schemas del sistema
-- ========================================================

CREATE SCHEMA [core];
GO

CREATE SCHEMA [recursos_humanos];
GO

CREATE SCHEMA [contabilidad];
GO

CREATE SCHEMA [acceso_usuario];
GO

-- ========================================================
-- Verificación rápida
-- ========================================================

SELECT name AS SchemaName
FROM sys.schemas
WHERE name IN (
    'core',
    'recursos_humanos',
    'contabilidad',
    'acceso_usuario'
);
GO



USE [hospital_infantil];
GO


-- ========================================================
-- 3. Tabla: TipoUsuario
-- ========================================================

CREATE TABLE acceso_usuario.TipoUsuario (
    Id smallint IDENTITY(1,1) NOT NULL,
    NivelUsuario SMALLINT NOT NULL,
    Descripcion VARCHAR(20) NULL,

    CONSTRAINT PK_TipoUsuario PRIMARY KEY (Id)
);
GO

-- ========================================================
-- 4. Tabla: Usuarios
-- ========================================================

CREATE TABLE acceso_usuario.Usuarios (
    Id INT IDENTITY(1,1) NOT NULL,
    TipoId SMALLINT NOT NULL,
    Nombre VARCHAR(30) NOT NULL,
    ApellidoPaterno VARCHAR(20) NOT NULL,
    ApellidoMaterno VARCHAR(20) NOT NULL,
    FechaNacimiento DATE NOT NULL,
    Sexo VARCHAR(1) NOT NULL,
    FechaIngreso DATE NOT NULL DEFAULT GETDATE(),
    Alias VARCHAR(10) NOT NULL,
    Correo NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Usuarios PRIMARY KEY (Id),

    CONSTRAINT FK_Usuarios_TipoUsuario
        FOREIGN KEY (TipoId)
        REFERENCES acceso_usuario.TipoUsuario(Id),

    CONSTRAINT UQ_Usuarios_Alias UNIQUE (Alias),
    CONSTRAINT UQ_Usuarios_Correo UNIQUE (Correo)
);
GO

-- ========================================================
-- 5. Tabla: Areas
-- ========================================================

CREATE TABLE acceso_usuario.Areas (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(30) NOT NULL,
    Descripcion NVARCHAR(250) NULL,
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Areas PRIMARY KEY (Id),
    CONSTRAINT UQ_Areas_Nombre UNIQUE (Nombre)
);
GO

-- ========================================================
-- 6. Tabla: Modulos
-- ========================================================

CREATE TABLE acceso_usuario.Modulos (
    Id INT IDENTITY(1,1) NOT NULL,
    AreaId INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(250) NULL,
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Modulos PRIMARY KEY (Id),

    CONSTRAINT FK_Modulos_Areas
        FOREIGN KEY (AreaId)
        REFERENCES acceso_usuario.Areas(Id),

    CONSTRAINT UQ_Modulos_Area_Nombre UNIQUE (AreaId, Nombre)
);
GO

-- ========================================================
-- 7. Tabla: Permisos
-- ========================================================

CREATE TABLE acceso_usuario.Permisos (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(15) NOT NULL,
    Descripcion NVARCHAR(50) NULL,

    CONSTRAINT PK_Permisos PRIMARY KEY (Id),
    CONSTRAINT UQ_Permisos_Nombre UNIQUE (Nombre)
);
GO

-- ========================================================
-- 8. Tabla: UsuarioModuloPermisos
-- Antes era UsuarioAreasPermisos, pero ahora el permiso aplica sobre módulos
-- ========================================================

CREATE TABLE acceso_usuario.UsuarioModuloPermisos (
    UsuarioId INT NOT NULL,
    ModuloId INT NOT NULL,
    PermisoId INT NOT NULL,

    CONSTRAINT PK_UsuarioModuloPermisos
        PRIMARY KEY (UsuarioId, ModuloId, PermisoId),

    CONSTRAINT FK_UsuarioModuloPermisos_Usuarios
        FOREIGN KEY (UsuarioId)
        REFERENCES acceso_usuario.Usuarios(Id),

    CONSTRAINT FK_UsuarioModuloPermisos_Modulos
        FOREIGN KEY (ModuloId)
        REFERENCES acceso_usuario.Modulos(Id),

    CONSTRAINT FK_UsuarioModuloPermisos_Permisos
        FOREIGN KEY (PermisoId)
        REFERENCES acceso_usuario.Permisos(Id)
);
GO

ALTER TABLE acceso_usuario.TipoUsuario
ALTER COLUMN NivelUsuario VARCHAR(15) NOT NULL;
GO

ALTER TABLE acceso_usuario.TipoUsuario
ALTER COLUMN Descripcion NVARCHAR(150) NOT NULL;
GO

ALTER TABLE acceso_usuario.Permisos
ALTER COLUMN Descripcion NVARCHAR(150) NOT NULL;
GO

USE [hospital_infantil];
GO


-- ========================================================
-- 1. Insertar tipos de usuario
-- ========================================================

INSERT INTO acceso_usuario.TipoUsuario (NivelUsuario, Descripcion)
VALUES
(
    'super_admin',
    'Usuario con acceso total a la plataforma, configuración general, usuarios, áreas, módulos y permisos.'
),
(
    'admin',
    'Usuario con permisos administrativos sobre la plataforma y configuración operativa del sistema.'
),
(
    'general',
    'Usuario con permisos completos dentro de su área asignada o en varias áreas autorizadas.'
),
(
    'supervisor',
    'Usuario con permisos limitados dentro de su área, normalmente enfocado en revisión, seguimiento y operación parcial.'
),
(
    'inicial',
    'Usuario con permisos básicos de visualización dentro de su área asignada.'
);
GO

-- ========================================================
-- 2. Insertar permisos base
-- ========================================================

INSERT INTO acceso_usuario.Permisos (Nombre, Descripcion)
VALUES
(
    'ver',
    'Permite consultar y visualizar información dentro del módulo asignado.'
),
(
    'editar',
    'Permite modificar información existente dentro del módulo asignado.'
),
(
    'crear',
    'Permite registrar nueva información dentro del módulo asignado.'
),
(
    'eliminar',
    'Permite eliminar o desactivar información dentro del módulo asignado.'
);
GO

-- ========================================================
-- 3. Insertar áreas
-- ========================================================

INSERT INTO acceso_usuario.Areas (Nombre, Descripcion, Activo)
VALUES
(
    'plataforma',
    'Área encargada de dar de alta usuarios y realizar modificaciones en la plataforma.',
    1
),
(
    'recursos humanos',
    'Área encargada de contrataciones y gestión de recursos humanos.',
    1
),
(
    'contabilidad',
    'Área encargada de contabilización y administración monetaria.',
    1
),
(
    'almacen',
    'Área donde se guardan productos y herramientas.',
    0
);
GO

-- ========================================================
-- 4. Insertar módulos
-- ========================================================

INSERT INTO acceso_usuario.Modulos (AreaId, Nombre, Descripcion, Activo)
VALUES
(
    (
        SELECT Id
        FROM acceso_usuario.Areas
        WHERE Nombre = 'plataforma'
    ),
    'configuracion de cuentas',
    'Módulo donde se aceptan peticiones de nuevos usuarios y se configuran los permisos que necesita cada usuario.',
    1
);
GO

INSERT INTO acceso_usuario.Modulos (AreaId, Nombre, Descripcion, Activo)
VALUES
(
    (
        SELECT Id
        FROM acceso_usuario.Areas
        WHERE Nombre = 'plataforma'
    ),
    'Administrar Permisos',
    'Módulo donde se mueven los permisos que tienen los usuarios registrados en la plataforma',
    1
);
GO

INSERT INTO acceso_usuario.Modulos (AreaId, Nombre, Descripcion, Activo)
VALUES
(
    (
        SELECT Id
        FROM acceso_usuario.Areas
        WHERE Nombre = 'contabilidad'
    ),
    'Complemento de Pago',
    'IDENTIFICACION DEL COMPROBANTE DE PAGO, CON SU FOLIO FICAL Y LA FECHA DE EMICION',
    1
);
GO

select * from acceso_usuario.Areas

INSERT INTO acceso_usuario.Modulos (AreaId, Nombre, Descripcion, Activo)
VALUES
(
    (
        SELECT Id
        FROM acceso_usuario.Areas
        WHERE Nombre = 'recursos humanos'
    ),
    'Administrar Plazas',
    'Módulo donde se administran las plazas disponibles y darlas de baja',
    1
);
GO


USE [hospital_infantil];
GO

DECLARE @UsuarioId INT;
DECLARE @PasswordHash NVARCHAR(500) = '$2a$11$93Od4n86eri7QP.p0Hfki.bJyPwoOKcRn/6yZO7xtMGuk5fFmD4Si';

-- ========================================================
-- 1. Insertar usuario superAdmin
-- ========================================================

INSERT INTO acceso_usuario.Usuarios (
    TipoId,
    Nombre,
    ApellidoPaterno,
    ApellidoMaterno,
    FechaNacimiento,
    Sexo,
    FechaIngreso,
    Alias,
    Correo,
    PasswordHash,
    Activo
)
VALUES (
    (
        SELECT Id
        FROM acceso_usuario.TipoUsuario
        WHERE NivelUsuario = 'super_admin'
    ),
    'Jacobo Emiliano',
    'Monroy',
    'Cortines',
    '2003-01-08',
    'M',
    CAST(GETDATE() AS DATE),
    'superAdmin',
    'fach510@gmail.com',
    @PasswordHash,
    1
);

SET @UsuarioId = SCOPE_IDENTITY();

-- ========================================================
-- 2. Asignar los 4 permisos al ModuloId 1
-- ========================================================

INSERT INTO acceso_usuario.UsuarioModuloPermisos (
    UsuarioId,
    ModuloId,
    PermisoId
)
SELECT
    1,
    4,
    Id
FROM acceso_usuario.Permisos
WHERE Nombre IN ('ver', 'crear', 'editar', 'eliminar');
GO

INSERT INTO acceso_usuario.UsuarioModuloPermisos (
    UsuarioId,
    ModuloId,
    PermisoId
)
SELECT
    1,
    2,
    Id
FROM acceso_usuario.Permisos
WHERE Nombre IN ('ver', 'crear', 'editar', 'eliminar');
GO

INSERT INTO acceso_usuario.UsuarioModuloPermisos (
    UsuarioId,
    ModuloId,
    PermisoId
)
SELECT
    1,
    3,
    Id
FROM acceso_usuario.Permisos
WHERE Nombre IN ('ver', 'crear', 'editar', 'eliminar');
GO

select * from acceso_usuario.Modulos
select * from acceso_usuario.Areas

SELECT
    u.Id,
    u.Alias,
    u.Correo,
    m.Nombre AS Modulo,
    p.Nombre AS Permiso
FROM acceso_usuario.UsuarioModuloPermisos ump
INNER JOIN acceso_usuario.Usuarios u
    ON u.Id = ump.UsuarioId
INNER JOIN acceso_usuario.Modulos m
    ON m.Id = ump.ModuloId
INNER JOIN acceso_usuario.Permisos p
    ON p.Id = ump.PermisoId
WHERE u.Alias = 'superAdmin';
GO


CREATE TABLE acceso_usuario.SolicitudUsuarios (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(30) NOT NULL,
    ApellidoPaterno VARCHAR(20) NOT NULL,
    ApellidoMaterno VARCHAR(20) NOT NULL,
    FechaNacimiento DATE NOT NULL,
    Sexo VARCHAR(1) NOT NULL,
    FechaIngreso DATE NOT NULL DEFAULT GETDATE(),
    Username VARCHAR(10) NOT NULL,
    Correo NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,

    CONSTRAINT UQ_Solicitud_User UNIQUE (Username),
    CONSTRAINT UQ_Solicitud_correo UNIQUE (Correo)
);
GO

ALTER TABLE acceso_usuario.SolicitudUsuarios
ADD Aprobado BIT NOT NULL DEFAULT 0;
GO



USE [hospital_infantil];
GO

DECLARE @PasswordHash NVARCHAR(500) = '$2a$11$93Od4n86eri7QP.p0Hfki.bJyPwoOKcRn/6yZO7xtMGuk5fFmD4Si';
DECLARE @AdminRolId SMALLINT;

-- 1. Obtener el ID del rol 'admin'
SELECT @AdminRolId = Id
FROM acceso_usuario.TipoUsuario
WHERE NivelUsuario = 'admin';

DECLARE @IdRecursosH INT;
DECLARE @IdContab INT;

-- ========================================================
-- 2. Insertar usuario RecursosH
-- ========================================================
INSERT INTO acceso_usuario.Usuarios (
    TipoId,
    Nombre,
    ApellidoPaterno,
    ApellidoMaterno,
    FechaNacimiento,
    Sexo,
    FechaIngreso,
    Alias,
    Correo,
    PasswordHash,
    Activo
)
VALUES (
    @AdminRolId,
    'Christopher',
    'Figheroa',
    'Marquez',
    '2000-01-01',
    'M',
    CAST(GETDATE() AS DATE),
    'RecursosH',
    'recursosh@ejemplo.com',
    @PasswordHash,
    1
);

SET @IdRecursosH = SCOPE_IDENTITY();

-- ========================================================
-- 3. Insertar usuario Contab
-- ========================================================
INSERT INTO acceso_usuario.Usuarios (
    TipoId,
    Nombre,
    ApellidoPaterno,
    ApellidoMaterno,
    FechaNacimiento,
    Sexo,
    FechaIngreso,
    Alias,
    Correo,
    PasswordHash,
    Activo
)
VALUES (
    @AdminRolId,
    'Christopher',
    'Figheroa',
    'Marquez',
    '2000-01-01',
    'M',
    CAST(GETDATE() AS DATE),
    'Contab',
    'contab@ejemplo.com',
    @PasswordHash,
    1
);

SET @IdContab = SCOPE_IDENTITY();

-- ========================================================
-- 4. Asignar los 4 permisos al usuario RecursosH (ModuloId 2)
-- ========================================================
INSERT INTO acceso_usuario.UsuarioModuloPermisos (
    UsuarioId,
    ModuloId,
    PermisoId
)
SELECT
    @IdRecursosH,
    2,
    Id
FROM acceso_usuario.Permisos
WHERE Nombre IN ('ver', 'crear', 'editar', 'eliminar');

-- ========================================================
-- 5. Asignar los 4 permisos al usuario Contab (ModuloId 1002)
-- ========================================================
INSERT INTO acceso_usuario.UsuarioModuloPermisos (
    UsuarioId,
    ModuloId,
    PermisoId
)
SELECT
    @IdContab,
    1002,
    Id
FROM acceso_usuario.Permisos
WHERE Nombre IN ('ver', 'crear', 'editar', 'eliminar');
GO

-- ========================================================
-- Verificación rápida de la inserción
-- ========================================================
SELECT
    u.Alias,
    u.Nombre,
    u.ApellidoPaterno,
    tu.NivelUsuario,
    m.Nombre AS Modulo,
    p.Nombre AS Permiso
FROM acceso_usuario.UsuarioModuloPermisos ump
INNER JOIN acceso_usuario.Usuarios u ON u.Id = ump.UsuarioId
INNER JOIN acceso_usuario.TipoUsuario tu ON tu.Id = u.TipoId
INNER JOIN acceso_usuario.Modulos m ON m.Id = ump.ModuloId
INNER JOIN acceso_usuario.Permisos p ON p.Id = ump.PermisoId
WHERE u.Alias IN ('RecursosH', 'Contab', 'superAdmin');
GO