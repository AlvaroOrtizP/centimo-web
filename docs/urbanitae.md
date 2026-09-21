# Entidades: Urbanitae — Balance mensual y registro de compras

> **Implementado:** `false`

Entidad dedicada a Urbanitae (crowdlending inmobiliario). Dividida en dos partes, igual que Equito:

1. **`UrbanitaeBalance`**: una fila por mes con el dinero en Urbanitae, el aporte del mes y el bloque de Hacienda (Urbanitae paga parte de lo que obtuviste con tus rentas).
2. **`UrbanitaeCompra`**: un registro por compra realizada (préstamo adquirido), con la entidad, el monto, el rendimiento y su estado.

## 1. Balance mensual (UrbanitaeBalance)

### Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | Clave natural `{AAAA-MM}` (p. ej. `2026-07`) |
| `mes` | VARCHAR(7) | Fecha mes-año en **una sola columna** (formato `YYYY-MM`) |
| `balance_mensual` | NUMERIC(12,2) | Dinero en Urbanitae en el mes |
| `aporte_mensual` | NUMERIC(12,2) | Aporte que se hace ese mes (puede ser 0) |
| `dinero_total` | NUMERIC(12,2) | Dinero total que da Urbanitae en el mes (rendimiento generado) |
| `dinero_hacienda` | NUMERIC(12,2) | Dinero que se queda Hacienda |
| `dinero_final` | NUMERIC(12,2) | Dinero que finalmente te llega (después de Hacienda) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

### Identificador

Fila única por `mes` ⇒ **clave natural legible `{AAAA-MM}`** (p. ej. `2026-07`), como `equito_balances`.

- Resta leer en logs y URLs (`/urbanitae/balances/2026-07`).
- Compatible con la convención `VARCHAR(50)` del proyecto.
- Se refuerza con `UNIQUE(mes)` como red de seguridad.

**Decidido:** identificador natural `{AAAA-MM}`.

### Esquema de la tabla

```sql
CREATE TABLE urbanitae_balances (
  id                   VARCHAR(50)   PRIMARY KEY,
  mes                  VARCHAR(7)    NOT NULL UNIQUE,
  balance_mensual      NUMERIC(12,2) NOT NULL,
  aporte_mensual       NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinero_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinero_hacienda      NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinero_final         NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_creacion       TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP     DEFAULT NOW()
);

COMMENT ON COLUMN urbanitae_balances.id IS 'Clave natural {AAAA-MM} (p. ej. 2026-07)';
COMMENT ON COLUMN urbanitae_balances.mes IS 'Fecha mes-año en una sola columna (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN urbanitae_balances.balance_mensual IS 'Dinero en Urbanitae en el mes';
COMMENT ON COLUMN urbanitae_balances.aporte_mensual IS 'Aporte que se hace ese mes (puede ser 0)';
COMMENT ON COLUMN urbanitae_balances.dinero_total IS 'Dinero total que da Urbanitae en el mes (rendimiento generado)';
COMMENT ON COLUMN urbanitae_balances.dinero_hacienda IS 'Dinero que se queda Hacienda';
COMMENT ON COLUMN urbanitae_balances.dinero_final IS 'Dinero que finalmente te llega (después de Hacienda)';
COMMENT ON COLUMN urbanitae_balances.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN urbanitae_balances.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

## 2. Registro de compras (UrbanitaeCompra)

### Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID generado por la aplicación |
| `fecha` | DATE | Fecha de la compra |
| `entidad` | VARCHAR(100) | Entidad/promotor al que se presta el dinero |
| `monto` | NUMERIC(12,2) | Importe de la compra |
| `rendimiento` | NUMERIC(5,2) | Rendimiento/interés de la compra (entero, p. ej. 8.50; se divide entre 100 para operar) |
| `estado` | ENUM (`activa`, `vendida`) | Estado de la compra |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

### Identificador

Clave de aplicación (UUID, `VARCHAR(50)`). No hay clave natural: en un mismo mes se pueden hacer varias compras, así que cada una se identifica por su UUID.

### Esquema de la tabla

```sql
CREATE TABLE urbanitae_compras (
  id                   VARCHAR(50)    PRIMARY KEY,
  fecha                DATE           NOT NULL,
  entidad              VARCHAR(100)   NOT NULL,
  monto                NUMERIC(12,2)  NOT NULL,
  rendimiento          NUMERIC(5,2)   NOT NULL DEFAULT 0,
  estado               VARCHAR(20)    NOT NULL CHECK (estado IN ('activa', 'vendida')),
  fecha_creacion       TIMESTAMP      DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_urbanitae_compras_fecha ON urbanitae_compras(fecha);

COMMENT ON COLUMN urbanitae_compras.id IS 'UUID generado por la aplicación';
COMMENT ON COLUMN urbanitae_compras.fecha IS 'Fecha de la compra';
COMMENT ON COLUMN urbanitae_compras.entidad IS 'Entidad/promotor al que se presta el dinero';
COMMENT ON COLUMN urbanitae_compras.monto IS 'Importe de la compra';
COMMENT ON COLUMN urbanitae_compras.rendimiento IS 'Rendimiento/interés de la compra (entero, p. ej. 8.50; se divide entre 100)';
COMMENT ON COLUMN urbanitae_compras.estado IS 'Estado de la compra: activa o vendida';
COMMENT ON COLUMN urbanitae_compras.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN urbanitae_compras.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

## Endpoints

### Balance mensual

#### Guardar balance de un mes (POST)

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/urbanitae/balances` | `UrbanitaeBalanceRequest` (mes, balance_mensual, aporte_mensual, dinero_total, dinero_hacienda, dinero_final) | Crear o actualizar el balance de un mes (upsert por `mes`) |

#### Listar balances (GET, paginado)

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/urbanitae/balances` | `limit` (opcional con default), `order` (`asc`/`desc` por `mes`, opcional) | Listar los N últimos/primeros meses |

#### Actualizar un balance (PUT)

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/urbanitae/balances/{id}` | `UrbanitaeBalanceRequest` (mes, balance_mensual, aporte_mensual, dinero_total, dinero_hacienda, dinero_final) | Actualizar el balance de un mes (`{AAAA-MM}`) |

#### Eliminar un balance (DELETE)

| Método | Path | Uso |
|---|---|---|
| DELETE | `/urbanitae/balances/{id}` | Eliminar el balance de un mes (`{AAAA-MM}`) |

### Registro de compras

#### Crear una compra (POST)

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/urbanitae/compras` | `UrbanitaeCompraCreate` (fecha, entidad, monto, rendimiento, estado) | Registrar una compra de un préstamo |

#### Listar compras (GET)

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/urbanitae/compras` | `estado` (opcional), `order` (`asc`/`desc` por `fecha`, opcional) | Listar compras, opcionalmente filtradas por estado y ordenadas por fecha |

#### Actualizar una compra (PUT)

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/urbanitae/compras/{id}` | `UrbanitaeCompraUpdate` (fecha, entidad, monto, rendimiento, estado) | Actualizar una compra (p. ej. marcarla como `vendida`) |

#### Eliminar una compra (DELETE)

| Método | Path | Uso |
|---|---|---|
| DELETE | `/urbanitae/compras/{id}` | Eliminar una compra |

## Reglas de diseño

- Enum de dominio: `EstadoUrbanitaeCompra { activa, vendida }` en `domain/enums/`.
- Modelos de dominio: `UrbanitaeBalance` (`id, mes, balanceMensual, aporteMensual, dineroTotal, dineroHacienda, dineroFinal` + fechas) y `UrbanitaeCompra` (`id, fecha, entidad, monto, rendimiento, estado` + fechas).
- Entidades JPA: `UrbanitaeBalanceMO` (`@Table(name = "urbanitae_balances")`) y `UrbanitaeCompraMO` (`@Table(name = "urbanitae_compras")`).
- Sin FK a `cuentas`: son datos propios del ecosistema Urbanitae.
- `mes` inmutable en el `UPDATE` del balance; en las compras se cambia el `estado` (activa → vendida).
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `UrbanitaeBalance`, `UrbanitaeCompra` (domain models), `UrbanitaeBalanceDrivingPort`/`UrbanitaeCompraDrivingPort`, `UrbanitaeBalanceUseCase`/`UrbanitaeCompraUseCase`, `UrbanitaeBalanceDrivenPort`/`UrbanitaeCompraDrivenPort`.
- **Capa driven**: `UrbanitaeBalanceMO`/`UrbanitaeCompraMO`, repositorios, `UrbanitaeBalanceDatasourceAdapter`/`UrbanitaeCompraDatasourceAdapter`, `UrbanitaeBalanceDatasourceMapper`/`UrbanitaeCompraDatasourceMapper`.
- **Capa driving**: controladores implementando las APIs de swagger, `UrbanitaeBalanceApiMapper`/`UrbanitaeCompraApiMapper`.
- **Swagger**: nuevos schemas y paths para `UrbanitaeBalance` y `UrbanitaeCompra`.
- **Flyway**: nueva migración `V20__create_urbanitae.sql` con `urbanitae_balances` y `urbanitae_compras`.
- **Tests**: no hay IT específico para estas entidades. `CrowdlendingIT` cubre el CRUD genérico de crowdlending (`/crowdlending`), no estas dos entidades; habrá que crear un IT dedicado (`UrbanitaeEntityIT`).