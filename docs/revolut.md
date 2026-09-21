# Entidad: RevolutBalance — Balance mensual de Revolut

> **Implementado:** `false`

Entidad dedicada a Revolut. Una fila por mes: el dinero que hay en Revolut en cada mes, junto con el aporte que se hace ese mes.

## Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | Clave natural `{AAAA-MM}` (p. ej. `2026-07`) |
| `mes` | VARCHAR(7) | Fecha mes-año en **una sola columna** (formato `YYYY-MM`) |
| `balance_mensual` | NUMERIC(12,2) | Dinero en Revolut en el mes |
| `aporte_mensual` | NUMERIC(12,2) | Aporte que se hace ese mes (puede ser 0) |
| `dinero_total` | NUMERIC(12,2) | Dinero total que da Revolut en el mes (intereses generados) |
| `dinero_hacienda` | NUMERIC(12,2) | Dinero que se queda Hacienda |
| `dinero_final` | NUMERIC(12,2) | Dinero que finalmente te llega (después de Hacienda) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

## Identificador

Fila única por `mes` ⇒ **clave natural legible `{AAAA-MM}`** (p. ej. `2026-07`), como `b100_balances` pero sin subcuentas (un solo tipo).

- Resta leer en logs y URLs (`/revolut-balances/2026-07`).
- Inmutable por construcción (deriva de campos que no cambian).
- Compatible con la convención `VARCHAR(50)` del proyecto.
- Se refuerza con `UNIQUE(mes)` como red de seguridad.

**Decidido:** identificador natural `{AAAA-MM}`.

## Esquema de la tabla

```sql
CREATE TABLE revolut_balances (
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

COMMENT ON COLUMN revolut_balances.id IS 'Clave natural {AAAA-MM} (p. ej. 2026-07)';
COMMENT ON COLUMN revolut_balances.mes IS 'Fecha mes-año en una sola columna (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN revolut_balances.balance_mensual IS 'Dinero en Revolut en el mes';
COMMENT ON COLUMN revolut_balances.aporte_mensual IS 'Aporte que se hace ese mes (puede ser 0)';
COMMENT ON COLUMN revolut_balances.dinero_total IS 'Dinero total que da Revolut en el mes (intereses generados)';
COMMENT ON COLUMN revolut_balances.dinero_hacienda IS 'Dinero que se queda Hacienda';
COMMENT ON COLUMN revolut_balances.dinero_final IS 'Dinero que finalmente te llega (después de Hacienda)';
COMMENT ON COLUMN revolut_balances.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN revolut_balances.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

## Endpoints

### Guardar balance de un mes (POST)

Un único endpoint para guardar el balance de un mes. El front lo llama una vez por mes.

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/revolut-balances` | `RevolutBalanceRequest` (mes, balance_mensual, aporte_mensual, dinero_total, dinero_hacienda, dinero_final) | Crear o actualizar el balance de un mes (upsert por `mes`) |

### Listar balances (GET, paginado)

Obtener la lista de balances, ordenada y con un número máximo de registros (estilo paginado por límite/orden).

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/revolut-balances` | `limit` (nº registros, opcional con default), `order` (`asc`/`desc` por `mes`, opcional) | Listar los N últimos/primeros meses |

### Actualizar un balance (PUT)

Actualizar los campos de un balance existente, localizado por su id (`{AAAA-MM}`).

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/revolut-balances/{id}` | `RevolutBalanceRequest` (mes, balance_mensual, aporte_mensual, dinero_total, dinero_hacienda, dinero_final) | Actualizar el balance de un mes (`{AAAA-MM}`) |

### Eliminar un balance (DELETE)

Eliminar un balance existente, localizado por su id (`{AAAA-MM}`).

| Método | Path | Uso |
|---|---|---|
| DELETE | `/revolut-balances/{id}` | Eliminar el balance de un mes (`{AAAA-MM}`) |

## Reglas de diseño

- Modelo de dominio: `RevolutBalance` (`id, mes, balanceMensual, aporteMensual, dineroTotal, dineroHacienda, dineroFinal` + fechas), con `mes` de tipo `String` (`YYYY-MM`).
- Entidad JPA: `RevolutBalanceMO` (`@Table(name = "revolut_balances")`).
- Sin FK a `cuentas`: el balance es propio de Revolut, no reutiliza el catálogo genérico de cuentas.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `RevolutBalance` (domain model), `RevolutBalanceDrivingPort`, `RevolutBalanceUseCase`, `RevolutBalanceDrivenPort`.
- **Capa driven**: `RevolutBalanceMO`, `RevolutBalanceRepository`, `RevolutBalanceDatasourceAdapter`, `RevolutBalanceDatasourceMapper`.
- **Capa driving**: controlador implementando `RevolutBalanceApi` (swagger), `RevolutBalanceApiMapper`.
- **Swagger**: nuevos schemas y paths para la entidad (CRUD de `RevolutBalance`).
- **Flyway**: nueva migración `V18__create_revolut_balances.sql`.
- **Tests**: no hay IT específico del CRUD de esta entidad. `RevolutIT` cubre la pantalla de la plataforma Revolut (plataforma + cuenta + instantáneas mensuales), no el CRUD mensual de balances.