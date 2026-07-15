# Funcionalidad de Configuración — Centimo

Documentación de la sección de configuración: plataformas, cuentas, distribuciones de sueldo y compromisos.

---

## 1. Visión general

La sección **Nómina** (`/income`) tiene cuatro pestañas:

| Pestaña | Qué hace |
|---|---|
| **Distribución Mensual** | Registrar ingresos y ver la distribución del sueldo para un mes concreto |
| **Configuración** | Planificar a 12 meses vista dónde se destina el sueldo |
| **Compromisos** | Gestionar pagos recurrentes y puntuales |
| **Alertas** | Crear avisos que se muestran en amarillo en la pestaña de Distribución Mensual |

---

## 2. Tablas de backend

### 2.1 `platforms`

Plataformas financieras (bancos, brokers, exchanges...).

```sql
CREATE TABLE platforms (
  id          VARCHAR(50)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL,  -- bank | investment | crypto | p2p | crowdlending
  color       VARCHAR(7)   NOT NULL,  -- hex (#004481)
  icon        VARCHAR(50)  NOT NULL,  -- Lucide icon name
  "order"     INTEGER      NOT NULL,
  fixed_notes TEXT,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_platforms_type ON platforms(type);
```

**Relaciones:**
- Una platform tiene N accounts (`accounts.platform_id → platforms.id`)
- Una platform es referenciada por N salary_allocations (`salary_allocations.platform_id → platforms.id`)

### 2.2 `accounts`

Cuentas dentro de una plataforma. Una plataforma puede tener varias cuentas (ej: B100 tiene 3).

```sql
CREATE TABLE accounts (
  id          VARCHAR(50)  PRIMARY KEY,
  platform_id VARCHAR(50)  NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL,  -- checking | savings | investment | pocket
  currency    VARCHAR(3)   NOT NULL DEFAULT 'EUR',
  "order"     INTEGER      NOT NULL,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_accounts_platform ON accounts(platform_id);
```

### 2.3 `salary_allocations`

Distribución del sueldo por mes y plataforma. Define cuánto va a cada destino.

```sql
CREATE TABLE salary_allocations (
  id          VARCHAR(50)    PRIMARY KEY,
  year        INTEGER        NOT NULL,
  month       INTEGER        NOT NULL CHECK (month BETWEEN 1 AND 12),
  platform_id VARCHAR(50)    NOT NULL REFERENCES platforms(id),
  type        VARCHAR(20)    NOT NULL,  -- fixed | percentage
  value       NUMERIC(10,2)  NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP      DEFAULT NOW(),
  updated_at  TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_sal_year_month ON salary_allocations(year, month);
CREATE INDEX idx_sal_platform   ON salary_allocations(platform_id);
```

**Lógica de negocio:**
- `type = 'fixed'` → `value` es una cantidad fija en € (ej: 100€ a B100)
- `type = 'percentage'` → `value` es un porcentaje del sueldo neto (ej: 30% a MyInvestor)
- Al crear desde la UI, se puede "aplicar a N meses" → el frontend crea una copia por cada mes

### 2.4 `commitments`

Compromisos de pago — gastos recurrentes o puntuales.

```sql
CREATE TABLE commitments (
  id            VARCHAR(50)    PRIMARY KEY,
  description   VARCHAR(200)   NOT NULL,
  month         INTEGER        NOT NULL CHECK (month BETWEEN 0 AND 12),
  year          INTEGER,                  -- solo para type = 'once'
  type          VARCHAR(20)    NOT NULL,  -- monthly | annual | once
  category      VARCHAR(50),              -- Impuestos | Suscripciones | Seguros | Trámites | Otros
  amount        NUMERIC(10,2),
  is_estimated  BOOLEAN        DEFAULT FALSE,
  created_at    TIMESTAMP      DEFAULT NOW(),
  updated_at    TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_commitments_type ON commitments(type);
CREATE INDEX idx_commitments_month ON commitments(month);
```

**Lógica de negocio por tipo:**

| type | month | year | Comportamiento |
|---|---|---|---|
| `monthly` | `0` | `null` | Aparece TODOS los meses. El campo month no se usa. |
| `annual` | `1-12` | `null` | Aparece solo en el mes indicado, cada año. |
| `once` | `1-12` | obligatorio | Aparece solo en el mes+año indicados. |

**Filtrado por mes** (`getCommitmentsByMonth(month)`):
```
monthly → SIEMPRE se incluye
annual  → solo si c.month = month
once    → solo si c.month = month AND (c.year = null OR c.year = currentYear)
```

### 2.5 `alerts`

Alertas que se muestran como aviso amarillo en la pestaña de Distribución Mensual (Nómina).

```sql
CREATE TABLE alerts (
  id          VARCHAR(50)  PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  month       INTEGER      NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER      NOT NULL,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_alerts_date ON alerts(year, month);
```

**Lógica de negocio:**
- Cada alerta se asocia a un mes+año concretos
- `getAlertsByMonth(year, month)` devuelve las alertas que coinciden exactamente con el mes indicado
- En la UI, si existe al menos una alerta para el mes actual (`currentYear`, `currentMonth`), se muestra un banner amarillo con la descripción de la primera alerta

---

## 3. Relaciones entre tablas

```
┌────────────┐       ┌────────────┐
│ platforms  │──1:N──│  accounts  │
│            │       └────────────┘
│            │
│            │──1:N──┌─────────────────────┐
│            │       │ salary_allocations   │
└────────────┘       │ platform_id → FK     │
                     │ year + month (índice) │
                     └─────────────────────┘

┌────────────┐
│commitments │  (entidad independiente, sin FK)
│ month = 0  │  → recurrente (monthly)
│ month > 0  │  → puntual (annual/once)
└────────────┘

┌────────────┐
│   alerts   │  (entidad independiente, sin FK)
│ year+month │  → alerta para ese mes concreto
└────────────┘
```

---

## 4. Endpoints resumidos

Ver `docs/swagger.yaml` para el detalle completo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/platforms` | Listar plataformas |
| `GET` | `/platforms/{id}` | Obtener plataforma |
| `POST` | `/platforms` | Crear plataforma |
| `PUT` | `/platforms/{id}` | Actualizar plataforma |
| `DELETE` | `/platforms/{id}` | Eliminar plataforma |
| `GET` | `/accounts` | Listar cuentas (filtro `?platformId=`) |
| `GET` | `/accounts/{id}` | Obtener cuenta |
| `POST` | `/accounts` | Crear cuenta |
| `PUT` | `/accounts/{id}` | Actualizar cuenta |
| `DELETE` | `/accounts/{id}` | Eliminar cuenta |
| `GET` | `/salary-allocations?year&month` | Distribuciones del mes |
| `POST` | `/salary-allocations` | Crear distribución |
| `PUT` | `/salary-allocations/{id}` | Actualizar distribución |
| `DELETE` | `/salary-allocations/{id}` | Eliminar distribución |
| `GET` | `/commitments` | Todos los compromisos |
| `GET` | `/commitments?month=` | Compromisos filtrados por mes |
| `POST` | `/commitments` | Crear compromiso |
| `GET` | `/commitments/{id}` | Obtener compromiso |
| `PUT` | `/commitments/{id}` | Actualizar compromiso |
| `DELETE` | `/commitments/{id}` | Eliminar compromiso |
| `GET` | `/alerts?year&month` | Listar alertas (filtros opcionales) |
| `POST` | `/alerts` | Crear alerta |
| `GET` | `/alerts/{id}` | Obtener alerta |
| `PUT` | `/alerts/{id}` | Actualizar alerta |
| `DELETE` | `/alerts/{id}` | Eliminar alerta |

---

## 5. Enums

### PlatformType
`bank` · `investment` · `crypto` · `p2p` · `crowdlending`

### AccountType
`checking` · `savings` · `investment` · `pocket`

### AllocationType
`fixed` · `percentage`

### CommitmentType
`monthly` · `annual` · `once`

### CommitmentCategory
`Impuestos` · `Suscripciones` · `Seguros` · `Trámites` · `Otros`
