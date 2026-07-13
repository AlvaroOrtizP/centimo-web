# Plan Frontend — Centimo

## Dependencias externas a instalar

```bash
npm install chart.js                   # gráficos (incluye types propios)
```

## Fases de implementación

---

### Fase 0 — Scaffolding y modelos

**Objetivo**: crear estructura de carpetas, modelos TypeScript y rutas.

**Pasos:**

1. Crear estructura de directorios:
   ```
   src/app/
   ├── core/
   │   └── services/
   ├── models/
   ├── features/
   │   ├── dashboard/
   │   ├── monthly-view/
   │   ├── platform-detail/
   │   ├── trends/
   │   ├── trade-log/
   │   └── entry-form/
   ├── shared/
   │   ├── components/
   │   ├── pipes/
   │   └── layouts/
   └── app.routes.ts
   ```

2. Generar modelos con Angular CLI:
   ```bash
   ng generate interface models/platform
   ng generate interface models/account
   ng generate interface models/monthly-snapshot
   ng generate interface models/investment-holding
   ng generate interface models/investment-transaction
   ng generate interface models/expense
   ng generate interface models/income-source
   ng generate interface models/monthly-summary
   ng generate enum models/platform-type
   ng generate enum models/account-type
   ng generate enum models/asset-type
   ng generate enum models/trade-status
   ng generate enum models/expense-category
   ng generate enum models/transaction-type
   ```

3. Definir todas las interfaces y enums según `docs/modelo-datos.md`.

4. Configurar rutas en `app.routes.ts`:
   ```typescript
   export const routes: Routes = [
     { path: '',             component: DashboardComponent },
     { path: 'month/:year/:month', component: MonthlyViewComponent },
     { path: 'platform/:id', component: PlatformDetailComponent },
     { path: 'trends',       component: TrendsComponent },
     { path: 'trades',       component: TradeLogComponent },
     { path: 'entry/:platformId', component: EntryFormComponent },
   ];
   ```

---

### Fase 1 — Servicio principal y mock data

**Objetivo**: crear `FinancialDataService` con señales y datos mock para 6 meses.

**Archivos a crear:**
- `src/app/core/services/financial-data.service.ts`
- `src/assets/data/*.json` (platforms, accounts, snapshots, holdings, trades, incomes, expenses, crowdlending)

**`FinancialDataService`** expone señales:
```typescript
readonly platforms = signal<Platform[]>([]);
readonly accounts = signal<Account[]>([]);
readonly snapshots = signal<MonthlySnapshot[]>([]);
readonly holdings = signal<InvestmentHolding[]>([]);
readonly trades = signal<InvestmentTransaction[]>([]);
readonly expenses = signal<Expense[]>([]);
readonly incomes = signal<IncomeSource[]>([]);

// Métodos de consulta
getSnapshotsByMonth(year: number, month: number): MonthlySnapshot[]
getPlatformSummary(year: number, month: number): MonthlySummary
getPlatformHistory(platformId: string): PlatformHistory
// etc.
```

**JSON seed data** (`src/assets/data/*.json`):
- 9 plataformas con colores e iconos
- 12 cuentas (B100 tiene 3, MyInvestor tiene 2, etc.)
- Snapshots mensuales para mayo–junio 2026
- 4 trades de ejemplo
- Gastos categorizados del mes actual (~6)
- Ingresos del mes actual (~3)
- 4 inversiones crowdlending

**Mock data se inyecta en el servicio si no hay backend.** Para ello se crea un `HttpClient`-like mock o simplemente se cargan los datos directamente en el servicio con un flag `isMock`.

---

### Fase 2 — Layout y navegación

**Objetivo**: crear el layout base con sidebar y cabecera.

**Archivos a crear:**
- `src/app/shared/layouts/main-layout/main-layout.component`
- `src/app/shared/components/sidebar/sidebar.component`
- `src/app/shared/components/header/header.component`
- `src/app/shared/components/month-picker/month-picker.component`

**`MainLayoutComponent`**:
- Sidebar fijo a la izquierda con iconos + texto (responsive: colapsable en móvil)
- Header con selector de mes/año actual y breadcrumb
- `<router-outlet>` para el contenido

**Sidebar** con enlaces a:
- Dashboard (icono: home)
- Vista Mensual (icono: calendar)
- Tendencias (icono: TrendingUp)
- Trades (icono: BarChart3)
- Entrada de datos (icono: Edit3)

**MonthPicker**: selector de mes y año que persiste en el servicio (señal `currentMonth`), usado por varias vistas.

---

### Fase 3 — Dashboard

**Objetivo**: página principal con resumen del mes actual.

**Componentes a crear:**
- `src/app/features/dashboard/dashboard.component`
- `src/app/features/dashboard/components/summary-cards/summary-cards.component`
- `src/app/features/dashboard/components/platform-summary-table/platform-summary-table.component`
- `src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component`

**Contenido del Dashboard:**
1. **SummaryCards**: 4 tarjetas (Net Worth, Total Income, Total Expenses, Savings Rate) con valores grandes y variación vs mes anterior.
2. **PlatformSummaryTable**: tabla con todas las plataformas, su saldo actual, ingresos y gastos del mes. Con color indicador y nombre.
3. **NetWorthChart**: gráfico de líneas (ngx-charts) con evolución del net worth en los últimos 6-12 meses.

---

### Fase 4 — Vista Mensual

**Objetivo**: desglose detallado de un mes concreto.

**Componentes a crear:**
- `src/app/features/monthly-view/monthly-view.component`
- `src/app/features/monthly-view/components/account-breakdown/account-breakdown.component`
- `src/app/features/monthly-view/components/expense-category-chart/expense-category-chart.component`
- `src/app/features/monthly-view/components/income-breakdown/income-breakdown.component`

**Contenido:**
1. Selector de año/mes (reutilizar MonthPicker).
2. **AccountBreakdown**: tabla expandible por plataforma. Cada plataforma muestra sus cuentas con balance, ingresos, gastos. Expandir muestra InvestmentHoldings y Expenses.
3. **ExpenseCategoryChart**: gráfico de tarta con gastos por categoría del mes seleccionado.
4. **IncomeBreakdown**: lista de ingresos del mes con fuente y cantidad.

---

### Fase 5 — Detalle de Plataforma

**Objetivo**: histórico completo de una plataforma.

**Componentes a crear:**
- `src/app/features/platform-detail/platform-detail.component`
- `src/app/features/platform-detail/components/balance-history-chart/balance-history-chart.component`
- `src/app/features/platform-detail/components/monthly-table/monthly-table.component`

**Contenido:**
1. Cabecera con nombre, tipo, color de la plataforma.
2. **BalanceHistoryChart**: gráfico de líneas con evolución del balance mes a mes.
3. **MonthlyTable**: tabla de todos los snapshots mensuales de esa plataforma. Columnas: mes, balance, income, expenses.
4. Si es plataforma de inversión (Bitvavo, eToro, MyInvestor), mostrar también holdings y trades relacionados.

---

### Fase 6 — Tendencias Globales

**Objetivo**: gráficos de evolución y distribución.

**Componentes a crear:**
- `src/app/features/trends/trends.component`
- `src/app/features/trends/components/net-worth-trend/net-worth-trend.component`
- `src/app/features/trends/components/income-vs-expenses/income-vs-expenses.component`
- `src/app/features/trends/components/platform-distribution/platform-distribution.component`
- `src/app/features/trends/components/savings-rate-trend/savings-rate-trend.component`

**Contenido:**
1. **NetWorthTrend**: gráfico de líneas (todo el histórico disponible).
2. **IncomeVsExpenses**: gráfico de barras apiladas o agrupadas, ingresos vs gastos por mes.
3. **PlatformDistribution**: gráfico de tarta con la distribución del net worth entre plataformas (último mes).
4. **SavingsRateTrend**: gráfico de líneas con el porcentaje de ahorro sobre ingresos.

Todos los gráficos usan **ngx-charts** con tema Tailwind-compatible.

---

### Fase 7 — Registro de Trades

**Objetivo**: libro de operaciones de compra/venta.

**Componentes a crear:**
- `src/app/features/trade-log/trade-log.component`
- `src/app/features/trade-log/components/trade-table/trade-table.component`
- `src/app/features/trade-log/components/trade-summary/trade-summary.component`

**Contenido:**
1. **TradeSummary**: tarjetas con total invertido, total retirado, P&L global, P&L por plataforma.
2. Filtros: por activo (BTC, ETH, S&P500...), por estado (open/closed), por plataforma.
3. **TradeTable**: tabla con columnas:
   - Activo | Tipo | Fecha compra | Cantidad | Precio compra | Total invertido | Fecha venta | Precio venta | Total recibido | P&L | ROI %
   - Fila en verde si P&L > 0, roja si < 0.

---

### Fase 8 — Formulario de entrada de datos

**Objetivo**: introducir datos de cada plataforma para un mes concreto.

**Componentes a crear:**
- `src/app/features/entry-form/entry-form.component`
- `src/app/features/entry-form/components/bank-form/bank-form.component`
- `src/app/features/entry-form/components/investment-form/investment-form.component`
- `src/app/features/entry-form/components/crypto-form/crypto-form.component`
- `src/app/features/entry-form/components/expense-form/expense-form.component`
- `src/app/features/entry-form/components/trade-form/trade-form.component`

**Flujo:**
1. Seleccionar plataforma (o viene por ruta: `/entry/:platformId`).
2. Seleccionar año/mes (si no viene por ruta).
3. El formulario se adapta según el tipo de plataforma:
   - **Bank form** (BBVA, B100, Revolut): balance, income (con fuente), expenses (con categoría).
   - **Investment form** (MyInvestor cartera, Mintos, Equito, Urbanitae): balance, holdings (activo, cantidad, precio).
   - **Crypto form** (Bitvavo): balance, holdings BTC/ETH, registrar nuevo trade.
   - **Expense form**: selector de categoría, cantidad, descripción opcional.
   - **Trade form**: buy/sell, activo, cantidad, precio, fecha.

4. Los datos se guardan en el servicio (señales) y persisten en memoria mientras la app está abierta.

---

### Fase 9 — Pulido y testing

- Ajustar responsive (sidebar colapsable, tablas scrollables horizontalmente)
- Probar navegación completa
- Escribir tests unitarios de servicios y componentes principales
- `ng test --watch=false` para verificar que todo pasa

---

### Fase 10 — Distribución de Nómina

**Objetivo**: permitir configurar dónde se destina cada parte del sueldo mensual.

**Componentes a crear:**
- `src/app/features/income/components/salary-distribution/salary-distribution.component.ts`

**Modelo de datos:**
```typescript
interface SalaryAllocation {
  id: string;
  year: number;
  month: number;
  platformId: string;  // destino (plataforma)
  type: 'fixed' | 'percentage';
  value: number;       // cantidad fija en € o porcentaje
  note?: string;       // nota opcional
}
```

**Mock data:**
- `src/assets/data/salary-allocations.json` con 3 distribuciones de ejemplo

**Servicio (`FinancialDataService`):**
- Signal: `salaryAllocations`
- Métodos: `getSalaryAllocationsByMonth()`, `addSalaryAllocation()`, `deleteSalaryAllocation()`

**Funcionalidad del componente:**
1. **Selector mes/año** — reutiliza lógica del income-form
2. **Barra de progreso** — muestra % asignado vs restante del sueldo
3. **Campo sueldo neto** — introduce el sueldo del mes para calcular porcentajes
4. **Formulario**: select plataformas, toggle €/%, input valor, input nota
5. **Lista de distribuciones** — badge de tipo (€ o %), nombre plataforma, valor, nota, botón eliminar

**Integración en `IncomeComponent`:**
- Ambos componentes (IncomeForm + SalaryDistribution) se muestran juntos en layout de 2 columnas (`lg:grid-cols-2`)
- Selector de mes/año global que controla ambos componentes
- Inputs `month` y `year` pasados a los hijos
- Sin pestañas — todo visible en una sola pantalla

**Archivos modificados:**
- `src/app/features/income/income.component.ts` — añade tabs y SalaryDistributionComponent
- `src/app/core/services/financial-data.service.ts` — añade signal y métodos CRUD

---

### Fase 11 — Configuración de Distribución

**Objetivo**: vista mensual de 12 meses para gestionar todas las distribuciones de sueldo.

**Componentes a crear:**
- `src/app/features/income/components/salary-config/salary-config.component.ts`

**Funcionalidades:**
1. **Vista de 12 meses** — muestra distribuciones desde el mes actual (o las que existan)
2. **Navegación** — botones anterior/siguiente para navegar por meses
3. **Añadir distribución** — formulario modal con selector de plataforma, tipo, valor y nota
4. **Aplicar a múltiples meses** — opción de aplicar la misma configuración a 1, 3, 6 o 12 meses
5. **Editar distribución** — modal con los datos existentes para modificar
6. **Eliminar distribución** — botón de eliminar en cada fila

**Servicio (`FinancialDataService`):**
- Método añadido: `updateSalaryAllocation()`

**Integración en `IncomeComponent`:**
- Dos pestañas: "Distribución Mensual" y "Configuración"
- Tab activa controlada por signal `activeTab`

**Archivos modificados:**
- `src/app/features/income/income.component.ts` — añade pestaña Configuración
- `src/app/core/services/financial-data.service.ts` — añade método updateSalaryAllocation

---

## Orden de implementación recomendado

```
Fase 0 ───> Fase 1 ───> Fase 2 ───> Fase 3 ───> Fase 4 ───> Fase 5
                                                          │
                                                          └──> Fase 6
                                                          │
                                                          └──> Fase 7
                                                          │
                                                          └──> Fase 8
                                                          │
                                                          └──> Fase 9
```

Cada fase produce algo visualmente verificable. La Fase 0 y 1 son preparación, la Fase 2 ya muestra una app navegable (aunque vacía), y a partir de la Fase 3 ya se ve contenido real.

---

## Árbol de componentes completo

```
AppComponent
└── MainLayoutComponent
    ├── SidebarComponent
    ├── HeaderComponent (MonthPicker)
    └── <router-outlet>
        │
        ├── DashboardComponent
        │   ├── SummaryCardsComponent
        │   ├── PlatformSummaryTableComponent
        │   └── NetWorthChartComponent
        │
        ├── MonthlyViewComponent
        │   ├── AccountBreakdownComponent
        │   ├── ExpenseCategoryChartComponent
        │   └── IncomeBreakdownComponent
        │
        ├── PlatformDetailComponent
        │   ├── BalanceHistoryChartComponent
        │   └── MonthlyTableComponent
        │
        ├── TrendsComponent
        │   ├── NetWorthTrendComponent
        │   ├── IncomeVsExpensesComponent
        │   ├── PlatformDistributionComponent
        │   └── SavingsRateTrendComponent
        │
        ├── TradeLogComponent
        │   ├── TradeSummaryComponent
        │   └── TradeTableComponent
        │
        ├── IncomeComponent (Nómina)
        │   ├── IncomeFormComponent (tab: Distribución Mensual)
        │   ├── SalaryDistributionComponent (tab: Distribución Mensual)
        │   └── SalaryConfigComponent (tab: Configuración)
        │
        └── EntryFormComponent
            ├── BankFormComponent
            ├── InvestmentFormComponent
            ├── CryptoFormComponent
            ├── ExpenseFormComponent
            └── TradeFormComponent
```

32 componentes en total. Cada `*Component` tiene su `.ts`, `.html`, `.css` y `.spec.ts` (salvo que se pida `--skip-tests`).
