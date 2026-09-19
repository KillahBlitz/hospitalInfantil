USE [hospital_infantil];
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'recursos_humanos')
    EXEC('CREATE SCHEMA recursos_humanos');
GO

CREATE TABLE recursos_humanos.Areas (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(150) NOT NULL,
    ClaveArea VARCHAR(30) NULL,

    CONSTRAINT PK_Areas PRIMARY KEY (Id),
    CONSTRAINT UQ_Areas_Descripcion UNIQUE (Descripcion)
);
GO

CREATE UNIQUE INDEX UQ_Areas_ClaveArea
    ON recursos_humanos.Areas(ClaveArea)
    WHERE ClaveArea IS NOT NULL;
GO

CREATE TABLE recursos_humanos.Puestos (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(150) NOT NULL,
    CodigoPuesto VARCHAR(20) NOT NULL,
    GradoSalarial VARCHAR(10) NULL,
    RangoSalarial SMALLINT NULL,

    CONSTRAINT PK_Puestos PRIMARY KEY (Id),
    CONSTRAINT UQ_Puestos_CodigoPuesto UNIQUE (CodigoPuesto)
);
GO

CREATE TABLE recursos_humanos.TiposContratacion (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(100) NOT NULL,

    CONSTRAINT PK_TiposContratacion PRIMARY KEY (Id),
    CONSTRAINT UQ_TiposContratacion_Descripcion UNIQUE (Descripcion)
);
GO

CREATE TABLE recursos_humanos.TiposPlaza (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(100) NOT NULL,

    CONSTRAINT PK_TiposPlaza PRIMARY KEY (Id),
    CONSTRAINT UQ_TiposPlaza_Descripcion UNIQUE (Descripcion)
);
GO

CREATE TABLE recursos_humanos.Unidad (
    Id INT IDENTITY(1,1) NOT NULL,
    Unidad NVARCHAR(150) NOT NULL,
    Ramo VARCHAR(20) NULL,
    ZE VARCHAR(10) NULL,

    CONSTRAINT PK_Unidad PRIMARY KEY (Id),
    CONSTRAINT UQ_Unidad_Unidad UNIQUE (Unidad)
);
GO

CREATE TABLE recursos_humanos.Plazas (
    Id INT IDENTITY(1,1) NOT NULL,
    PuestoId INT NOT NULL,
    TipoContratacionId INT NOT NULL,
    TipoPlazaId INT NULL,
    UnidadId INT NOT NULL,
    Ocupabilidad BIT NOT NULL DEFAULT 0,
    FechaVacancia DATE NULL,
    CodigoSHCP VARCHAR(30) NULL,
    CodigoFederalPuesto VARCHAR(30) NULL,
    ClavePresupuestalActual VARCHAR(60) NULL,
    ClavePlaza VARCHAR(10) NOT NULL,
    AreaId INT NULL,
    DenominacionPuesto NVARCHAR(150) NULL,
    CantidadPlazaHora SMALLINT NULL,

    CONSTRAINT PK_Plazas PRIMARY KEY (Id),

    CONSTRAINT FK_Plazas_Puestos
        FOREIGN KEY (PuestoId)
        REFERENCES recursos_humanos.Puestos(Id),

    CONSTRAINT FK_Plazas_Areas
        FOREIGN KEY (AreaId)
        REFERENCES recursos_humanos.Areas(Id),

    CONSTRAINT FK_Plazas_TiposContratacion
        FOREIGN KEY (TipoContratacionId)
        REFERENCES recursos_humanos.TiposContratacion(Id),

    CONSTRAINT FK_Plazas_TiposPlaza
        FOREIGN KEY (TipoPlazaId)
        REFERENCES recursos_humanos.TiposPlaza(Id),

    CONSTRAINT FK_Plazas_Unidad
        FOREIGN KEY (UnidadId)
        REFERENCES recursos_humanos.Unidad(Id),

    CONSTRAINT UQ_Plazas_ClavePlaza UNIQUE (ClavePlaza)
);
GO

CREATE TABLE recursos_humanos.RegistroCodFedPuesto (
    Id INT IDENTITY(1,1) NOT NULL,
    PlazaId INT NOT NULL,
    CodigoFederalPuesto VARCHAR(30) NOT NULL,
    FechaActualizacion DATE NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_RegistroCodFedPuesto PRIMARY KEY (Id),

    CONSTRAINT FK_RegistroCodFedPuesto_Plazas
        FOREIGN KEY (PlazaId)
        REFERENCES recursos_humanos.Plazas(Id)
);
GO

CREATE TABLE recursos_humanos.Empleados (
    Id INT IDENTITY(1,1) NOT NULL,
    PlazaId INT NULL,
    Nombres VARCHAR(50) NOT NULL,
    ApellidoPaterno VARCHAR(50) NOT NULL,
    ApellidoMaterno VARCHAR(50) NULL,
    FechaNacimiento DATE NOT NULL,
    Sexo VARCHAR(1) NOT NULL,
    CURP CHAR(18) NOT NULL,
    RFC VARCHAR(13) NOT NULL,
    NSS VARCHAR(11) NULL,
    FechaIngreso DATE NOT NULL DEFAULT GETDATE(),
    Activo BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Empleados PRIMARY KEY (Id),

    CONSTRAINT FK_Empleados_Plazas
        FOREIGN KEY (PlazaId)
        REFERENCES recursos_humanos.Plazas(Id),

    CONSTRAINT CK_Empleados_Sexo CHECK (Sexo IN ('M', 'H', 'X')),

    CONSTRAINT UQ_Empleados_CURP UNIQUE (CURP),
    CONSTRAINT UQ_Empleados_RFC UNIQUE (RFC)
);
GO

CREATE UNIQUE INDEX UQ_Empleados_NSS
    ON recursos_humanos.Empleados(NSS)
    WHERE NSS IS NOT NULL;
GO

CREATE TABLE recursos_humanos.Comentarios (
    Id INT IDENTITY(1,1) NOT NULL,
    EmpleadoId INT NOT NULL,
    NumeroComentario INT NOT NULL,
    Comentario NVARCHAR(1000) NOT NULL,
    TipoComentario VARCHAR(30) NULL,

    CONSTRAINT PK_Comentarios PRIMARY KEY (Id),

    CONSTRAINT FK_Comentarios_Empleados
        FOREIGN KEY (EmpleadoId)
        REFERENCES recursos_humanos.Empleados(Id),

    CONSTRAINT UQ_Comentarios_Empleado_Numero UNIQUE (EmpleadoId, NumeroComentario)
);
GO

CREATE TABLE recursos_humanos.TiposNomina (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(100) NOT NULL,

    CONSTRAINT PK_TiposNomina PRIMARY KEY (Id),
    CONSTRAINT UQ_TiposNomina_Descripcion UNIQUE (Descripcion)
);
GO

CREATE TABLE recursos_humanos.RegimenSS (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(100) NOT NULL,

    CONSTRAINT PK_RegimenSS PRIMARY KEY (Id),
    CONSTRAINT UQ_RegimenSS_Descripcion UNIQUE (Descripcion)
);
GO

CREATE TABLE recursos_humanos.CatalogoImpuestos (
    Id INT IDENTITY(1,1) NOT NULL,
    Descripcion NVARCHAR(150) NOT NULL,
    ValorImpuesto DECIMAL(16,2) NOT NULL,

    CONSTRAINT PK_CatalogoImpuestos PRIMARY KEY (Id),
    CONSTRAINT UQ_CatalogoImpuestos_Descripcion UNIQUE (Descripcion)
);
GO

CREATE TABLE recursos_humanos.Nominas (
    Id INT IDENTITY(1,1) NOT NULL,
    EmpleadoId INT NOT NULL,
    TipoNominaId INT NOT NULL,
    RegimenSSId INT NOT NULL,
    NumeroQuincena SMALLINT NOT NULL,
    FechaInicial DATE NOT NULL,
    FechaFinal DATE NOT NULL,
    FechaPago DATE NULL,
    Percepciones DECIMAL(16,2) NOT NULL DEFAULT 0,
    Deducciones DECIMAL(16,2) NOT NULL DEFAULT 0,
    Neto DECIMAL(16,2) NOT NULL DEFAULT 0,

    CONSTRAINT PK_Nominas PRIMARY KEY (Id),

    CONSTRAINT FK_Nominas_Empleados
        FOREIGN KEY (EmpleadoId)
        REFERENCES recursos_humanos.Empleados(Id),

    CONSTRAINT FK_Nominas_TiposNomina
        FOREIGN KEY (TipoNominaId)
        REFERENCES recursos_humanos.TiposNomina(Id),

    CONSTRAINT FK_Nominas_RegimenSS
        FOREIGN KEY (RegimenSSId)
        REFERENCES recursos_humanos.RegimenSS(Id),

    CONSTRAINT UQ_Nominas_Empleado_Periodo UNIQUE (EmpleadoId, TipoNominaId, NumeroQuincena, FechaInicial)
);
GO

FROM sys.tables AS t
INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
WHERE s.name = 'recursos_humanos'
ORDER BY t.name;
GO
