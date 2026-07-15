# Funcionalidad de Inversiones — Centimo

Documentación de holdings (posiciones abiertas) y trades (operaciones de compra/venta).

---

## 1. Visión general

Las cuentas de inversión (eToro, Bitvavo, MyInvestor) tienen dos tipos de datos:

| Concepto | Qué es | Frecuencia |
|---|---|---|
| **Holdings** | Foto del estado de las posiciones abiertas | Mensual (cada snapshot) |
| **Trades** | Registro histórico de cada operación de compra/venta | Por operación |

| Vista | Ruta | Qué muestra |
|---|---|---|
| **Detalle Plataforma** | `/platform/:id` | Historial de balances, holdings actuales, trades recientes |
| **Trades** | `/trades` | Resumen de totales + tabla filtrable de todas las operaciones |

---

## 2. Tablas de backend

### 2.1 `investment_holdings`

Instantánea mensual de las posiciones abiertas. Cada holding pertenece a un snapshot.

```sql
CREATE TABLE investment_holdings (
  id              VARCHAR(50)    PRIMARY KEY,
  snapshot_id     VARCHAR(50)    NOT NULL REFERENCES monthly_snapshots(id) ON DELETE CASCADE,
  asset_name      VARCHAR(100)   NOT NULL,
  asset_type      VARCHAR(20)    NOT NULL,  -- crypto | stock | etf | index_fund | crowdlending
  quantity        NUMERIC(18,8)  NOT NULL,
  value_per_unit  NUMERIC(12,4)  NOT NULL,
  total_value     NUMERIC(12,2)  NOT NULL,
  created_at      TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_holdings_snapshot ON investment_holdings(snapshot_id);
CREATE INDEX idx_holdings_asset    ON investment_holdings(asset_name);
```

**Lógica de negocio:**
- `total_value = quantity × value_per_unit` (se almacena precalculado)
- Un holding representa una posición abierta; al vender, se cierra y aparece como trade con `status = 'closed'`
- Los holdings se actualizan cada mes al registrar el snapshot (reemplazan los del mes anterior)

### 2.2 `investment_transactions`

Registro histórico de cada operación de compra/venta. Es el libro de trades.

```sql
CREATE TABLE investment_transactions (
  id                  VARCHAR(50)    PRIMARY KEY,
  account_id          VARCHAR(50)    NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset_name          VARCHAR(100)   NOT NULL,
  asset_type          VARCHAR(20)    NOT NULL,  -- crypto | stock | etf | index_fund | crowdlending
  type                VARCHAR(10)    NOT NULL,  -- buy | sell

  -- Datos de compra
  buy_date            DATE           NOT NULL,
  buy_quantity        NUMERIC(18,8)  NOT NULL,
  buy_price_per_unit  NUMERIC(12,4)  NOT NULL,
  buy_total_cost      NUMERIC(12,2)  NOT NULL,

  -- Datos de venta (null si la posición sigue abierta)
  sell_date           DATE,
  sell_price_per_unit NUMERIC(12,4),
  sell_total_received NUMERIC(12,2),
  sell_quantity       NUMERIC(18,8),

  -- Resultado
  pnl                 NUMERIC(12,2),  -- sell_total_received - buy_total_cost
  status              VARCHAR(10)    NOT NULL DEFAULT 'open',  -- open | closed

  created_at          TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_trades_account ON investment_transactions(account_id);
CREATE INDEX idx_trades_asset   ON investment_transactions(asset_name);
CREATE INDEX idx_trades_status  ON investment_transactions(status);
```

**Lógica de negocio:**

| Campo | Compra (`buy`) | Venta (`sell`) |
|---|---|---|
| `buy_*` | Obligatorio | Obligatorio (referencia a la compra original) |
| `sell_*` | `null` | Obligatorio |
| `pnl` | `null` | `sellTotalReceived - buyTotalCost` |
| `status` | `open` | `closed` |

- Una posición abierta tiene `status = 'open'` y campos `sell_*` en null
- Una posición cerrada tiene `status = 'closed'`, campos `sell_*` rellenados y `pnl` calculado
- Para ventas parciales, `sellQuantity` indica cuánto se vendió

---

## 3. Relaciones entre tablas

```
┌──────────────┐
│   accounts   │
│ id, platform │
└──────┬───────┘
       │ 1:N (account_id)
       │
       ├──────────────────────────────┐
       ▼                              ▼
┌──────────────────────┐   ┌─────────────────────────────┐
│ investment_          │   │ investment_transactions     │
│ transactions         │   │                             │
│ (trades)             │   │ buy_date, buy_quantity,     │
│                      │   │ sell_date, pnl, status      │
└──────────────────────┘   └─────────────────────────────┘

┌──────────────────┐
│ monthly_snapshots │
│ id               │
└──────┬───────────┘
       │ 1:N (snapshot_id)
       ▼
┌──────────────────────┐
│ investment_holdings  │
│ asset_name, quantity │
│ value_per_unit       │
└──────────────────────┘
```

---

## 4. Resumen de trades (calculado en frontend)

El componente `TradeSummaryComponent` calcula:

| Métrica | Cálculo |
|---|---|
| Total invertido | `SUM(buyTotalCost)` de todos los trades |
| Total retirado | `SUM(sellTotalReceived)` de trades cerrados |
| PnL global | `SUM(pnl)` de trades cerrados |
| PnL por plataforma | `SUM(pnl)` agrupado por `account.platformId` |
| Win rate | `COUNT(pnl > 0) / COUNT(closed)` |

---

## 5. Endpoints resumidos

Ver `docs/swagger.yaml` para el detalle completo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/holdings?snapshotId` | Listar holdings de un snapshot |
| `POST` | `/holdings` | Crear holding |
| `DELETE` | `/holdings/{id}` | Eliminar holding |
| `GET` | `/trades?accountId` | Listar trades (filtro por cuenta) |
| `POST` | `/trades` | Crear trade |
| `DELETE` | `/trades/{id}` | Eliminar trade |

---

## 6. Enums

### AssetType
`crypto` · `stock` · `etf` · `index_fund` · `crowdlending`

### TransactionType
`buy` · `sell`

### TradeStatus
`open` · `closed`
