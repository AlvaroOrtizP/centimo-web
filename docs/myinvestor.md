# Entidades: MyInvestor — Activos y balances mensuales

> **Implementado:** `false`

Entidad dedicada a MyInvestor. La pantalla de MyInvestor agrupa **2 fondos indexados y 1 roboadvisor**. Está dividida en dos partes:

1. **`FondoMyInvestor`**: catálogo de activos (`fondos_myinvestor`). Una fila por activo: fondo indexado o roboadvisor.
2. **`BalanceFondo`**: balance mensual por activo (`balances_fondo`). Guarda el balance a final de mes y el aporte del mes para cada activo.

## 1. Activos (FondoMyInvestor)

### Datos que guarda

Todos los campos son `NOT NULL` salvo `codigo_isin` (nulo para el roboadvisor) y los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | Identificador del activo (proporcionado al crear, p. ej. `mi-msci-word`, `mi-robo`) |
| `codigo_isin` | VARCHAR(20) | ISIN del fondo (único); **nulo para el roboadvisor** |
| `nombre` | VARCHAR(200) | Nombre del activo |
| `tipo` | ENUM (`fondo`, `roboadvisor`) | Tipo de activo |
| `fecha_creacion` | TIMESTAMP | Auditoría |

> **Cambio propuesto sobre el modelo actual (V6):** añadir la columna `tipo` y permitir `codigo_isin` nulo, para poder registrar el roboadvisor (que no tiene ISIN de fondo).

### Identificador

Clave de aplicación (VARCHAR(50)) proporcionada al crear el activo, como el resto de catálogos del proyecto (`plataformas`, `cuentas`). El `codigo_isin` es `UNIQUE` como red de seguridad (no se puede dar de alta dos fondos con el mismo ISIN); los roboadvisors dejan ese campo nulo.

### Esquema de la tabla

```sql
CREATE TABLE fondos_myinvestor (
  id             VARCHAR(50)  PRIMARY KEY,
  codigo_isin    VARCHAR(20)  UNIQUE,
  nombre         VARCHAR(200) NOT NULL,
  tipo           VARCHAR(20)  NOT NULL DEFAULT 'fondo' CHECK (tipo IN ('fondo', 'roboadvisor')),
  fecha_creacion TIMESTAMP    DEFAULT NOW()
);

COMMENT ON COLUMN fondos_myinvestor.id IS 'Identificador del activo (proporcionado al crear)';
COMMENT ON COLUMN fondos_myinvestor.codigo_isin IS 'ISIN del fondo (único); nulo para el roboadvisor';
COMMENT ON COLUMN fondos_myinvestor.nombre IS 'Nombre del activo';
COMMENT ON COLUMN fondos_myinvestor.tipo IS 'Tipo de activo: fondo o roboadvisor';
COMMENT ON COLUMN fondos_myinvestor.fecha_creacion IS 'Auditoría: fecha de creación';
```

### Endpoints

| Método | Path | Body | Uso |
|---|---|---|---|
| GET | `/myinvestor-funds` | — | Listar los activos (2 fondos + roboadvisor) |
| GET | `/myinvestor-funds/{id}` | — | Obtener un activo por su id |
| POST | `/myinvestor-funds` | `MyInvestorFundCreate` (id, code, name) | Crear un activo |
| PUT | `/myinvestor-funds/{id}` | `MyInvestorFundUpdate` (code, name) | Actualizar un activo |
| DELETE | `/myinvestor-funds/{id}` | — | Eliminar un activo |

## 2. Balance mensual por activo (BalanceFondo)

### Datos que guarda

Todos los campos son `NOT NULL` salvo `intereses`, `aportacion`, `retirada` y los de auditoría. Un registro por activo, año y mes.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID generado por la aplicación |
| `fondo_id` | VARCHAR(50) FK | Activo al que pertenece (`fondos_myinvestor.id`, `ON DELETE CASCADE`) |
| `anio` | INTEGER | Año del balance |
| `mes` | INTEGER (1-12) | Mes del balance |
| `saldo` | NUMERIC(12,2) | Balance del activo a final de mes |
| `intereses` | NUMERIC(12,2) | Intereses generados en el mes |
| `aportacion` | NUMERIC(12,2) | Aporte hecho ese mes |
| `retirada` | NUMERIC(12,2) | Retirada hecha ese mes |
| `fecha_creacion` | TIMESTAMP | Auditoría |

### Identificador

Clave de aplicación (UUID, `VARCHAR(50)`). Fila única por `(fondo_id, anio, mes)`: un solo balance a final de mes por activo, reforzado con `UNIQUE(fondo_id, anio, mes)`.

### Esquema de la tabla

```sql
CREATE TABLE balances_fondo (
  id             VARCHAR(50)    PRIMARY KEY,
  fondo_id       VARCHAR(50)    NOT NULL REFERENCES fondos_myinvestor(id) ON DELETE CASCADE,
  anio           INTEGER        NOT NULL,
  mes            INTEGER        NOT NULL CHECK (mes BETWEEN 1 AND 12),
  saldo          NUMERIC(12,2)  NOT NULL,
  intereses      NUMERIC(12,2),
  aportacion     NUMERIC(12,2),
  retirada       NUMERIC(12,2),
  fecha_creacion TIMESTAMP      DEFAULT NOW(),
  UNIQUE(fondo_id, anio, mes)
);

CREATE INDEX idx_balances_fondo_fecha ON balances_fondo(anio, mes);
CREATE INDEX idx_balances_fondo_fondo ON balances_fondo(fondo_id);

COMMENT ON COLUMN balances_fondo.id IS 'UUID generado por la aplicación';
COMMENT ON COLUMN balances_fondo.fondo_id IS 'Activo al que pertenece (fondos_myinvestor.id, ON DELETE CASCADE)';
COMMENT ON COLUMN balances_fondo.anio IS 'Año del balance';
COMMENT ON COLUMN balances_fondo.mes IS 'Mes del balance (1-12)';
COMMENT ON COLUMN balances_fondo.saldo IS 'Balance del activo a final de mes';
COMMENT ON COLUMN balances_fondo.intereses IS 'Intereses generados en el mes';
COMMENT ON COLUMN balances_fondo.aportacion IS 'Aporte hecho ese mes';
COMMENT ON COLUMN balances_fondo.retirada IS 'Retirada hecha ese mes';
COMMENT ON COLUMN balances_fondo.fecha_creacion IS 'Auditoría: fecha de creación';
```

### Endpoints

| Método | Path | Query params / Body | Uso |
|---|---|---|---|
| GET | `/fund-balances` | `year` + `month` (obligatorios) | Listar los balances de todos los activos para un mes concreto |
| POST | `/fund-balances` | `FundBalanceCreate` (fundId, year, month, balance, income, contribution, expenses) | Crear el balance de un mes para un activo |
| PUT | `/fund-balances/{id}` | `FundBalanceUpdate` (balance, income, contribution, expenses) | Actualizar balance, intereses, aporte y retirada |
| DELETE | `/fund-balances/{id}` | — | Eliminar un balance |

## Reglas de diseño

- Enum de dominio: `TipoActivoMyInvestor { fondo, roboadvisor }` en `domain/enums/`.
- Modelos de dominio: `FondoMyInvestor` (`id, codigoIsin, nombre` + fechaCreacion) y `BalanceFondo` (`id, fondoId, anio, mes, saldo, intereses, aportacion, retirada` + fechaCreacion).
- Entidades JPA: `FondoMyInvestorMO` y `BalanceFondoMO`; el balance tiene FK `fondo` con `@ManyToOne(fetch = FetchType.LAZY)` + columna duplicada `fondo_id` para leer el id como String.
- El aporte mensual y el balance a final de mes se guardan juntos en `balances_fondo` (`aportacion` + `saldo`).
- Sin lógica de Hacienda: a diferencia de B100/Revolut/Equito, aquí no se desglosa retención; solo intereses, aporte, retirada y saldo.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `FondoMyInvestor`, `BalanceFondo` (domain models), `MyInvestorFundDrivingPort`/`FundBalanceDrivingPort`, `MyInvestorFundUseCase`/`FundBalanceUseCase`, `MyInvestorFundDrivenPort`/`FundBalanceDrivenPort`.
- **Capa driven**: `FondoMyInvestorMO`, `BalanceFondoMO`, `FondoMyInvestorRepository`, `BalanceFondoRepository`, `FondoMyInvestorDatasourceAdapter`, `BalanceFondoDatasourceAdapter`, `FondoMyInvestorDatasourceMapper`, `BalanceFondoDatasourceMapper`.
- **Capa driving**: `MyInvestorFundsController` (implementa `MyInvestorFundsApi`) y `FundBalancesController` (implementa `FundBalancesApi`), con `MyInvestorFundApiMapper` y `FundBalanceApiMapper`.
- **Swagger**: paths `/myinvestor-funds` y `/fund-balances` y schemas `MyInvestorFund`, `MyInvestorFundCreate`, `MyInvestorFundUpdate`, `FundBalance`, `FundBalanceCreate`, `FundBalanceUpdate`.
- **Flyway**: ya existen `V6__create_crowdlending_fondos_balances.sql` y `V12__add_balance_fondo_campos.sql`. Nueva migración `V21__add_tipo_myinvestor.sql` para añadir `tipo` a `fondos_myinvestor` y dejar `codigo_isin` nullable.
- **Tests**: no hay IT específico de estas entidades; los CRUD viven en el swagger existente. Se podrá ampliar con un `MyInvestorIT` que cubra los 3 activos.