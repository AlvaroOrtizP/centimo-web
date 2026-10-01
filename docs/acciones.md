# Entidades: Acciones — Operaciones de compra/venta y balance mensual

> **Implementado:** `false`

Entidad dedicada a la inversión en acciones (broker). Dividida en dos partes:

1. **`OperacionAccion`**: un registro por operación de compra (ampliable con su venta), con el activo, cantidades, precios y la ganancia/pérdida al cerrarse.
2. **`AccionBalance`**: una fila por mes con el valor total de la cartera a final de mes y el aporte del mes.

## 1. Operaciones (OperacionAccion)

### Datos que guarda

Todos los campos son `NOT NULL` salvo los de venta (nulos mientras la operación está abierta) y los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID generado por la aplicación |
| `cuenta_id` | VARCHAR(50) FK | Cuenta del broker en la que se opera (`cuentas.id`, `ON DELETE CASCADE`) |
| `nombre_activo` | VARCHAR(100) | Ticker/acción, p. ej. `AAPL` |
| `tipo_activo` | VARCHAR(20) | Tipo del activo (p. ej. `stock`, `etf`) |
| `fecha_compra` | DATE | Fecha de la compra |
| `cantidad` | NUMERIC(18,8) | Cantidad comprada |
| `precio_unitario_compra` | NUMERIC(12,4) | Precio unitario de compra |
| `coste_total_compra` | NUMERIC(12,2) | Coste total de la compra |
| `fecha_venta` | DATE | Fecha de la venta (nulo mientras esté abierta) |
| `precio_unitario_venta` | NUMERIC(12,4) | Precio unitario de venta (nulo si abierta) |
| `cantidad_recibida` | NUMERIC(12,2) | Total recibido por la venta (nulo si abierta) |
| `ganancia_perdida` | NUMERIC(12,2) | Ganancia/pérdida de la operación (nulo si abierta) |
| `estado` | ENUM (`abierta`, `cerrada`) | Estado de la operación |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

### Identificador

Clave de aplicación (UUID, `VARCHAR(50)`). No hay clave natural: un mismo activo se compra varias veces, así que cada operación se identifica por su UUID. Se consulta por `cuenta_id` y/o `estado`.

### Esquema de la tabla

```sql
CREATE TABLE operaciones_inversion (
  id                      VARCHAR(50)   PRIMARY KEY,
  cuenta_id               VARCHAR(50)   NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre_activo           VARCHAR(100)  NOT NULL,
  tipo_activo             VARCHAR(20)   NOT NULL,
  fecha_compra            DATE          NOT NULL,
  cantidad                NUMERIC(18,8) NOT NULL,
  precio_unitario_compra  NUMERIC(12,4) NOT NULL,
  coste_total_compra      NUMERIC(12,2) NOT NULL,
  fecha_venta             DATE,
  precio_unitario_venta   NUMERIC(12,4),
  cantidad_recibida       NUMERIC(12,2),
  ganancia_perdida        NUMERIC(12,2),
  estado                  VARCHAR(10)   NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  fecha_creacion          TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_operaciones_cuenta ON operaciones_inversion(cuenta_id);
CREATE INDEX idx_operaciones_activo ON operaciones_inversion(nombre_activo);
CREATE INDEX idx_operaciones_estado ON operaciones_inversion(estado);

COMMENT ON COLUMN operaciones_inversion.id IS 'UUID generado por la aplicación';
COMMENT ON COLUMN operaciones_inversion.cuenta_id IS 'Cuenta del broker en la que se opera (cuentas.id, ON DELETE CASCADE)';
COMMENT ON COLUMN operaciones_inversion.nombre_activo IS 'Ticker/acción (p. ej. AAPL)';
COMMENT ON COLUMN operaciones_inversion.tipo_activo IS 'Tipo del activo (p. ej. stock, etf)';
COMMENT ON COLUMN operaciones_inversion.fecha_compra IS 'Fecha de la compra';
COMMENT ON COLUMN operaciones_inversion.cantidad IS 'Cantidad comprada';
COMMENT ON COLUMN operaciones_inversion.precio_unitario_compra IS 'Precio unitario de compra';
COMMENT ON COLUMN operaciones_inversion.coste_total_compra IS 'Coste total de la compra';
COMMENT ON COLUMN operaciones_inversion.fecha_venta IS 'Fecha de la venta (nulo mientras esté abierta)';
COMMENT ON COLUMN operaciones_inversion.precio_unitario_venta IS 'Precio unitario de venta (nulo si abierta)';
COMMENT ON COLUMN operaciones_inversion.cantidad_recibida IS 'Total recibido por la venta (nulo si abierta)';
COMMENT ON COLUMN operaciones_inversion.ganancia_perdida IS 'Ganancia/pérdida de la operación (nulo si abierta)';
COMMENT ON COLUMN operaciones_inversion.estado IS 'Estado de la operación: abierta o cerrada';
COMMENT ON COLUMN operaciones_inversion.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN operaciones_inversion.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

### Endpoints

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/acciones/operaciones` | `OperacionAccionCreate` (cuentaId, nombreActivo, tipoActivo, fechaCompra, cantidad, precioUnitarioCompra, costeTotalCompra) | Registrar una compra de acciones |
| GET | `/acciones/operaciones` | `cuentaId` (opcional), `estado` (opcional), `order` (`asc`/`desc` por `fecha_compra`) | Listar operaciones de un broker, filtradas por estado |
| PUT | `/acciones/operaciones/{id}` | `OperacionAccionUpdate` (fechaVenta, precioUnitarioVenta, cantidadRecibida, gananciaPerdida, estado) | Cerrar o actualizar una operación (marcar como `cerrada` con la venta) |
| DELETE | `/acciones/operaciones/{id}` | — | Eliminar una operación |

## 2. Balance mensual (AccionBalance)

### Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | Clave natural `{AAAA-MM}` (p. ej. `2026-07`) |
| `mes` | VARCHAR(7) | Fecha mes-año en **una sola columna** (formato `YYYY-MM`) |
| `valor_total` | NUMERIC(12,2) | Valor total de la cartera de acciones a final de mes |
| `aporte_mensual` | NUMERIC(12,2) | Importe añadido ese mes (el aporte extra; puede ser 0) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

### Identificador

Fila única por `mes` ⇒ **clave natural legible `{AAAA-MM}`** (p. ej. `2026-07`), como `revolut_balances`.

- Se refuerza con `UNIQUE(mes)` como red de seguridad.

**Decidido:** identificador natural `{AAAA-MM}`.

### Esquema de la tabla

```sql
CREATE TABLE acciones_balances (
  id                   VARCHAR(50)   PRIMARY KEY,
  mes                  VARCHAR(7)    NOT NULL UNIQUE,
  valor_total          NUMERIC(12,2) NOT NULL,
  aporte_mensual       NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_creacion       TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP     DEFAULT NOW()
);

COMMENT ON COLUMN acciones_balances.id IS 'Clave natural {AAAA-MM} (p. ej. 2026-07)';
COMMENT ON COLUMN acciones_balances.mes IS 'Fecha mes-año en una sola columna (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN acciones_balances.valor_total IS 'Valor total de la cartera de acciones a final de mes';
COMMENT ON COLUMN acciones_balances.aporte_mensual IS 'Importe añadido ese mes (el aporte extra; puede ser 0)';
COMMENT ON COLUMN acciones_balances.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN acciones_balances.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

### Endpoints

| Método | Path | Body / Query params | Uso |
|---|---|---|---|
| POST | `/acciones/balances` | `AccionBalanceRequest` (mes, valor_total, aporte_mensual) | Crear o actualizar el balance de un mes (upsert por `mes`) |
| GET | `/acciones/balances` | `limit` (opcional con default), `order` (`asc`/`desc` por `mes`, opcional) | Listar los N últimos/primeros meses |
| PUT | `/acciones/balances/{id}` | `AccionBalanceRequest` (mes, valor_total, aporte_mensual) | Actualizar el balance de un mes (`{AAAA-MM}`) |
| DELETE | `/acciones/balances/{id}` | — | Eliminar el balance de un mes (`{AAAA-MM}`) |

## Reglas de diseño

- Enum de dominio: `EstadoOperacion { abierta, cerrada }` en `domain/enums/`.
- Modelos de dominio: `OperacionAccion` (id, cuentaId, nombreActivo, tipoActivo, fechaCompra, cantidad, precioUnitarioCompra, costeTotalCompra, fechaVenta, precioUnitarioVenta, cantidadRecibida, gananciaPerdida, estado + fechas) y `AccionBalance` (id, mes, valorTotal, aporteMensual + fechas).
- Entidades JPA: `OperacionAccionMO` (`@Table(name = "operaciones_inversion")`) y `AccionBalanceMO` (`@Table(name = "acciones_balances")`).
- La operación tiene FK a `cuentas` (`@ManyToOne(fetch = FetchType.LAZY)` + columna duplicada `cuenta_id` para leer el id como String): sí reutiliza el catálogo genérico de cuentas (la cuenta del broker).
- `mes` inmutable en el `UPDATE` del balance; en las operaciones, el `UPDATE` sirve para cerrar la venta (estado → `cerrada`).
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `OperacionAccion`, `AccionBalance` (domain models), `OperacionAccionDrivingPort`/`AccionBalanceDrivingPort`, `OperacionAccionUseCase`/`AccionBalanceUseCase`, `OperacionAccionDrivenPort`/`AccionBalanceDrivenPort`.
- **Capa driven**: `OperacionAccionMO`, `AccionBalanceMO`, `OperacionAccionRepository`, `AccionBalanceRepository`, `OperacionAccionDatasourceAdapter`/`AccionBalanceDatasourceAdapter`, `OperacionAccionDatasourceMapper`/`AccionBalanceDatasourceMapper`.
- **Capa driving**: controladores implementando las APIs de swagger, `OperacionAccionApiMapper`/`AccionBalanceApiMapper`.
- **Swagger**: nuevos schemas y paths para `OperacionAccion` y `AccionBalance`.
- **Flyway**: `operaciones_inversion` ya existe desde `V5` (con la estructura anterior, réplica de la de arriba). Si se mantienen esos campos no hace falta migración para operaciones; nueva migración `V23__create_acciones_balances.sql` para `acciones_balances`.
- **Tests**: no hay IT específico; `V16` soltó las posiciones pero mantuvo `operaciones_inversion`. Se podrá crear un `AccionesIT` para el CRUD de operaciones y del balance mensual.