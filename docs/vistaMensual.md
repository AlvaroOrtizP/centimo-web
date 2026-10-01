# Vista Mensual — Desglose de un mes

> **Implementado:** `false` (migración pendiente)

Pantalla que muestra el desglose de un mes concreto: balance total, ingresos, gastos y detalle por cuenta. Ruta `/month/:year/:month`.

## Qué muestra hoy

| Bloque | Dato | Fuente actual |
|---|---|---|
| Tarjeta "Balance Total" | Suma de los balances del mes | Modelo genérico antiguo (instantáneas `instantaneas_mensuales`) |
| Tarjeta "Ingresos" | Ingresos del mes | `IncomesDataService` (**solo memoria, sin backend**) |
| Tarjeta "Gastos" | Gastos del mes | `ExpensesDataService` (`/expenses`) |
| Desglose por cuenta (account-breakdown) | Balance de cada cuenta por plataforma | Instantáneas + plataformas/cuentas del modelo antiguo |
| Gastos por categoría (expense-category-chart) | Gastos del mes agrupados por categoría | `/expenses` |
| Desglose de ingresos (income-breakdown) | Ingresos agrupados por fuente | `IncomesDataService` (memoria, sin backend) |

## De dónde saldrá cada bloque tras la migración

| Bloque | Endpoint de destino | Estado |
|---|---|---|
| Balance Total (+ desglose por entidad) | `/dashboard/balances?mes=...` (endpoint 1) | ✅ ya disponible (`docs/dashboard.md`) |
| Gastos del mes (total) | `/dashboard/balances/serie?entidad=gastos&mes=...` (endpoint 2) | ✅ ya disponible (`docs/dashboard.md`) |
| Desglose por cuenta/subcuenta | Endpoints propios de cada entidad: `/b100-balances` (subcuentas B100), `/fund-balances` (activos MyInvestor), `/revolut-balances`, `/banco/balances`, `/equito/balances`, `/urbanitae/balances`, `/mintos/intereses-anuales` | ✅ ya existentes |
| Gastos desglosados por categoría | `/expenses?year=&month=` | ✅ ya existente |
| **Ingresos del mes** | **`/nomina?mes=...` (nuevo)** | ❌ **falta** → ver `docs/nomina.md` |

Los tres endpoints de `docs/dashboard.md` **no cubren los ingresos**: solo hablan de patrimonio (balances de entidades) y gastos. Además, la tabla `gastos` tiene un único importe `cantidad`, sin distinguir ingreso de gasto. Por eso la tarjeta "Ingresos" y su desglose por fuente necesitan un endpoint propio: el de nómina/ingreso mensual (`docs/nomina.md`). Es la única pieza que falta.

## Decisiones pendientes / riesgos

1. **Ingresos del mes**: falta implementar el endpoint de nómina (ver `docs/nomina.md`) para poder migrar la tarjeta "Ingresos" y su desglose. Mientras tanto, la vista mensual los sigue mostrando desde memoria local.
2. **Enlace del menú hardcodeado**: la entrada "Vista Mensual" del menú lateral apunta a `/month/2026/6` (fija). Al migrar, debería apuntar al mes actual (o al último con datos).
3. **Mes global compartido**: la vista mensual escribe el mes de su URL en las signals globales `service.currentYear`/`currentMonth`, de modo que al volver al dashboard este cambia de mes (bug observado: al volver de la vista mensual, el dashboard pasa a mostrar el mes de la URL). Al migrar, la vista deberá decidir de forma explícita cuándo toca el mes global (solo cuando el usuario elige un mes).