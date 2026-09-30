# Entidad: Nómina — Ingreso del mes

> **Implementado:** `true` (ingreso del mes)

Ingreso mensual recibido (nómina). Una única fila por mes: la cantidad neta ingresada ese mes y una nota opcional. Es la fuente del **"Ingresos del mes"** que muestra la vista mensual.

> **Alcance actual:** por ahora **solo se implementa el tema del ingreso** (registrar el ingreso del mes y consultarlo). La distribución del sueldo entre plataformas, la planificación y los compromisos siguen viviendo en el front (memoria local vía `SalaryDataService`) y quedan para una fase posterior.

## Datos que guarda

| Campo | Tipo | Descripción |
|---|---|---|
| `mes` | VARCHAR(7) PK | Mes del ingreso en una sola columna (`YYYY-MM`, p. ej. `2026-07`) |
| `cantidad` | NUMERIC(12,2) | Ingreso neto recibido ese mes (nómina) |
| `nota` | TEXT | Nota opcional (p. ej. el concepto) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

## Identificador

Una fila por mes ⇒ **clave natural `mes`** (`YYYY-MM`), como `b100`. No existe más de un ingreso por mes, por lo que la clave natural evita duplicados y queda legible en URLs (`/nomina/2026-07`).

**Decidido:** identificador natural `mes` (`YYYY-MM`).

## Esquema de la tabla

```sql
CREATE TABLE nominas (
  mes                  VARCHAR(7)    PRIMARY KEY,
  cantidad             NUMERIC(12,2) NOT NULL DEFAULT 0,
  nota                 TEXT,
  fecha_creacion       TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP     DEFAULT NOW()
);

COMMENT ON COLUMN nominas.mes IS 'Mes del ingreso (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN nominas.cantidad IS 'Ingreso neto recibido ese mes (nómina)';
COMMENT ON COLUMN nominas.nota IS 'Nota opcional (concepto)';
COMMENT ON COLUMN nominas.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN nominas.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

## Endpoints

### Guardar el ingreso del mes (POST, upsert)

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/nomina` | `NominaRequest` (`mes`, `cantidad`, `nota`) | Crear o actualizar el ingreso del mes (upsert por `mes`). Si ya existe ese mes, actualiza `cantidad` y `nota` |

### Consultar el ingreso de un mes (GET)

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/nomina` | `mes` (`YYYY-MM`, **obligatorio**) | Devolver el ingreso de ese mes (`NominaResponse`). **Es el endpoint que consume la vista mensual como "Ingresos del mes"** (ver `docs/vistaMensual.md`) |

### Actualizar / eliminar

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/nomina/{mes}` | `NominaRequest` (campos editables) | Actualizar el ingreso de un mes |
| DELETE | `/nomina/{mes}` | — | Eliminar el ingreso de un mes |

## Reglas de diseño

- **Una sola fila por mes**: no existe el concepto de "varios ingresos". El ingreso del mes es la nómina.
- `mes` en una sola columna `YYYY-MM`, coherente con `b100_balances` y con los endpoints de dashboard.
- **Solo el ingreso por ahora**: la distribución del sueldo (`SalaryAllocation`), la planificación y los compromisos (`Commitment`) no tienen backend en esta fase; siguen en memoria en el front y se podrán migrar después.
- La vista mensual obtiene el total de ingresos del mes como `cantidad` de este endpoint (una fila por mes, sin sumatorio).
- Modelo de dominio: `Nomina` (`mes, cantidad, nota` + auditoría), `cantidad` en `BigDecimal`.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Frontend

- **Pestaña Nómina** (`/income`): el formulario "Añadir Ingreso" (`IncomeFormComponent`) ya está preparado para consumir este endpoint: llama a `fetchNominaFromBackend(year, month)` y `createNomina({year, month, value, note})`, hoy comentados con `TODO(BACKEND)` en `incomes.service.ts`.
- Al implementar: `IncomeFormComponent` muestra "Modificar Nómina" cuando el mes ya tiene ingreso (hoy depende de la respuesta del backend) y el backend hace el upsert.
- La **Vista Mensual** usa este dato en la tarjeta "Ingresos" y en el desglose por fuente.

## Capas de implementación previstas

- **Capa de aplicación**: `Nomina` (domain model), `NominaDrivingPort`, `NominaUseCase`, `NominaDrivenPort`.
- **Capa driven**: `NominaMO`, `NominaRepository`, `NominaDatasourceAdapter`, `NominaDatasourceMapper`.
- **Capa driving**: `NominaController` implementando `NominaApi` (swagger), `NominaApiMapper`.
- **Swagger**: paths `/nomina` y schemas `Nomina`, `NominaRequest`, `NominaResponse` (tag `Nomina`).
- **Flyway**: migración nueva `V{next}__create_nominas.sql` (tabla `nominas`).
- **Tests**: `NominaIT` para la entidad.