# Entidad: Nómina — Ingreso del mes

> **Implementado:** `true` (ingreso del mes)

Ingreso mensual recibido (nómina). Una única fila por mes: la cantidad neta ingresada ese mes y una nota opcional. Es la fuente del **"Ingresos del mes"** que muestra la vista mensual.

> **Alcance actual:** este documento cubre **únicamente el ingreso del mes**: registrarlo y consultarlo contra `/nomina`. La distribución del sueldo entre plataformas, la planificación y los compromisos son conceptos distintos, sin backend, y quedan fuera de este documento.

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
- El importe es el dato que consume la pantalla: la distribución del sueldo lo lee como "sueldo del mes" y la vista mensual lo muestra como "Ingresos".
- La vista mensual obtiene el total de ingresos del mes como `cantidad` de este endpoint (una fila por mes, sin sumatorio).
- Modelo de dominio: `Nomina` (`mes, cantidad, nota` + auditoría), `cantidad` en `BigDecimal`.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Frontend (pantalla de Nómina)

La pantalla `/income` muestra la pestaña **Distribución Mensual** con un selector de mes y año y dos formularios: el **ingreso del mes** y la **distribución del sueldo**.

### Selector de mes y año

- La pestaña se abre con el mes y año en curso (signals globales `currentMonth` / `currentYear`) y permite cambiarlos con dos desplegables.
- El mes/año seleccionado se pasa como `input` a los dos formularios (ingreso y distribución); ambos recargan al cambiar de mes/año.

### Formulario "Añadir Ingreso" (`IncomeFormComponent`)

- Al entrar (y cada vez que cambia el mes/año) hace `GET /nomina?mes=YYYY-MM` (`loadNomina`). El resultado queda cacheado por mes en memoria (señal `Map<mes, Nomina|null>`), así que al volver a un mes ya consultado no se rellama al backend.
- **Mes sin nómina** (el backend responde 404 → `null`): el botón muestra **"Añadir Nomina"** y los campos `Cantidad` y `Nota` quedan a `0`/vacío.
- **Mes con nómina**: el botón muestra **"Modificar Nomina"** y los campos se **precargan** con la `cantidad` y la `nota` guardadas.
- Al guardar, `saveNomina` decide el método solo: **`POST /nomina`** si el mes no existía en caché, **`PUT /nomina/{mes}`** si ya existía (upsert en el front).
- Tras guardar: mensaje "Ingreso añadido correctamente" durante 2 segundos y el botón pasa a "Modificar Nomina". La `cantidad` y la `nota` **se mantienen** en el formulario (no se resetean), para poder ajustar el dato sin volver a teclearlo.
- El botón de guardar está deshabilitado si `Cantidad` es `0`.

### Distribución del Sueldo (`SalaryDistributionComponent`)

- El campo **"Sueldo neto del mes"** es de **solo lectura** y sale de la `cantidad` de la nómina del mes seleccionado (`getNomina`): a `0` si ese mes no tiene nómina guardada. Hace `loadNomina` al entrar y al cambiar de mes/año para que el campo esté al día.
- La **barra de progreso** calcula, sobre ese sueldo:
  - *Asignado* = suma de las distribuciones del mes: las de tipo fijo (`€`) suman su valor; las de porcentaje (`%`) suman `sueldo × valor / 100`.
  - *% asignado* = `redondeo(asignado / sueldo × 100)` (solo si sueldo > 0; si no, 0 %).
  - *Restante* = `sueldo − asignado`.

## Capas de implementación previstas (backend)

- **Capa de aplicación**: `Nomina` (domain model), `NominaDrivingPort`, `NominaUseCase`, `NominaDrivenPort`.
- **Capa driven**: `NominaMO`, `NominaRepository`, `NominaDatasourceAdapter`, `NominaDatasourceMapper`.
- **Capa driving**: `NominaController` implementando `NominaApi` (swagger), `NominaApiMapper`.
- **Swagger**: paths `/nomina` y schemas `Nomina`, `NominaRequest`, `NominaResponse` (tag `Nomina`).
- **Flyway**: migración nueva `V{next}__create_nominas.sql` (tabla `nominas`).
- **Tests**: `NominaIT` para la entidad.