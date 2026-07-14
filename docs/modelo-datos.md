# Modelo de Datos — Centimo

App para llevar un registro mensual de finanzas personales. Sin backend todavía (frontend Angular con datos mock).

## Plataformas y qué trackear

| Plataforma     | Tipo                             | Cuentas | Qué trackear cada mes                                      |
|----------------|----------------------------------|---|------------------------------------------------------------|
| **Mintos**     | P2P lending                      | 1 cuenta | Saldo disponible + invertido, intereses generados          |
| **Equito**     | Crowdlending inmobiliario        | 1 cuenta | Capital invertido, retornos pendientes, retornos recibidos |
| **Urbanitae**  | Crowdlending inmobiliario        | 1 cuenta | Capital invertido, retornos pendientes, retornos recibidos |
| **eToro**      | Broker (stocks/CFDs)             | 1 cuenta | Cash disponible, valor cartera, P&L no realizado           |
| **BBVA**       | Banco tradicional                | 1 cuenta (nómina) | Saldo, ingresos (nómina), gastos                           |
| **MyInvestor** | Banco + inversiones              | 2 cuentas | Saldo cuenta corriente, valor cartera fondos indexados     |
| **B100**       | Banco digital                    | 3 cuentas (corriente, ahorro, inversión/bolsillos) | Saldo por cada cuenta                                      |
| **Revolut**    | Banco digital                    | 1 cuenta + bolsillos | Saldo principal, saldo en bolsillos                        |
| **Bitvavo**    | Exchange crypto                  | 1 cuenta (BTC + ETH) | Cantidad BTC, cantidad ETH, valor EUR total                |
| **Gastos**     | Registro de los gastos mensuales |1   | Registro de gastos                                         |
---

## Entidades del modelo de datos

### Platform

```typescript
interface Platform {
  id: string;
  name: string;
  type: PlatformType; // 'bank' | 'investment' | 'crypto' | 'p2p' | 'crowdlending'
  color: string;      // color hex para UI
  icon: string;       // nombre icono
  order: number;      // orden de visualización
}
```

### Account

Una plataforma puede tener una o más cuentas (B100 tiene 3, MyInvestor tiene 2).

```typescript
interface Account {
  id: string;
  platformId: string;
  name: string;
  type: AccountType; // 'checking' | 'savings' | 'investment' | 'pocket'
  currency: string;  // 'EUR'
  order: number;
}
```

### MonthlySnapshot

Registro mensual del estado de una cuenta. Es el núcleo de la app.

```typescript
interface MonthlySnapshot {
  id: string;
  accountId: string;
  year: number;
  month: number;       // 1-12

  // Saldo / valor total de la cuenta al cierre del mes
  balance: number;

  // Ingresos del mes en esta cuenta
  income: number;

  // Gastos del mes desde esta cuenta
  expenses: number;

  // Notas personales
  notes?: string;
}
```

### InvestmentHolding

Instantánea mensual de las posiciones abiertas en una cuenta de inversión. Refleja el estado a cierre de mes.

```typescript
interface InvestmentHolding {
  id: string;
  snapshotId: string;  // pertenece a un MonthlySnapshot
  assetName: string;   // 'Bitcoin', 'Ethereum', 'Fondo Indexado S&P500', etc.
  assetType: AssetType; // 'crypto' | 'stock' | 'etf' | 'index_fund'
  quantity: number;
  valuePerUnit: number; // precio unitario en EUR a cierre de mes
  totalValue: number;   // quantity * valuePerUnit
}
```

### InvestmentTransaction

Registro histórico de cada operación de compra/venta. Es el libro de trades, no una foto mensual.

```typescript
interface InvestmentTransaction {
  id: string;
  accountId: string;
  assetName: string;      // 'Bitcoin', 'Ethereum', 'Fondo Indexado S&P500', etc.
  assetType: AssetType;

  type: TransactionType;  // 'buy' | 'sell'

  // Datos de compra
  buyDate: string;        // ISO date
  buyQuantity: number;
  buyPricePerUnit: number;
  buyTotalCost: number;   // buyQuantity * buyPricePerUnit (incl. comisiones si se quiere)

  // Datos de venta (null si aún no se ha vendido)
  sellDate?: string;
  sellPricePerUnit?: number;
  sellTotalReceived?: number; // cantidad obtenida al vender
  sellQuantity?: number;      // cuánto se vendió (si es venta parcial)

  // Resultado
  pnl?: number;            // sellTotalReceived - buyTotalCost (calculado)
  status: TradeStatus;     // 'open' | 'closed'
}
```

Esto permite:
- Ver el histórico de compras: cuándo compré, a qué precio, cuánto aporté.
- Ver el resultado al vender: precio de venta, total obtenido, ganancia/pérdida.
- Para posiciones abiertas, el `MonthlySnapshot` + `InvestmentHolding` captura la valoración actual mes a mes.
- Para posiciones cerradas, el `InvestmentTransaction` guarda el resultado final.

### Expense

Gastos del mes categorizados.

```typescript
type ExpenseCategory = 
  | 'aseo' | 'coche' | 'comida' | 'discord' | 'ejercicio'
  | 'hacienda' | 'medicamento' | 'ocio' | 'otros' | 'trabajo';

interface Expense {
  id: string;
  snapshotId: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
}
```

### IncomeSource

Ingresos detallados del mes (nómina a BBVA, intereses Mintos, dividendos, etc.).

```typescript
interface IncomeSource {
  id: string;
  snapshotId: string;
  source: string;      // 'salary', 'interest', 'dividend', 'capital_gains', 'other'
  description: string;
  amount: number;
}
```

### SalaryAllocation

Configuración de distribución del sueldo por mes. Indica dónde se destina cada parte del ingreso.

```typescript
interface SalaryAllocation {
  id: string;
  year: number;
  month: number;       // 1-12
  platformId: string;  // destino (plataforma)
  type: 'fixed' | 'percentage';  // fijo en € o porcentaje del sueldo
  value: number;       // cantidad o porcentaje
  note?: string;       // nota opcional (ej: "Fondos indexados VWCE")
}
```

Ejemplo de uso:
- "30% del sueldo a MyInvestor" → `{ type: 'percentage', value: 30, platformId: 'myinvestor' }`
- "100€ fijos a B100" → `{ type: 'fixed', value: 100, platformId: 'b100' }`

La interfaz se usa en el componente `SalaryDistributionComponent` dentro de la pestaña "Distribución" de la sección Nómina.

### Commitment

Compromisos de pago — gastos recurrentes o puntuales que se repiten mes a mes.

```typescript
type CommitmentType = 'monthly' | 'annual' | 'once';

interface Commitment {
  id: string;
  description: string;       // "Netflix", "Declaración IRPF"
  month: number;             // 1-12 para annual/once; 0 para monthly (no aplica)
  year?: number;             // solo si type === 'once'
  type: CommitmentType;      // 'monthly' | 'annual' | 'once'
  category?: string;         // "Impuestos", "Suscripciones", "Seguros", "Trámites", "Otros"
  amount?: number;           // importe fijo en €
  isEstimated?: boolean;     // true = importe estimado, false = real
}
```

**Tipos:**
- `monthly` — se repite todos los meses (Netflix, Spotify). No tienen mes asignado.
- `annual` — una vez al año en un mes concreto (IRPF en junio).
- `once` — una vez en un mes y año específicos (seguro coche marzo 2026).

**UI:** Pestaña "Compromisos" dentro de la sección Nómina, con dos secciones separadas:
- **Recurrentes** — compromisos tipo `monthly`, aparecen siempre.
- **Puntuales** — compromisos `annual` y `once`, agrupados por mes con total por grupo.

Los compromisos recurrentes también se devuelven por `getCommitmentsByMonth()` para cualquier mes.

### MonthlySummary

Resumen global del mes (calculado a partir de snapshots).

```typescript
interface MonthlySummary {
  year: number;
  month: number;
  totalBalance: number;     // suma de todos los balances
  totalIncome: number;      // suma de todos los ingresos
  totalExpenses: number;    // suma de todos los gastos
  netWorth: number;         // totalBalance - deudas (si hay)
  netSavings: number;       // totalIncome - totalExpenses
}
```

---

## Mapeo Plataforma → Datos concretos

### Mintos
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Total cuenta (invested + cash) |
| `income` | Intereses cobrados en el mes |
| Detalle | InvestmentHolding con los préstamos activos agrupados |

### Equito
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Total invertido + retornos pendientes |
| `income` | Retornos recibidos en el mes |

### Urbanitae
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Total invertido + retornos pendientes |
| `income` | Retornos recibidos en el mes |

### eToro
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Cash + valor cartera |
| `income` | Dividendos + P&L realizado |
| Holdings | InvestmentHolding por posición abierta |
| Trades | InvestmentTransaction por cada compra/venta de acción o CFD |

### BBVA
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Saldo cuenta nómina |
| `income` | Ingresos del mes (nómina, etc.) |
| `expenses` | Gastos del mes |

### MyInvestor
| Cuenta | Datos |
|---|---|
| Cuenta corriente | `balance`, `income`, `expenses` |
| Cartera fondos | `balance`, InvestmentHolding por fondo, InvestmentTransaction por cada aportación/reembolso |

### B100 (3 cuentas)
| Cuenta | Dato principal |
|---|---|
| Cuenta 1 (corriente) | `balance`, `income`, `expenses` |
| Cuenta 2 (ahorro) | `balance` |
| Cuenta 3 (inversión) | `balance` |

### Revolut
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Saldo principal + bolsillos |
| `income`/`expenses` | Movimientos del mes |

### Bitvavo
| Campo | Cómo se obtiene |
|---|---|
| `balance` | Valor total BTC + ETH en EUR |
| Holdings | 2 InvestmentHolding (BTC, ETH) con `quantity`, `valuePerUnit` |
| Trades | InvestmentTransaction por cada compra/venta de BTC o ETH |

---

## Vistas del frontend (propuesta)

1. **Dashboard** — resumen global del mes actual: net worth, total income, total expenses, evolución últimos 6 meses (gráfico), lista de plataformas con saldos.

2. **Vista Mensual** — seleccionar año/mes. Muestra todas las plataformas con sus saldos, ingresos y gastos. Tabla resumen + desglose por cuenta.

3. **Vista Plataforma** — histórico mensual de una plataforma concreta (gráfico de evolución). Ej: ver cómo ha evolucionado Mintos mes a mes.

4. **Vista Global (Tendencia)** — gráficos de evolución de net worth, ingresos vs gastos, distribución por plataforma (tarta), etc.

5. **Registro de Trades** — para las cuentas de inversión (Bitvavo, eToro, MyInvestor), vista de todas las operaciones de compra/venta. Cada trade muestra: fecha compra, cantidad, precio, total invertido; fecha venta, precio venta, total recibido, P&L. Filtrable por activo y por estado (abierto/cerrado).

6. **Formulario de entrada** — para cada mes, introducir los datos de cada cuenta. Podría ser un formulario por plataforma o una tabla editable.

---

## Mock data (sin API)

Mientras no haya backend, los datos iniciales se cargan desde archivos JSON en:

```
src/assets/data/
```

Los formularios de entrada mutan las signals en memoria. Cuando llegue la API Spring, se sustituirán los imports JSON por `HttpClient.get()`.

---

## Decisiones tomadas

| Decisión | Respuesta |
|---|---|
| Gastos | Categorizados: Aseo, Coche, Comida, Discord, Ejercicio, Hacienda, Medicamento, Ocio, Otros, Trabajo |
| Deudas | No se trackean |
| Plataformas desde UI | De momento en código, futuro sí |
| Nómina | Va a BBVA |
| Formulario entrada | Uno por plataforma |
