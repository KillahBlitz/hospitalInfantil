USE hospital_infantil;
GO


CREATE TABLE Contabilidad.Clave (
    IdClave INT IDENTITY(1,1) PRIMARY KEY,          -- Identificador único de la clave de área
    DesClaveArea CHAR(2) NOT NULL                   -- Descripcion de MT-material, AF-farmaceutica, AT-adquisicion
);
GO

CREATE TABLE Contabilidad.TipoMovimientosCon (
    IdTipoMovimientosCon INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del tipo de movimiento contable
    TipoMovimiento VARCHAR(25),                          -- Nombre del tipo de movimiento (ej. "decolucion", "pasivo")
    Egreso BIT,                                          -- Indica si el movimiento representa un egreso (1) o no (0)
    Diario BIT                                           -- Indica si el movimiento aplica al diario contable (1) o no (0)
);
GO

CREATE TABLE Contabilidad.MovimientoMonetario (
    IdMovimientoMonetario INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del movimiento monetario
    NombreCA VARCHAR(6),                                  -- Naturaleza del movimiento: "Cargo" o "Abono"
    Monto DECIMAL(18,2)                                   -- Monto del movimiento
);
GO

CREATE TABLE Contabilidad.Proveedor (
    IdProveedor INT IDENTITY(1,1) PRIMARY KEY,      -- Identificador único del proveedor
    NombreProveedor VARCHAR(50) NOT NULL            -- Razón social o nombre del proveedor
);
GO

CREATE TABLE Contabilidad.MetodoPago (
    IdMetodoPago INT IDENTITY(1,1) PRIMARY KEY,     -- Identificador único del método de pago
    TipoMetodoPago VARCHAR(3),                      -- Clave SAT del método: "PUE" o "PPD"
    DescripcionMetodo VARCHAR(100)                  -- Descripción legible del método de pago
);
GO

CREATE TABLE Contabilidad.Productos (
    IdProducto INT IDENTITY(1,1) PRIMARY KEY,       -- Identificador único del producto
    NomProducto VARCHAR(50)                         -- nombre del registro del producto o servicio
);
GO

CREATE TABLE Contabilidad.TipoRelacion (
    IdTipoRelacion INT IDENTITY(1,1) PRIMARY KEY,   -- Identificador único del tipo de relación CFDI
    NomRelacion VARCHAR(50)                         -- Nombre del tipo de relaccion tiene(devolucion,Sustitucion, ect)
);
GO

--Provedores, cuenas y contratos

CREATE TABLE Contabilidad.CuentaBancaria (
    IdCuentaBancaria INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único de la cuenta bancaria
    IdProveedor INT NOT NULL,                        -- Proveedor id dueño de la cuenta
    NumeroCuenta INT NOT NULL,                        -- Número de cuenta bancaria
    Banco VARCHAR(30),                                -- Nombre del banco
    ClaveInterbancaria INT NOT NULL,                  -- CLABE interbancaria

    CONSTRAINT FkCuentaProveedor FOREIGN KEY (IdProveedor)
        REFERENCES Contabilidad.Proveedor(IdProveedor)
);
GO

CREATE TABLE Contabilidad.Factura (
    IdFactura INT IDENTITY(1,1) PRIMARY KEY,        -- Identificador único de la factura
    Serie INT,                                        -- Serie del CFDI
    FolioFiscal CHAR(36),                             -- UUID fiscal del CFDI
    IdProveedor INT,                                  -- Proveedor que emitió la factura
    ImporteFactura DECIMAL(18,2),                     -- Importe total de la factura
    Estatus VARCHAR(20) DEFAULT 'Pendiente',          -- Estatus de la factura (Pendiente, Pagada, Cancelada)
    IdNumeroContrato INT,                             -- Contrato al que pertenece la factura (agregado más abajo)

    CONSTRAINT FkIdProveedor FOREIGN KEY (IdProveedor)
        REFERENCES Contabilidad.Proveedor(IdProveedor)
);
GO

CREATE TABLE Contabilidad.Contrato (
    IdNumeroContrato INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del contrato
    ClaveArea INT NOT NULL,                          -- Área responsable del contrato (ej. MT, AF, TM)
    AñoContrato INT,                                 -- Año en el que viene registrado el contrato
    IdFactura INT,                                   -- Factura de referencia asociada al contrato

    CONSTRAINT FkClaveArea FOREIGN KEY (ClaveArea)
        REFERENCES Contabilidad.Clave(IdClave),
    CONSTRAINT FkContratoIdFactura FOREIGN KEY (IdFactura)
        REFERENCES Contabilidad.Factura(IdFactura)
);
GO


ALTER TABLE Contabilidad.Factura
    ADD CONSTRAINT FkFacturaIdNumeroContrato
        FOREIGN KEY (IdNumeroContrato) REFERENCES Contabilidad.Contrato(IdNumeroContrato);
GO

--Polizas y movimiento contable

CREATE TABLE Contabilidad.PolizaContable (
    IdPoliza INT IDENTITY(1,1) PRIMARY KEY,         -- Identificador único de la póliza contable
    IdMovimiento INT,                                -- id del numero del movimiento  contable
    FechaInicio DATE NOT NULL,                       -- Fecha de inicio del periodo de la póliza
    FechaFinal DATE,                                 -- Fecha de cierre del periodo de la póliza
    CapituloGasto INT,                               -- Capítulo de gasto presupuestal
    Pp INT,                                          -- Partida presupuestal
    Clc INT                                          -- Clave de la cuenta contable (CLC)
);
GO

CREATE TABLE Contabilidad.MovimientoContable (
    IdMovimientoCont INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del movimiento contable
    IdProveedor INT,                                 -- Proveedor relacionado al movimiento
    IdNumeroContrato INT,                            -- Contrato relacionado al movimiento
    IdPoliza INT,                                    -- Póliza contable a la que pertenece el movimiento
    FechaInicio DATE NOT NULL,                       -- Fecha de inicio del movimiento
    FechaFinal DATE,                                 -- Fecha de cierre del movimiento
    NumeroEntrada INT NOT NULL,                      -- Número de entrada/folio del movimiento
    IdTipoMovCon INT,                                -- Tipo de movimiento contable
    AñoPeriodo INT,                                  -- Año del periodo contable
    DescripcionOriginal VARCHAR(100),                -- Descripción original del movimiento
    SaldoInicial DECIMAL(18,2),                       -- Saldo antes del movimiento
    SaldoFinal DECIMAL(18,2),                         -- Saldo después del movimiento
    SumaMovimientos DECIMAL(18,2),                    -- Suma total de los movimientos del periodo
    IdMovimientoMonetario INT,                        -- Movimiento monetario (cargo/abono) asociado

    CONSTRAINT FkMovimientoProveedor FOREIGN KEY (IdProveedor)
        REFERENCES Contabilidad.Proveedor(IdProveedor),
    CONSTRAINT FkIdPoliza FOREIGN KEY (IdPoliza)
        REFERENCES Contabilidad.PolizaContable(IdPoliza),
    CONSTRAINT FkIdNumeroContrato FOREIGN KEY (IdNumeroContrato)
        REFERENCES Contabilidad.Contrato(IdNumeroContrato),
    CONSTRAINT FkIdTipoMovimientoCon FOREIGN KEY (IdTipoMovCon)
        REFERENCES Contabilidad.TipoMovimientosCon(IdTipoMovimientosCon),
    CONSTRAINT FkMovimientoMonetario FOREIGN KEY (IdMovimientoMonetario)
        REFERENCES Contabilidad.MovimientoMonetario(IdMovimientoMonetario)
);
GO

--complemento de pago

CREATE TABLE Contabilidad.ComplementoPago (
    IdComplementoPago INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del complemento de pago (encabezado)
    FolioFiscal CHAR(36) NOT NULL,                    -- UUID fiscal del complemento de pago
    IdProveedor INT,                                  -- Proveedor que recibe el pago
    FechaEmision DATE NOT NULL,                       -- Fecha de emisión del complemento
    FechaCertificacion DATE,                          -- Fecha de certificación ante el SAT
    IdMetodoPago INT,                                 -- Método de pago utilizado
    MontoTotal DECIMAL(18,2),                         -- Monto total cubierto por el complemento

    CONSTRAINT FkPagoIdProveedor FOREIGN KEY (IdProveedor)
        REFERENCES Contabilidad.Proveedor(IdProveedor),
    CONSTRAINT FkIdMetodoPago FOREIGN KEY (IdMetodoPago)
        REFERENCES Contabilidad.MetodoPago(IdMetodoPago)
);
GO

CREATE TABLE Contabilidad.ComplementoPagoDetallado (
    IdComplementoPagoDetallado INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del detalle del complemento
    IdComplementoPago INT,                            -- Complemento de pago (encabezado) al que pertenece
    UuidRelacionales CHAR(36),                        -- UUID de la factura relacionada con el folio fiscal del hospital
    IdFactura INT,                                    -- Factura cubierta por este detalle
    IdProducto INT,                                   -- Producto o concepto facturado
    IdTipoRelacion INT,                               -- Tipo de relación CFDI aplicable
    Concepto VARCHAR(50),                             -- Concepto del pago que viene relacionado
    Periodo INT,                                      -- Periodo contable al que corresponde
    MontoTotal DECIMAL(18,2),                         -- Monto cubierto de esta factura en el detalle

    CONSTRAINT FkIdComplementoPago FOREIGN KEY (IdComplementoPago)
        REFERENCES Contabilidad.ComplementoPago(IdComplementoPago),
    CONSTRAINT FkDetalladoIdFactura FOREIGN KEY (IdFactura)
        REFERENCES Contabilidad.Factura(IdFactura),
    CONSTRAINT FkIdProducto FOREIGN KEY (IdProducto)
        REFERENCES Contabilidad.Productos(IdProducto),
    CONSTRAINT FkIdTipoRelacion FOREIGN KEY (IdTipoRelacion)
        REFERENCES Contabilidad.TipoRelacion(IdTipoRelacion)
);
GO

CREATE TABLE Contabilidad.MovimientoFactura (
    IdMovimientoFactura INT IDENTITY(1,1) PRIMARY KEY, -- Identificador único del cruce movimiento-factura
    IdMovimientoContable INT NOT NULL,                  -- Movimiento contable relacionado
    IdFactura INT,                                       -- Factura relacionada
    Periodo INT,                                         -- Periodo contable
    Año INT,                                             -- Año contable
    Fecha DATE,                                          -- Fecha del cruce

    CONSTRAINT FkMovFacturaIdMovimientoContable FOREIGN KEY (IdMovimientoContable)
        REFERENCES Contabilidad.MovimientoContable(IdMovimientoCont),
    CONSTRAINT FkMovFacturaIdFactura FOREIGN KEY (IdFactura)
        REFERENCES Contabilidad.Factura(IdFactura)
);
GO