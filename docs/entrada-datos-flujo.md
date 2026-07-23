# Entrada de Datos — Flujo por pestaña

Pantalla `/entry/:platformId`. Cada pestaña introduce datos que se persisten en una o varias tablas del backend.

---

## Cadena de dependencias

```
plataformas → cuentas → instantaneas_mensuales
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              posiciones_       gastos          fuentes_
              inversion                       ingreso
                    │
                    ▼
              operaciones_         elementos_
              inversion            lista_tareas
```

La **instantánea mensual** (`instantaneas_mensuales`) es el eje central. Cada gasto, ingreso, posición y tarea pertenece a una instantánea.

---

## Flujo por pestaña

### 1. Saldo / Snapshot

| Campo | Tabla | columna |
|---|---|---|
| Saldo de la cuenta | `instantaneas_mensuales` | `saldo` |
| Aportación adicional | `instantaneas_mensuales` | `aportacion` |
| Notas del mes | `instantaneas_mensuales` | `notas` |

**Comportamiento:** Si no existe instantánea para esa cuenta/año/mes, se crea (upsert). Si ya existe, se actualiza.

**Endpoint:** `POST /instantaneas/upsert`

---

### 2. Gastos

| Campo | Tabla | columna |
|---|---|---|
| Categoría | `gastos` | `categoria` |
| Cantidad | `gastos` | `cantidad` |
| Fecha | `gastos` | `fecha` |
| Descripción | `gastos` | `descripcion` |

**Efecto colateral:** Al crear/eliminar un gasto, se actualiza incrementalmente `instantaneas_mensuales.gastos` (+/- cantidad).

**Endpoints:**
- `POST /gastos` — crear
- `DELETE /gastos/{id}` — eliminar (decrementa instantánea)

---

### 3. Ingresos (Fuentes de ingreso)

| Campo | Tabla | columna |
|---|---|---|
| Fuente | `fuentes_ingreso` | `fuente` |
| Descripción | `fuentes_ingreso` | `descripcion` |
| Cantidad | `fuentes_ingreso` | `cantidad` |

**Efecto colateral:** Al crear/eliminar un ingreso, se actualiza incrementalmente `instantaneas_mensuales.ingresos` (+/- cantidad).

**Endpoints:**
- `POST /ingresos` — crear
- `DELETE /ingresos/{id}` — eliminar (decrementa instantánea)

---

### 4. Tareas

| Campo | Tabla | columna |
|---|---|---|
| Texto | `elementos_lista_tareas` | `texto` |
| Marcado (hecho/no hecho) | `elementos_lista_tareas` | `marcado` |
| Orden | `elementos_lista_tareas` | `orden` |

**Endpoints:**
- `POST /instantaneas/{instantaneaId}/tareas` — crear
- `POST /instantaneas/{instantaneaId}/tareas/{elementoId}/alternar` — marcar/desmarcar

---

### 5. Trades (Operaciones de inversión)

| Campo | Tabla | columna |
|---|---|---|
| Activo | `operaciones_inversion` | `nombre_activo`, `tipo_activo` |
| Tipo (compra/venta) | `operaciones_inversion` | `tipo` |
| Fecha compra | `operaciones_inversion` | `fecha_compra` |
| Cantidad | `operaciones_inversion` | `cantidad_compra` |
| Precio unitario | `operaciones_inversion` | `precio_unitario_compra` |
| Coste total | `operaciones_inversion` | `coste_total_compra` |
| Fecha venta (si aplica) | `operaciones_inversion` | `fecha_venta` |
| Precio venta (si aplica) | `operaciones_inversion` | `precio_unitario_venta` |
| Ganancia/pérdida | `operaciones_inversion` | `ganancia_perdida` |
| Estado | `operaciones_inversion` | `estado` |

**Endpoints:**
- `POST /operaciones` — crear
- `DELETE /operaciones/{id}` — eliminar

---

### 6. Posiciones (inversión)

| Campo | Tabla | columna |
|---|---|---|
| Activo | `posiciones_inversion` | `nombre_activo`, `tipo_activo` |
| Cantidad | `posiciones_inversion` | `cantidad` |
| Valor unitario | `posiciones_inversion` | `valor_unitario` |
| Valor total | `posiciones_inversion` | `valor_total` |

**Comportamiento:** Las posiciones se actualizan cada mes. Reemplazan las del mes anterior para esa instantánea.

**Endpoints:**
- `POST /posiciones` — crear
- `DELETE /posiciones/{id}` — eliminar

---

### 7. Crowdlending

| Campo | Tabla | columna |
|---|---|---|
| Plataforma | `inversiones_crowdlending` | `plataforma_id` |
| Nombre proyecto | `inversiones_crowdlending` | `nombre_proyecto` |
| Cantidad invertida | `inversiones_crowdlending` | `cantidad_invertida` |
| Tipo interés | `inversiones_crowdlending` | `tipo_interes` |
| Plazo (meses) | `inversiones_crowdlending` | `plazo_meses` |
| Fecha inicio/fin | `inversiones_crowdlending` | `fecha_inicio`, `fecha_fin` |
| Retorno mensual | `inversiones_crowdlending` | `retorno_mensual` |
| Total devuelto | `inversiones_crowdlending` | `total_devuelto` |
| Estado | `inversiones_crowdlending` | `estado` |

**Endpoints:**
- `POST /crowdlending` — crear
- `DELETE /crowdlending/{id}` — eliminar

---

### 8. Fondos MyInvestor

| Campo | Tabla | columna |
|---|---|---|
| Fondo (catálogo) | `fondos_myinvestor` | `codigo_isin`, `nombre` |
| Saldo mensual del fondo | `balances_fondo` | `anio`, `mes`, `saldo` |

**Endpoints:**
- `POST /fondos-myinvestor` — crear fondo
- `PUT /fondos-myinvestor/{id}` — actualizar fondo
- `DELETE /fondos-myinvestor/{id}` — eliminar fondo
- `POST /balances-fondo` — crear saldo mensual
- `PUT /balances-fondo/{id}` — actualizar saldo
- `DELETE /balances-fondo/{id}` — eliminar saldo

---

## Resumen rápido

| Pestaña | Tablas escritas | Efecto colateral |
|---|---|---|
| Saldo | `instantaneas_mensuales` | — |
| Gastos | `gastos` | `instantaneas_mensuales.gastos += cantidad` |
| Ingresos | `fuentes_ingreso` | `instantaneas_mensuales.ingresos += cantidad` |
| Tareas | `elementos_lista_tareas` | — |
| Trades | `operaciones_inversion` | — |
| Posiciones | `posiciones_inversion` | — |
| Crowdlending | `inversiones_crowdlending` | — |
| Fondos | `fondos_myinvester` + `balances_fondo` | — |

---

## Nota: `asignacion_salario`

Las **asignaciones_salario** NO se gestionan desde esta pantalla. Se gestionan desde **Nómina** (`/income`).

---

## Estado actual de implementación

| Método en `FinancialDataService` | ¿HTTP real? | Estado |
|---|---|---|
| `addSnapshot()` | Sí (via `SnapshotsService`) | Migrado |
| `updateSnapshot()` | No — solo signal en memoria | TODO |
| `addExpense()` | No — solo signal en memoria | TODO |
| `deleteExpense()` | No — solo signal en memoria | TODO |
| `addIncome()` | No — solo signal en memoria | TODO |
| `deleteIncome()` | No — solo signal en memoria | TODO |
| `addTrade()` | No — solo signal en memoria | TODO |
| `deleteTrade()` | No — solo signal en memoria | TODO |
| `addHolding()` | No — solo signal en memoria | TODO |
| `deleteHolding()` | No — solo signal en memoria | TODO |
| `addCrowdlendingInvestment()` | No — solo signal en memoria | TODO |
| `deleteCrowdlendingInvestment()` | No — solo signal en memoria | TODO |
