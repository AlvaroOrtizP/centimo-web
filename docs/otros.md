# Funcionalidad de Otros Productos — Centimo

Documentación de crowdlending e inversiones en fondos indexados de MyInvestor.

---

## 1. Visión general

Dos tipos de inversión especializada con su propio seguimiento:

| Producto | Plataformas | Qué se trackea |
|---|---|---|
| **Crowdlending** | Mintos, Equito, Urbanitae | Préstamos individuales: capital, interés, plazo, retornos |
| **Fondos indexados** | MyInvestor | Fondos por ISIN: aportaciones mensuales y balance acumulado |

---

## 2. Tablas de backend

### 2.1 `crowdlending_inversions`

Inversiones en proyectos de crowdlending (préstamos P2P o inmobiliarios).

```sql
CREATE TABLE crowdlending_investments (
  id               VARCHAR(50)    PRIMARY KEY,
  platform_id      VARCHAR(50)    NOT NULL REFERENCES platforms(id),
  project_name     VARCHAR(200)   NOT NULL,
  invested_amount  NUMERIC(10,2)  NOT NULL,
  interest_rate    NUMERIC(5,2)   NOT NULL,   -- ej: 8.5 = 8.5%
  term_months      INTEGER        NOT NULL,
  start_date       DATE           NOT NULL,
  end_date         DATE,
  monthly_return   NUMERIC(10,2)  NOT NULL,
  total_returned   NUMERIC(10,2)  NOT NULL DEFAULT 0,
  status           VARCHAR(20)    NOT NULL,   -- active | completed | defaulted
  created_at       TIMESTAMP      DEFAULT NOW(),
  updated_at       TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_crowdlending_platform ON crowdlending_investments(platform_id);
CREATE INDEX idx_crowdlending_status   ON crowdlending_investments(status);
```

**Lógica de negocio:**
- `interest_rate` — tipo de interés anual (ej: 8.5%)
- `monthly_return` — retorno mensual estimado en €
- `total_returned` — acumulado de lo devuelto hasta la fecha
- `status`:
  - `active` — préstamo activo, generando retornos
  - `completed` — préstamo devuelto íntegramente
  - `defaulted` — impago (pérdida)

### 2.2 `myinvestor_funds`

Fondos indexados de MyInvestor (catálogo maestro).

```sql
CREATE TABLE myinvestor_funds (
  id         VARCHAR(50)  PRIMARY KEY,
  code       VARCHAR(20)  NOT NULL UNIQUE,  -- ISIN del fondo
  name       VARCHAR(200) NOT NULL,
  created_at TIMESTAMP    DEFAULT NOW()
);
```

### 2.3 `fund_balances`

Balance mensual de cada fondo. Un fondo puede tener múltiples registros (uno por mes).

```sql
CREATE TABLE fund_balances (
  id         VARCHAR(50)    PRIMARY KEY,
  fund_id    VARCHAR(50)    NOT NULL REFERENCES myinvestor_funds(id) ON DELETE CASCADE,
  year       INTEGER        NOT NULL,
  month      INTEGER        NOT NULL CHECK (month BETWEEN 1 AND 12),
  balance    NUMERIC(12,2)  NOT NULL,
  created_at TIMESTAMP      DEFAULT NOW(),
  UNIQUE(fund_id, year, month)
);

CREATE INDEX idx_fund_balances_date ON fund_balances(year, month);
CREATE INDEX idx_fund_balances_fund ON fund_balances(fund_id);
```

**Constraint UNIQUE:** no puede haber dos registros para el mismo fondo, año y mes.

---

## 3. Relaciones entre tablas

```
┌────────────┐       ┌──────────────────────────┐
│ platforms  │──1:N──│ crowdlending_investments  │
│            │       │ project_name, status      │
└────────────┘       └──────────────────────────┘

┌──────────────────┐       ┌─────────────────┐
│ myinvestor_funds │──1:N──│ fund_balances   │
│ code (ISIN)      │       │ year, month,    │
│                  │       │ balance         │
└──────────────────┘       └─────────────────┘
```

---

## 4. Cálculo del balance total de fondos

`getTotalFundBalanceForMonth(year, month)` suma los balances de todos los fondos en un mes dado:

```sql
SELECT SUM(fb.balance) AS total_fund_balance
FROM fund_balances fb
WHERE fb.year = :year AND fb.month = :month;
```

---

## 5. Endpoints resumidos

Ver `docs/swagger.yaml` para el detalle completo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/crowdlending?platformId` | Listar inversiones crowdlending |
| `POST` | `/crowdlending` | Crear inversión crowdlending |
| `DELETE` | `/crowdlending/{id}` | Eliminar inversión crowdlending |
| `GET` | `/myinvestor-funds` | Listar fondos |
| `GET` | `/myinvestor-funds/{id}` | Obtener fondo |
| `POST` | `/myinvestor-funds` | Crear fondo |
| `PUT` | `/myinvestor-funds/{id}` | Actualizar fondo |
| `DELETE` | `/myinvestor-funds/{id}` | Eliminar fondo |
| `GET` | `/fund-balances?year&month` | Listar balances del mes |
| `POST` | `/fund-balances` | Crear balance |
| `PUT` | `/fund-balances/{id}` | Actualizar balance |
| `DELETE` | `/fund-balances/{id}` | Eliminar balance |

---

## 6. Enums

### ProjectStatus
`active` · `completed` · `defaulted`
