# Entidad: Gasto — Gastos mensuales

> **Implementado:** `false`

Entidad dedicada a los gastos. Una fila por gasto realizado, ligada a una instantánea mensual: qué se gastó, en qué categoría, cuándo y por qué importe.

## Datos que guarda

Todos los campos son `NOT NULL` salvo `descripcion` y los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID generado por la aplicación |
| `instantanea_id` | VARCHAR(50) FK | Instantánea mensual a la que pertenece el gasto (`instantaneas_mensuales.id`, `ON DELETE CASCADE`) |
| `categoria` | VARCHAR(20) | Categoría del gasto (enum `ExpenseCategory`) |
| `cantidad` | NUMERIC(10,2) | Importe del gasto |
| `fecha` | DATE | Fecha del gasto |
| `descripcion` | TEXT | Nota opcional (nullable) |
| `fecha_creacion` | TIMESTAMP | Auditoría |

## Identificador

Clave de aplicación (UUID, `VARCHAR(50)`), como el resto de entidades con FKs del proyecto. No hay clave natural: el gasto pertenece a una instantánea (`instantanea_id`) y se identifica por su UUID.

- Compatible con la convención `VARCHAR(50)` del proyecto.
- FK con `ON DELETE CASCADE`: si se elimina la instantánea se eliminan sus gastos.
- Índice sobre `instantanea_id` para las consultas por snapshot.

## Esquema de la tabla

```sql
CREATE TABLE gastos (
  id                  VARCHAR(50)    PRIMARY KEY,
  instantanea_id      VARCHAR(50)    NOT NULL REFERENCES instantaneas_mensuales(id) ON DELETE CASCADE,
  categoria           VARCHAR(20)    NOT NULL,
  cantidad            NUMERIC(10,2)  NOT NULL,
  fecha               DATE           NOT NULL,
  descripcion         TEXT,
  fecha_creacion      TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_gastos_instantanea ON gastos(instantanea_id);

COMMENT ON COLUMN gastos.id IS 'UUID generado por la aplicación';
COMMENT ON COLUMN gastos.instantanea_id IS 'Instantánea mensual a la que pertenece el gasto (instantaneas_mensuales.id, ON DELETE CASCADE)';
COMMENT ON COLUMN gastos.categoria IS 'Categoría del gasto (ExpenseCategory)';
COMMENT ON COLUMN gastos.cantidad IS 'Importe del gasto';
COMMENT ON COLUMN gastos.fecha IS 'Fecha del gasto';
COMMENT ON COLUMN gastos.descripcion IS 'Nota opcional (nullable)';
COMMENT ON COLUMN gastos.fecha_creacion IS 'Auditoría: fecha de creación';
```

## Endpoints

### Crear gasto (POST)

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/expenses` | `ExpenseCreate` (snapshotId, category, amount, date, description) | Crear un gasto. Si no existe la instantánea del `snapshotId` para su fecha, se crea. Incrementa el campo `expenses` de la instantánea |

### Listar gastos (GET, ordenable)

Obtener la lista de gastos de una instantánea o de un periodo, ordenada por `fecha`.

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/expenses` | `snapshotId` (lista por instantánea) *o* `year` + `month` (lista por periodo), `order` (`asc`/`desc` por `fecha`, opcional) | Listar gastos ordenados |

### Actualizar gasto (PUT)

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/expenses/{id}` | `ExpenseUpdate` (snapshotId, category, amount, date, description) | Actualizar un gasto. Recalcula `expenses` de la instantánea: resta el importe anterior y suma el nuevo |

### Eliminar gasto (DELETE)

| Método | Path | Query params | Uso |
|---|---|---|---|
| DELETE | `/expenses/{id}` | `snapshotId` (obligatorio) | Eliminar un gasto. Decrementa el campo `expenses` de la instantánea asociada |

## Reglas de diseño

- Categoría en el dominio como enum `ExpenseCategory { Aseo, Coche, Comida, Discord, Ejercicio, Hacienda, Medicamento, Ocio, Otros, Trabajo }`.
- Modelo de dominio: `Gasto` (`id, instantaneaId, categoria, cantidad, fecha, descripcion` + `fechaCreacion`), con `cantidad` en `BigDecimal` y `fecha` en `LocalDate`.
- Entidad JPA: `GastoMO` (`@Table(name = "gastos")`); FK `instantanea` con `@ManyToOne(fetch = FetchType.LAZY)` + columna duplicada `instantanea_id` para leer el id como String.
- Al crear/actualizar/eliminar un gasto se mantiene consistente el acumulado `expenses` de la instantánea mensual.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `Gasto` (domain model), `GastoDrivingPort`, `GastoUseCase`, `GastoDrivenPort`.
- **Capa driven**: `GastoMO`, `GastoRepository`, `GastoDatasourceAdapter`, `GastoDatasourceMapper`.
- **Capa driving**: `GastoController` implementando `ExpensesApi` (swagger), `GastoApiMapper`.
- **Swagger**: paths `/expenses` y schemas `Expense`, `ExpenseCreate`, `ExpenseUpdate` (familia `Expenses`).
- **Flyway**: migración `V4__create_gastos_ingresos_tareas.sql` (tabla `gastos`).
- **Tests**: `GastoIT` para la entidad.