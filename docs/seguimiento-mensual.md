# Funcionalidad de Seguimiento Mensual — Centimo

Documentación del registro mensual de finanzas: snapshots, gastos e ingresos.

---

## 1. Visión general

Cada mes, el usuario registra el estado de sus cuentas mediante **snapshots**. Cada snapshot puede desglosarse en **gastos** e **ingresos** detallados.

| Vista | Ruta | Qué muestra |
|---|---|---|
| **Vista Mensual** | `/month/:year/:month` | Resumen del mes: balance, ingresos, gastos, desglose por cuenta, gráfico de categorías |
| **Dashboard** | `/` | KPIs del mes actual, evolución patrimonial, gastos acumulados |
| **Entrada Datos** | `/entry/:platformId` | Formulario para registrar gastos, trades e ingresos por plataforma |

---

## 2. Tablas de backend

### 2.1 `monthly_snapshots`

Registro mensual del estado de una cuenta. Es la entidad central de la app.

```sql
CREATE TABLE monthly_snapshots (
  id            VARCHAR(50)    PRIMARY KEY,
  account_id    VARCHAR(50)    NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year          INTEGER        NOT NULL,
  month         INTEGER        NOT NULL CHECK (month BETWEEN 1 AND 12),
  balance       NUMERIC(12,2)  NOT NULL DEFAULT 0,
  income        NUMERIC(10,2)  NOT NULL DEFAULT 0,
  expenses      NUMERIC(10,2)  NOT NULL DEFAULT 0,
  contribution  NUMERIC(10,2),
  notes         TEXT,
  created_at    TIMESTAMP      DEFAULT NOW(),
  updated_at    TIMESTAMP      DEFAULT NOW(),
  UNIQUE(account_id, year, month)
);

CREATE INDEX idx_snapshots_account ON monthly_snapshots(account_id);
CREATE INDEX idx_snapshots_date    ON monthly_snapshots(year, month);
```

**Lógica de negocio:**
- `balance` — saldo total de la cuenta al cierre del mes
- `income` — suma de los ingresos del mes (se actualiza incrementalmente al añadir/eliminar `income_source`)
- `expenses` — suma de los gastos del mes (se actualiza incrementalmente al añadir/eliminar `expense`)
- `contribution` — aportación adicional (opcional)
- Convención de ID: `"{accountId}-{year}-{mm}"` (ej: `"bbva-checking-2026-06"`)

**Constraint UNIQUE:** no puede haber dos snapshots para la misma cuenta, año y mes.

### 2.2 `checklist_items` (embebido o tabla separada)

Lista de tareas pendientes del mes. En el mock está embebido en el JSON del snapshot.

```sql
-- Opción A: tabla separada (recomendada para backend)
CREATE TABLE checklist_items (
  id           VARCHAR(50)  PRIMARY KEY,
  snapshot_id  VARCHAR(50)  NOT NULL REFERENCES monthly_snapshots(id) ON DELETE CASCADE,
  text         VARCHAR(200) NOT NULL,
  checked      BOOLEAN      NOT NULL DEFAULT FALSE,
  "order"      INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_checklist_snapshot ON checklist_items(snapshot_id);
```

```typescript
// Opción B: embebido en el JSON del snapshot (como en el mock)
interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// En MonthlySnapshot:
checklistItems?: ChecklistItem[];
```

### 2.3 `expenses`

Gastos del mes categorizados, vinculados a un snapshot.

```sql
CREATE TABLE expenses (
  id           VARCHAR(50)    PRIMARY KEY,
  snapshot_id  VARCHAR(50)    NOT NULL REFERENCES monthly_snapshots(id) ON DELETE CASCADE,
  category     VARCHAR(20)    NOT NULL,
  amount       NUMERIC(10,2)  NOT NULL,
  date         DATE           NOT NULL,
  description  TEXT,
  created_at   TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_expenses_snapshot ON expenses(snapshot_id);
CREATE INDEX idx_expenses_category ON expenses(category);
```

**Efecto colateral al eliminar:** al borrar un expense, se decrementa automáticamente `monthly_snapenses.expenses` del snapshot asociado.

### 2.4 `income_sources`

Ingresos detallados del mes, vinculados a un snapshot.

```sql
CREATE TABLE income_sources (
  id           VARCHAR(50)    PRIMARY KEY,
  snapshot_id  VARCHAR(50)    NOT NULL REFERENCES monthly_snapshots(id) ON DELETE CASCADE,
  source       VARCHAR(50)    NOT NULL,
  description  VARCHAR(200)   NOT NULL,
  amount       NUMERIC(10,2)  NOT NULL,
  created_at   TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_incomes_snapshot ON income_sources(snapshot_id);
```

**Efecto colateral al eliminar:** al borrar un income, se decrementa automáticamente `monthly_snapshots.income` del snapshot asociado.

---

## 3. Relaciones entre tablas

```
┌──────────────────┐
│     accounts     │
│ id, platform_id  │
└────────┬─────────┘
         │ 1:N (account_id)
         ▼
┌──────────────────┐       ┌──────────────┐
│ monthly_snapshots │──1:N──│   expenses   │
│ balance, income, │       │ category,    │
│ expenses         │       │ amount, date │
└────────┬─────────┘       └──────────────┘
         │
         ├──1:N──┌──────────────────┐
         │       │  income_sources  │
         │       │ source, amount   │
         │       └──────────────────┘
         │
         └──1:N──┌──────────────────┐
                 │ checklist_items  │
                 │ text, checked    │
                 └──────────────────┘
```

---

## 4. Lógica de `upsertSnapshot`

El endpoint `POST /snapshots/upsert` busca un snapshot existente por `(accountId, year, month)`:

| Caso | Comportamiento |
|---|---|
| **Existe** | Actualiza `balance` y aplica `incomeDelta` de forma incremental (`income += incomeDelta`) |
| **No existe** | Crea uno nuevo con los datos proporcionados |

Esto permite registrar ingresos de forma incremental sin perder el estado anterior.

---

## 5. Endpoints resumidos

Ver `docs/swagger.yaml` para el detalle completo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/snapshots?year&month&accountId` | Listar snapshots (filtros opcionales) |
| `GET` | `/snapshots/{id}` | Obtener snapshot |
| `POST` | `/snapshots` | Crear snapshot |
| `POST` | `/snapshots/upsert` | Crear o actualizar (upsert) |
| `PUT` | `/snapshots/{id}` | Actualizar snapshot |
| `DELETE` | `/snapshots/{id}` | Eliminar snapshot |
| `POST` | `/snapshots/{snapshotId}/checklist/{itemId}/toggle` | Alternar checklist item |
| `GET` | `/expenses?snapshotId` | Listar gastos del snapshot |
| `POST` | `/expenses` | Crear gasto |
| `DELETE` | `/expenses/{id}?snapshotId` | Eliminar gasto (decrementa expenses del snapshot) |
| `GET` | `/incomes?snapshotId` | Listar ingresos del snapshot |
| `POST` | `/incomes` | Crear ingreso |
| `DELETE` | `/incomes/{id}?snapshotId` | Eliminar ingreso (decrementa income del snapshot) |

---

## 6. Enums

### ExpenseCategory
`aseo` · `coche` · `comida` · `discord` · `ejercicio` · `hacienda` · `medicamento` · `ocio` · `otros` · `trabajo`
