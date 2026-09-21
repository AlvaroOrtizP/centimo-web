# Entidad: BancoBalance — Balance mensual por banco

> **Implementado:** `false`

Entidad dedicada a los bancos (BBVA, CaixaBank...). Una fila por banco y mes: el balance a final de mes y el aporte hecho ese mes. No hay bloque de Hacienda (se mantiene simple, estilo `mintos` pero sin retenciones).

## Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | Clave natural `{entidad}-{AAAA-MM}` (p. ej. `bbva-2026-07`) |
| `entidad` | VARCHAR(50) | Banco al que pertenece el balance (p. ej. `bbva`, `caixabank`) |
| `mes` | VARCHAR(7) | Fecha mes-año en **una sola columna** (formato `YYYY-MM`) |
| `balance_mensual` | NUMERIC(12,2) | Balance del banco a final de mes (el valor final) |
| `aporte_mensual` | NUMERIC(12,2) | Importe añadido ese mes (el aporte extra; puede ser 0) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

## Identificador

Fila única por `(entidad, mes)` ⇒ **clave natural legible `{entidad}-{AAAA-MM}`** (p. ej. `bbva-2026-07`).

- Resta leer en logs y URLs (`/banco/balances/bbva-2026-07`).
- Compatible con la convención `VARCHAR(50)` del proyecto.
- Se refuerza con `UNIQUE(entidad, mes)` como red de seguridad.

**Decidido:** identificador natural `{entidad}-{AAAA-MM}`.

## Esquema de la tabla

```sql
CREATE TABLE banco_balances (
  id                   VARCHAR(50)   PRIMARY KEY,
  entidad              VARCHAR(50)   NOT NULL,
  mes                  VARCHAR(7)    NOT NULL,
  balance_mensual      NUMERIC(12,2) NOT NULL,
  aporte_mensual       NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_creacion       TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP     DEFAULT NOW(),
  UNIQUE(entidad, mes)
);

CREATE INDEX idx_banco_balances_mes ON banco_balances(mes);

COMMENT ON COLUMN banco_balances.id IS 'Clave natural {entidad}-{AAAA-MM} (p. ej. bbva-2026-07)';
COMMENT ON COLUMN banco_balances.entidad IS 'Banco al que pertenece el balance (p. ej. bbva, caixabank)';
COMMENT ON COLUMN banco_balances.mes IS 'Fecha mes-año en una sola columna (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN banco_balances.balance_mensual IS 'Balance del banco a final de mes (el valor final)';
COMMENT ON COLUMN banco_balances.aporte_mensual IS 'Importe añadido ese mes (el aporte extra; puede ser 0)';
COMMENT ON COLUMN banco_balances.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN banco_balances.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

> **Pendiente:** las entidades bancarias lanzan promociones (p. ej. remuneración alta durante X meses). Previsiblemente hará falta algún campo para registrarlas (p. ej. una `nota` o un identificador de promoción). Por ahora se mantiene simple; cuando se concrete, se añadirá como columna nueva.

## Endpoints

### Guardar balance de un banco (POST)

Un único endpoint para guardar el balance de un banco en un mes (upsert por `(entidad, mes)`).

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/banco/balances` | `BancoBalanceRequest` (entidad, mes, balance_mensual, aporte_mensual) | Crear o actualizar el balance de un banco en un mes |

### Listar balances (GET, paginado)

Obtener la lista de balances, filtrada por banco y ordenada con un número máximo de registros.

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/banco/balances` | `entidad` (obligatorio), `limit` (nº registros, opcional con default), `order` (`asc`/`desc` por `mes`, opcional) | Listar los N últimos/primeros meses de un banco |

### Actualizar un balance (PUT)

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/banco/balances/{id}` | `BancoBalanceRequest` (entidad, mes, balance_mensual, aporte_mensual) | Actualizar el balance de un banco en un mes (`{entidad}-{AAAA-MM}`) |

### Eliminar un balance (DELETE)

| Método | Path | Uso |
|---|---|---|
| DELETE | `/banco/balances/{id}` | Eliminar el balance de un banco en un mes (`{entidad}-{AAAA-MM}`) |

## Reglas de diseño

- Modelo de dominio: `BancoBalance` (`id, entidad, mes, balanceMensual, aporteMensual` + fechas), con `mes` de tipo `String` (`YYYY-MM`).
- Entidad JPA: `BancoBalanceMO` (`@Table(name = "banco_balances")`).
- Sin FK a `cuentas` ni a `plataformas`: la `entidad` es un texto establecido por el front (bbva, caixabank...), no reutiliza el catálogo genérico.
- `mes` inmutable en el `UPDATE`: solo se actualizan `balance_mensual` y `aporte_mensual`.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `BancoBalance` (domain model), `BancoBalanceDrivingPort`, `BancoBalanceUseCase`, `BancoBalanceDrivenPort`.
- **Capa driven**: `BancoBalanceMO`, `BancoBalanceRepository`, `BancoBalanceDatasourceAdapter`, `BancoBalanceDatasourceMapper`.
- **Capa driving**: controlador implementando `BancoBalanceApi` (swagger), `BancoBalanceApiMapper`.
- **Swagger**: nuevos schemas y paths para la entidad (CRUD de `BancoBalance`).
- **Flyway**: nueva migración `V22__create_banco_balances.sql`.
- **Tests**: no hay IT específico de esta entidad. Hay IT de pantallas bancarias (`BancoIT` sobre BBVA/CaixaBank con snapshots); se podrá ampliar con un `BancoBalanceIT` para el CRUD mensual.