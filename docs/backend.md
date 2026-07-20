# Backend — Centimo

Documentación completa del backend: tablas, endpoints, modelos de datos y su uso en cada pantalla.

---

## Estado de migración

| Fase | Tablas | Backend | Frontend | Estado |
|---|---|---|---|---|
| **Fase 1** | `plataformas`, `cuentas` | CRUD completo + semilla | `FinancialDataService` carga desde API | ✅ Migrado |
| **Fase 2** | `instantaneas_mensuales` | CRUD completo + upsert | `FinancialDataService` carga desde API | ✅ Migrado |
| **Fase 3** | `gastos`, `fuentes_ingreso`, `elementos_lista_tareas` | — | — | ⬜ Pendiente |
| **Fase 4** | `posiciones_inversion`, `operaciones_inversion` | — | — | ⬜ Pendiente |
| **Fase 5** | `inversiones_crowdlending`, `fondos_myinvestor`, `balances_fondo` | — | — | ⬜ Pendiente |
| **Fase 6** | `asignaciones_salario`, `compromisos` | — | — | ⬜ Pendiente |

### Pantallas migradas

| Pantalla | Ruta | Fase completada |
|---|---|---|
| Dashboard | `/` | Fase 2 (platforms, accounts, instantáneas desde API) |
| Vista Mensual | `/month/:year/:month` | Fase 2 (platforms, accounts, instantáneas desde API) |
| Detalle Plataforma | `/platform/:id` | Fase 2 (platforms, accounts, instantáneas desde API) |
| Tendencias | `/trends` | Fase 2 (platforms, accounts, instantáneas desde API) |
| Trades | `/trades` | Fase 1 (platforms + accounts desde API) |
| Entrada Datos | `/entry/:platformId` | Fase 2 (platforms, accounts, instantáneas desde API) |
| Nómina | `/income` | Fase 2 (platforms, accounts, instantáneas desde API) |

---

## 1. Visión general

Centimo es una app de finanzas personales. El backend gestiona plataformas financieras, cuentas, snapshots mensuales, inversiones, gastos, ingresos y configuración de nómina.

### Convención de uso de endpoints

Cada endpoint se marca con una columna **Web** que indica si es consumido por el frontend Angular:

| Valor | Significado |
|---|---|
| `✅` | Endpoint usado activamente por el frontend |
| `⬜` | Endpoint definido pero aún no implementado en el frontend |
| `🔧` | Endpoint solo para uso interno/admin (no expuesto al web) |

> **Regla:** Al añadir un endpoint, siempre indicar su uso en la columna Web. Esto ayuda a priorizar la implementación del backend.

### Entidades principales

| Entidad | Descripción |
|---|---|
| `plataformas` | Bancos, brokers, exchanges (BBVA, MyInvestor, Bitvavo...) |
| `cuentas` | Cuentas dentro de una plataforma (B100 tiene 3, MyInvestor tiene 2) |
| `instantaneas_mensuales` | Registro mensual del estado de una cuenta (núcleo de la app) |
| `posiciones_inversion` | Foto mensual de posiciones abiertas |
| `operaciones_inversion` | Histórico de compras/ventas |
| `gastos` | Gastos del mes categorizados |
| `fuentes_ingreso` | Ingresos detallados del mes |
| `inversiones_crowdlending` | Préstamos P2P o inmobiliarios |
| `fondos_myinvestor` | Catálogo de fondos indexados |
| `balances_fondo` | Saldo mensual de cada fondo |
| `asignaciones_salario` | Distribución del sueldo por mes y plataforma |
| `compromisos` | Gastos recurrentes o puntuales |
| `elementos_lista_tareas` | Tareas pendientes del mes |

### Relaciones

```
plataformas ──1:N── cuentas ──1:N── instantaneas_mensuales
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                    posiciones_      gastos          fuentes_
                    inversion     (categoría)       ingreso
                          │
                          ▼
                    operaciones_         elementos_
                    inversion            lista_tareas

plataformas ──1:N── asignaciones_salario
plataformas ──1:N── inversiones_crowdlending

fondos_myinvestor ──1:N── balances_fondo

compromisos (independiente)
  └─ Alertas consultadas por: asignaciones_salario (mes + 3 siguientes)
```

---

## 2. Tablas de backend

### 2.1 `plataformas`

Plataformas financieras (bancos, brokers, exchanges...).

```sql
CREATE TABLE plataformas (
  id                  VARCHAR(50)  PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  tipo                VARCHAR(20)  NOT NULL,  -- banco | inversion | cripto | p2p | crowdlending
  color               VARCHAR(7)   NOT NULL,  -- hexadecimal (#004481)
  icono               VARCHAR(50)  NOT NULL,  -- nombre del icono Lucide
  orden               INTEGER      NOT NULL,
  notas_fijas         TEXT,
  fecha_creacion      TIMESTAMP    DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_plataformas_tipo ON plataformas(tipo);
```

**Relaciones:**
- Una plataforma tiene N cuentas (`cuentas.plataforma_id → plataformas.id`)
- Una plataforma es referenciada por N asignaciones de salario (`asignaciones_salario.plataforma_id → plataformas.id`)
- Una plataforma es referenciada por N inversiones crowdlending (`inversiones_crowdlending.plataforma_id → plataformas.id`)

---

### 2.2 `cuentas`

Cuentas dentro de una plataforma. Una plataforma puede tener varias cuentas.

```sql
CREATE TABLE cuentas (
  id                  VARCHAR(50)  PRIMARY KEY,
  plataforma_id       VARCHAR(50)  NOT NULL REFERENCES plataformas(id) ON DELETE CASCADE,
  nombre              VARCHAR(100) NOT NULL,
  tipo                VARCHAR(20)  NOT NULL,  -- corriente | ahorro | inversion | bolsillo
  moneda              VARCHAR(3)   NOT NULL DEFAULT 'EUR',
  orden               INTEGER      NOT NULL,
  fecha_creacion      TIMESTAMP    DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_cuentas_plataforma ON cuentas(plataforma_id);
```

**Distribución de cuentas por plataforma:**

| Plataforma | Cuentas |
|---|---|
| BBVA | 1 (nómina) |
| CaixaBank | 1 (alternativa) |
| B100 | 3 (corriente, ahorro, inversión) |
| Revolut | 1 + bolsillos |
| MyInvestor | 2 (corriente, fondos) |
| Mintos | 1 |
| Equito | 1 |
| Urbanitae | 1 |
| Bitvavo | 1 (BTC + ETH) |

---

### 2.3 `instantaneas_mensuales`

Registro mensual del estado de una cuenta. Es la entidad central de la app.

```sql
CREATE TABLE instantaneas_mensuales (
  id                  VARCHAR(50)    PRIMARY KEY,
  cuenta_id           VARCHAR(50)    NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  anio                INTEGER        NOT NULL,
  mes                 INTEGER        NOT NULL CHECK (mes BETWEEN 1 AND 12),
  saldo               NUMERIC(12,2)  NOT NULL DEFAULT 0,
  ingresos            NUMERIC(10,2)  NOT NULL DEFAULT 0,
  gastos              NUMERIC(10,2)  NOT NULL DEFAULT 0,
  aportacion          NUMERIC(10,2),
  notas               TEXT,
  fecha_creacion      TIMESTAMP      DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP      DEFAULT NOW(),
  UNIQUE(cuenta_id, anio, mes)
);

CREATE INDEX idx_instantaneas_cuenta ON instantaneas_mensuales(cuenta_id);
CREATE INDEX idx_instantaneas_fecha ON instantaneas_mensuales(anio, mes);
```

**Lógica de negocio:**
- `saldo` — saldo total de la cuenta al cierre del mes
- `ingresos` — suma de los ingresos del mes (se actualiza incrementalmente al añadir/eliminar `fuentes_ingreso`)
- `gastos` — suma de los gastos del mes (se actualiza incrementalmente al añadir/eliminar `gastos`)
- `aportacion` — aportación adicional (opcional)
- Convención de ID: `"{cuentaId}-{anio}-{mm}"` (ej: `"bbva-corriente-2026-06"`)
- **Restricción UNIQUE:** no puede haber dos instantáneas para la misma cuenta, año y mes

**Lógica de `upsertInstantanea` (`POST /instantaneas/upsert`):**

| Caso | Comportamiento |
|---|---|
| **Existe** | Actualiza `saldo` y aplica `deltaIngresos` de forma incremental (`ingresos += deltaIngresos`) |
| **No existe** | Crea una nueva con los datos proporcionados |

---

### 2.4 `posiciones_inversion`

Instantánea mensual de las posiciones abiertas. Cada posición pertenece a una instantánea.

```sql
CREATE TABLE posiciones_inversion (
  id               VARCHAR(50)    PRIMARY KEY,
  instantanea_id   VARCHAR(50)    NOT NULL REFERENCES instantaneas_mensuales(id) ON DELETE CASCADE,
  nombre_activo    VARCHAR(100)   NOT NULL,
  tipo_activo      VARCHAR(20)    NOT NULL,  -- cripto | accion | etf | fondo_indexado | crowdlending
  cantidad         NUMERIC(18,8)  NOT NULL,
  valor_unitario   NUMERIC(12,4)  NOT NULL,
  valor_total      NUMERIC(12,2)  NOT NULL,
  fecha_creacion   TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_posiciones_instantanea ON posiciones_inversion(instantanea_id);
CREATE INDEX idx_posiciones_activo ON posiciones_inversion(nombre_activo);
```

**Lógica de negocio:**
- `valor_total = cantidad × valor_unitario` (se almacena precalculado)
- Una posición representa una posición abierta; al vender, se cierra y aparece como operación con `estado = 'cerrada'`
- Las posiciones se actualizan cada mes al registrar la instantánea (reemplazan las del mes anterior)

---

### 2.5 `operaciones_inversion`

Registro histórico de cada operación de compra/venta. Es el libro de operaciones.

```sql
CREATE TABLE operaciones_inversion (
  id                       VARCHAR(50)    PRIMARY KEY,
  cuenta_id                VARCHAR(50)    NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre_activo            VARCHAR(100)   NOT NULL,
  tipo_activo              VARCHAR(20)    NOT NULL,  -- cripto | accion | etf | fondo_indexado | crowdlending
  tipo                     VARCHAR(10)    NOT NULL,  -- compra | venta

  -- Datos de compra
  fecha_compra             DATE           NOT NULL,
  cantidad_compra          NUMERIC(18,8)  NOT NULL,
  precio_unitario_compra   NUMERIC(12,4)  NOT NULL,
  coste_total_compra       NUMERIC(12,2)  NOT NULL,

  -- Datos de venta (null si la posición sigue abierta)
  fecha_venta              DATE,
  precio_unitario_venta    NUMERIC(12,4),
  cantidad_total_recibida  NUMERIC(12,2),
  cantidad_venta           NUMERIC(18,8),

  -- Resultado
  ganancia_perdida         NUMERIC(12,2),  -- cantidad_total_recibida - coste_total_compra
  estado                   VARCHAR(10)    NOT NULL DEFAULT 'abierta',  -- abierta | cerrada

  fecha_creacion           TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_operaciones_cuenta ON operaciones_inversion(cuenta_id);
CREATE INDEX idx_operaciones_activo ON operaciones_inversion(nombre_activo);
CREATE INDEX idx_operaciones_estado ON operaciones_inversion(estado);
```

**Lógica de negocio:**

| Campo | Compra (`compra`) | Venta (`venta`) |
|---|---|---|
| `compra_*` | Obligatorio | Obligatorio (referencia a la compra original) |
| `venta_*` | `null` | Obligatorio |
| `ganancia_perdida` | `null` | `cantidad_total_recibida - coste_total_compra` |
| `estado` | `abierta` | `cerrada` |

- Una posición abierta tiene `estado = 'abierta'` y campos `venta_*` en null
- Una posición cerrada tiene `estado = 'cerrada'`, campos `venta_*` rellenados y `ganancia_perdida` calculado
- Para ventas parciales, `cantidad_venta` indica cuánto se vendió

**Métricas calculadas (en frontend):**

| Métrica | Cálculo |
|---|---|
| Total invertido | `SUM(costeTotalCompra)` de todas las operaciones |
| Total retirado | `SUM(cantidadTotalRecibida)` de operaciones cerradas |
| Ganancia/pérdida global | `SUM(gananciaPerdida)` de operaciones cerradas |
| Ganancia/pérdida por plataforma | `SUM(gananciaPerdida)` agrupado por `cuenta.plataformaId` |
| Ratio de acierto | `COUNT(gananciaPerdida > 0) / COUNT(cerrada)` |

---

### 2.6 `gastos`

Gastos del mes categorizados, vinculados a una instantánea.

```sql
CREATE TABLE gastos (
  id               VARCHAR(50)    PRIMARY KEY,
  instantanea_id   VARCHAR(50)    NOT NULL REFERENCES instantaneas_mensuales(id) ON DELETE CASCADE,
  categoria        VARCHAR(20)    NOT NULL,
  cantidad         NUMERIC(10,2)  NOT NULL,
  fecha            DATE           NOT NULL,
  descripcion      TEXT,
  fecha_creacion   TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_gastos_instantanea ON gastos(instantanea_id);
CREATE INDEX idx_gastos_categoria ON gastos(categoria);
```

**Efecto colateral al eliminar:** al borrar un gasto, se decrementa automáticamente `instantaneas_mensuales.gastos` de la instantánea asociada.

**Categorías:** `aseo` · `coche` · `comida` · `discord` · `ejercicio` · `hacienda` · `medicamento` · `ocio` · `otros` · `trabajo`

---

### 2.7 `fuentes_ingreso`

Ingresos detallados del mes, vinculados a una instantánea.

```sql
CREATE TABLE fuentes_ingreso (
  id               VARCHAR(50)    PRIMARY KEY,
  instantanea_id   VARCHAR(50)    NOT NULL REFERENCES instantaneas_mensuales(id) ON DELETE CASCADE,
  fuente           VARCHAR(50)    NOT NULL,
  descripcion      VARCHAR(200)   NOT NULL,
  cantidad         NUMERIC(10,2)  NOT NULL,
  fecha_creacion   TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_ingresos_instantanea ON fuentes_ingreso(instantanea_id);
```

**Efecto colateral al eliminar:** al borrar un ingreso, se decrementa automáticamente `instantaneas_mensuales.ingresos` de la instantánea asociada.

---

### 2.8 `elementos_lista_tareas`

Lista de tareas pendientes del mes.

```sql
CREATE TABLE elementos_lista_tareas (
  id               VARCHAR(50)  PRIMARY KEY,
  instantanea_id   VARCHAR(50)  NOT NULL REFERENCES instantaneas_mensuales(id) ON DELETE CASCADE,
  texto            VARCHAR(200) NOT NULL,
  marcado          BOOLEAN      NOT NULL DEFAULT FALSE,
  orden            INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_lista_tareas_instantanea ON elementos_lista_tareas(instantanea_id);
```

---

### 2.9 `inversiones_crowdlending`

Inversiones en proyectos de crowdlending (préstamos P2P o inmobiliarios).

```sql
CREATE TABLE inversiones_crowdlending (
  id                  VARCHAR(50)    PRIMARY KEY,
  plataforma_id       VARCHAR(50)    NOT NULL REFERENCES plataformas(id),
  nombre_proyecto     VARCHAR(200)   NOT NULL,
  cantidad_invertida  NUMERIC(10,2)  NOT NULL,
  tipo_interes        NUMERIC(5,2)   NOT NULL,   -- ej: 8.5 = 8.5%
  plazo_meses         INTEGER        NOT NULL,
  fecha_inicio        DATE           NOT NULL,
  fecha_fin           DATE,
  retorno_mensual     NUMERIC(10,2)  NOT NULL,
  total_devuelto      NUMERIC(10,2)  NOT NULL DEFAULT 0,
  estado              VARCHAR(20)    NOT NULL,   -- activo | completado | impagado
  fecha_creacion      TIMESTAMP      DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_crowdlending_plataforma ON inversiones_crowdlending(plataforma_id);
CREATE INDEX idx_crowdlending_estado ON inversiones_crowdlending(estado);
```

**Lógica de negocio:**
- `tipo_interes` — tipo de interés anual (ej: 8.5%)
- `retorno_mensual` — retorno mensual estimado en €
- `total_devuelto` — acumulado de lo devuelto hasta la fecha
- `estado`: `activo` (generando retornos) | `completado` (devuelto íntegramente) | `impagado` (pérdida)

---

### 2.10 `fondos_myinvestor`

Fondos indexados de MyInvestor (catálogo maestro).

```sql
CREATE TABLE fondos_myinvestor (
  id             VARCHAR(50)  PRIMARY KEY,
  codigo_isin    VARCHAR(20)  NOT NULL UNIQUE,  -- ISIN del fondo
  nombre         VARCHAR(200) NOT NULL,
  fecha_creacion TIMESTAMP    DEFAULT NOW()
);
```

---

### 2.11 `balances_fondo`

Saldo mensual de cada fondo. Un fondo puede tener múltiples registros (uno por mes).

```sql
CREATE TABLE balances_fondo (
  id             VARCHAR(50)    PRIMARY KEY,
  fondo_id       VARCHAR(50)    NOT NULL REFERENCES fondos_myinvestor(id) ON DELETE CASCADE,
  anio           INTEGER        NOT NULL,
  mes            INTEGER        NOT NULL CHECK (mes BETWEEN 1 AND 12),
  saldo          NUMERIC(12,2)  NOT NULL,
  fecha_creacion TIMESTAMP      DEFAULT NOW(),
  UNIQUE(fondo_id, anio, mes)
);

CREATE INDEX idx_balances_fondo_fecha ON balances_fondo(anio, mes);
CREATE INDEX idx_balances_fondo_fondo ON balances_fondo(fondo_id);
```

**Restricción UNIQUE:** no puede haber dos registros para el mismo fondo, año y mes.

**Cálculo del saldo total de fondos (`obtenerSaldoTotalFondosMes`):**

```sql
SELECT SUM(bf.saldo) AS total_saldo_fondos
FROM balances_fondo bf
WHERE bf.anio = :anio AND bf.mes = :mes;
```

---

### 2.12 `asignaciones_salario`

Distribución del sueldo por mes y plataforma. Define cuánto va a cada destino.

```sql
CREATE TABLE asignaciones_salario (
  id                  VARCHAR(50)    PRIMARY KEY,
  anio                INTEGER        NOT NULL,
  mes                 INTEGER        NOT NULL CHECK (mes BETWEEN 1 AND 12),
  plataforma_id       VARCHAR(50)    NOT NULL REFERENCES plataformas(id),
  tipo                VARCHAR(20)    NOT NULL,  -- fijo | porcentaje
  valor               NUMERIC(10,2)  NOT NULL,
  nota                TEXT,
  fecha_creacion      TIMESTAMP      DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_asig_sal_anio_mes ON asignaciones_salario(anio, mes);
CREATE INDEX idx_asig_sal_plataforma ON asignaciones_salario(plataforma_id);
```

**Lógica de negocio:**
- `tipo = 'fijo'` → `valor` es una cantidad fija en € (ej: 100€ a B100)
- `tipo = 'porcentaje'` → `valor` es un porcentaje del sueldo neto (ej: 30% a MyInvestor)
- Al crear desde la UI, se puede "aplicar a N meses" → el frontend crea una copia por cada mes

---

### 2.13 `compromisos`

Compromisos de pago — gastos recurrentes o puntuales. Se muestran al planificar la distribución de nómina para que el usuario conozca sus obligaciones del mes seleccionado y los siguientes.

```sql
CREATE TABLE compromisos (
  id                  VARCHAR(50)    PRIMARY KEY,
  descripcion         VARCHAR(200)   NOT NULL,
  mes                 INTEGER        NOT NULL CHECK (mes BETWEEN 0 AND 12),
  anio                INTEGER,                     -- solo para tipo = 'unico'
  tipo                VARCHAR(20)    NOT NULL,     -- mensual | anual | unico
  categoria           VARCHAR(50),                 -- impuestos | suscripciones | seguros | tramites | otros
  cantidad            NUMERIC(10,2),
  es_estimado         BOOLEAN        DEFAULT FALSE,
  fecha_creacion      TIMESTAMP      DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_compromisos_tipo ON compromisos(tipo);
CREATE INDEX idx_compromisos_mes ON compromisos(mes);
```

**Lógica de negocio por tipo:**

| tipo | mes | anio | Comportamiento |
|---|---|---|---|
| `mensual` | `0` | `null` | Aparece TODOS los meses. El campo mes no se usa. |
| `anual` | `1-12` | `null` | Aparece solo en el mes indicado, cada año. |
| `unico` | `1-12` | obligatorio | Aparece solo en el mes+año indicados. |

**Filtrado por mes (`buscarCompromisosPorMes(mes, anio)`):**
```
mensual → SIEMPRE se incluye
anual   → solo si c.mes = mes
unico   → solo si c.mes = mes AND (c.anio = anio)
```

#### Notas de compromisos — Lógica de alertas para planificación

Al crear o modificar una planificación de nómina (`asignaciones_salario`), el sistema debe informar al usuario de los compromisos que afectan al mes actual y los **3 meses siguientes**.

**Endpoint auxiliar para alertas:**

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/compromisos/alertas?anio&mes` | Compromisos del mes y 3 siguientes (mes+1, mes+2, mes+3) |

**Response esperada:**

```json
{
  "mesActual": { "anio": 2026, "mes": 7, "compromisos": [...], "total": 150.00 },
  "mesSiguiente": { "anio": 2026, "mes": 8, "compromisos": [...], "total": 89.99 },
  "mesPlus2": { "anio": 2026, "mes": 9, "compromisos": [...], "total": 45.00 },
  "mesPlus3": { "anio": 2026, "mes": 10, "compromisos": [...], "total": 30.00 }
}
```

**Lógica de detección (pseudocódigo):**

```typescript
function compromisosPorMes(anio: number, mes: number): Compromiso[] {
  return compromisos.filter(c => {
    if (c.tipo === 'mensual') return true;
    if (c.tipo === 'anual') return c.mes === mes;
    if (c.tipo === 'unico') return c.mes === mes && (!c.anio || c.anio === anio);
    return false;
  });
}

function alertasPlanificacion(anioBase: number, mesBase: number): AlertasPlanificacion {
  return [0, 1, 2, 3].map(offset => {
    const { anio, mes } = sumarMeses(anioBase, mesBase, offset);
    const lista = compromisosPorMes(anio, mes);
    return {
      anio, mes,
      compromisos: lista,
      total: lista.reduce((sum, c) => sum + (c.cantidad || 0), 0)
    };
  });
}
```

**Comportamiento en UI:**

- Al abrir el formulario de planificación, se muestran **alertas por mes** con el total estimado de compromisos
- Si `es_estimado = true`, el total se muestra como "≈ 150€" (aproximado)
- Si no hay compromisos en un mes, no se muestra alerta para ese mes
- Las alertas se actualizan al crear/editar/eliminar un compromiso

**Ejemplo de uso:**

| Mes | Compromisos | Total |
|---|---|---|
| Jul 2026 (actual) | Netflix, HBO, Seguro coche | ≈ 45€ |
| Ago 2026 | Netflix, HBO, Seguro coche | ≈ 45€ |
| Sep 2026 | Netflix, HBO, Seguro coche, IBI | ≈ 200€ |
| Oct 2026 | Netflix, HBO, Seguro coche | ≈ 45€ |

---

---

## 3. Enums

### TipoPlataforma
`banco` · `inversion` · `cripto` · `p2p` · `crowdlending`

### TipoCuenta
`corriente` · `ahorro` · `inversion` · `bolsillo`

### TipoActivo
`cripto` · `accion` · `etf` · `fondo_indexado` · `crowdlending`

### TipoOperacion
`compra` · `venta`

### EstadoOperacion
`abierta` · `cerrada`

### TipoAsignacion
`fijo` · `porcentaje`

### TipoCompromiso
`mensual` · `anual` · `unico`

### CategoriaCompromiso
`impuestos` · `suscripciones` · `seguros` · `tramites` · `otros`

### Compromisos — Tipos y comportamiento

| Tipo | Campo `mes` | Campo `anio` | Comportamiento |
|---|---|---|---|
| `mensual` | `0` (ignorado) | `null` | Aparece TODOS los meses |
| `anual` | `1-12` | `null` | Aparece en ese mes cada año |
| `unico` | `1-12` | obligatorio | Aparece solo en mes+año específico |

### CategoriaGasto
`aseo` · `coche` · `comida` · `discord` · `ejercicio` · `hacienda` · `medicamento` · `ocio` · `otros` · `trabajo`

### EstadoProyecto (crowdlending)
`activo` · `completado` · `impagado`

---

## 4. Datos iniciales (semilla)

Solo `plataformas` y `cuentas` necesitan datos fijos. El resto de tablas se poblán desde la UI.

### Plataformas

```sql
INSERT INTO plataformas (id, nombre, tipo, color, icono, orden) VALUES
  ('bbva',       'BBVA',       'banco',       '#004481', 'building',     1),
  ('caixabank',  'CaixaBank',  'banco',       '#FF5722', 'building',     2),
  ('b100',       'B100',       'banco',       '#6C3FD1', 'smartphone',   3),
  ('revolut',    'Revolut',    'banco',       '#EB008B', 'smartphone',   4),
  ('myinvestor', 'MyInvestor', 'inversion',   '#00A3E0', 'trending-up',  5),
  ('mintos',     'Mintos',     'p2p',         '#00BFA5', 'dollar-sign',  6),
  ('equito',     'Equito',     'crowdlending','#FF6B35', 'home',         7),
  ('urbanitae',  'Urbanitae',  'crowdlending','#E63946', 'building',     8),
  ('bitvavo',    'Bitvavo',    'cripto',      '#1E3A5F', 'bitcoin',      9);
```

### Cuentas

```sql
INSERT INTO cuentas (id, plataforma_id, nombre, tipo, orden) VALUES
  ('bbva-nomina',        'bbva',       'Nómina',         'corriente', 1),
  ('caixa-main',         'caixabank',  'Principal',       'corriente', 1),
  ('b100-corriente',     'b100',       'Corriente',       'corriente', 1),
  ('b100-ahorro',        'b100',       'Save',            'ahorro',    2),
  ('b100-inversion',     'b100',       'Health',          'inversion', 3),
  ('revolut-main',       'revolut',    'Principal',       'corriente', 1),
  ('myinvestor-metal',   'myinvestor', 'Cuenta Metal',    'corriente', 1),
  ('myinvestor-fondos',  'myinvestor', 'Fondos',          'inversion', 2),
  ('mintos-main',        'mintos',     'Principal',       'inversion', 1),
  ('equito-main',        'equito',     'Principal',       'inversion', 1),
  ('urbanitae-main',     'urbanitae',  'Principal',       'inversion', 1),
  ('bitvavo-main',       'bitvavo',    'Portfolio',       'inversion', 1);
```

---

## 5. Endpoints

### 4.1 Plataformas

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/plataformas` | Listar plataformas | ✅ |
| `GET` | `/plataformas/{id}` | Obtener plataforma | ⬜ |
| `POST` | `/plataformas` | Crear plataforma | ⬜ |
| `PUT` | `/plataformas/{id}` | Actualizar plataforma | ⬜ |
| `DELETE` | `/plataformas/{id}` | Eliminar plataforma | ⬜ |

### 4.2 Cuentas

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/cuentas` | Listar cuentas (filtro `?plataformaId=`) | ✅ |
| `GET` | `/cuentas/{id}` | Obtener cuenta | ⬜ |
| `POST` | `/cuentas` | Crear cuenta | ⬜ |
| `PUT` | `/cuentas/{id}` | Actualizar cuenta | ⬜ |
| `DELETE` | `/cuentas/{id}` | Eliminar cuenta | ⬜ |

### 4.3 Instantáneas

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/instantaneas?anio&mes&cuentaId` | Listar instantáneas (filtros opcionales) | ✅ |
| `GET` | `/instantaneas/{id}` | Obtener instantánea | ⬜ |
| `POST` | `/instantaneas` | Crear instantánea | ⬜ |
| `POST` | `/instantaneas/upsert` | Crear o actualizar (upsert) | ✅ |
| `PUT` | `/instantaneas/{id}` | Actualizar instantánea | ⬜ |
| `DELETE` | `/instantaneas/{id}` | Eliminar instantánea | ⬜ |
| `POST` | `/instantaneas/{instantaneaId}/tareas/{elementoId}/alternar` | Alternar elemento de la lista de tareas | ⬜ |

### 4.4 Posiciones de inversión

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/posiciones?instantaneaId` | Listar posiciones de una instantánea | ⬜ |
| `POST` | `/posiciones` | Crear posición | ⬜ |
| `DELETE` | `/posiciones/{id}` | Eliminar posición | ⬜ |

### 4.5 Operaciones de inversión

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/operaciones?cuentaId` | Listar operaciones (filtro por cuenta) | ⬜ |
| `POST` | `/operaciones` | Crear operación | ⬜ |
| `DELETE` | `/operaciones/{id}` | Eliminar operación | ⬜ |

### 4.6 Gastos

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/gastos?instantaneaId` | Listar gastos de la instantánea | ⬜ |
| `POST` | `/gastos` | Crear gasto | ⬜ |
| `DELETE` | `/gastos/{id}?instantaneaId` | Eliminar gasto (decrementa gastos de la instantánea) | ⬜ |

### 4.7 Ingresos

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/ingresos?instantaneaId` | Listar ingresos de la instantánea | ⬜ |
| `POST` | `/ingresos` | Crear ingreso | ⬜ |
| `DELETE` | `/ingresos/{id}?instantaneaId` | Eliminar ingreso (decrementa ingresos de la instantánea) | ⬜ |

### 4.8 Crowdlending

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/crowdlending?plataformaId` | Listar inversiones crowdlending | ⬜ |
| `POST` | `/crowdlending` | Crear inversión crowdlending | ⬜ |
| `DELETE` | `/crowdlending/{id}` | Eliminar inversión crowdlending | ⬜ |

### 4.9 Fondos MyInvestor

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/fondos-myinvestor` | Listar fondos | ⬜ |
| `GET` | `/fondos-myinvestor/{id}` | Obtener fondo | ⬜ |
| `POST` | `/fondos-myinvestor` | Crear fondo | ⬜ |
| `PUT` | `/fondos-myinvestor/{id}` | Actualizar fondo | ⬜ |
| `DELETE` | `/fondos-myinvestor/{id}` | Eliminar fondo | ⬜ |

### 4.10 Balances de fondo

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/balances-fondo?anio&mes` | Listar saldos del mes | ⬜ |
| `POST` | `/balances-fondo` | Crear saldo | ⬜ |
| `PUT` | `/balances-fondo/{id}` | Actualizar saldo | ⬜ |
| `DELETE` | `/balances-fondo/{id}` | Eliminar saldo | ⬜ |

### 4.11 Asignaciones de salario

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/asignaciones-salario?anio&mes` | Distribuciones del mes | ⬜ |
| `POST` | `/asignaciones-salario` | Crear distribución | ⬜ |
| `PUT` | `/asignaciones-salario/{id}` | Actualizar distribución | ⬜ |
| `DELETE` | `/asignaciones-salario/{id}` | Eliminar distribución | ⬜ |

### 4.12 Compromisos

| Método | Ruta | Descripción | Web |
|---|---|---|---|
| `GET` | `/compromisos` | Todos los compromisos | ⬜ |
| `GET` | `/compromisos?mes=&anio=` | Compromisos filtrados por mes y año | ⬜ |
| `GET` | `/compromisos/{id}` | Obtener compromiso | ⬜ |
| `GET` | `/compromisos/alertas?anio&mes` | Alertas del mes actual y 3 siguientes | ⬜ |
| `POST` | `/compromisos` | Crear compromiso | ⬜ |
| `PUT` | `/compromisos/{id}` | Actualizar compromiso | ⬜ |
| `DELETE` | `/compromisos/{id}` | Eliminar compromiso | ⬜ |

---

## 6. Uso por pantalla

### Dashboard (`/`)

| Endpoint necesario | Uso |
|---|---|
| `GET /plataformas` | Lista de plataformas con colores |
| `GET /cuentas` | Relación cuentas→plataformas |
| `GET /instantaneas?anio&mes` | Saldos, ingresos y gastos del mes actual |

**Entidades consumidas:** Platform, Account, MonthlySnapshot (computa MonthlySummary)

---

### Vista Mensual (`/month/:year/:month`)

| Endpoint necesario | Uso |
|---|---|
| `GET /plataformas` | Nombre y color de cada plataforma |
| `GET /cuentas` | Cuentas por plataforma |
| `GET /instantaneas?anio&mes` | Saldos, ingresos y gastos del mes seleccionado |
| `GET /posiciones?instantaneaId` | Holdings de cada cuenta de inversión |
| `GET /gastos?instantaneaId` | Gastos detallados por categoría |
| `GET /ingresos?instantaneaId` | Ingresos detallados |

**Entidades consumidas:** Platform, Account, MonthlySnapshot, InvestmentHolding, Expense, IncomeSource

---

### Detalle Plataforma (`/platform/:id`)

| Endpoint necesario | Uso |
|---|---|
| `GET /plataformas/{id}` | Nombre, tipo, color |
| `GET /cuentas?plataformaId=` | Cuentas de la plataforma |
| `GET /instantaneas?cuentaId=` | Historial de saldos (múltiples meses) |
| `GET /posiciones?instantaneaId` | Holdings del último snapshot |
| `GET /operaciones?cuentaId=` | Trades de la plataforma |

**Entidades consumidas:** Platform, Account, MonthlySnapshot, InvestmentHolding, InvestmentTransaction

---

### Tendencias (`/trends`)

| Endpoint necesario | Uso |
|---|---|
| `GET /plataformas` | Distribución por plataforma (nombre, color) |
| `GET /cuentas` | Relación cuentas→plataformas |
| `GET /instantaneas` | Histórico de saldos para gráficos de evolución |

**Entidades consumidas:** Platform, Account, MonthlySnapshot (computa MonthlySummary por mes)

---

### Trades (`/trades`)

| Endpoint necesario | Uso |
|---|---|
| `GET /operaciones` | Todas las operaciones de compra/venta |
| `GET /cuentas` | Filtrado por plataforma |
| `GET /plataformas` | Nombres y colores para filtro y P&L por plataforma |

**Entidades consumidas:** InvestmentTransaction, Account, Platform

---

### Entrada Datos (`/entry/:platformId`)

| Endpoint necesario | Uso |
|---|---|
| `GET /plataformas` | Selector de plataforma |
| `GET /cuentas` | Cuentas disponibles |
| `GET/POST/PUT/DELETE /instantaneas` | CRUD de snapshots mensuales |
| `GET/POST/DELETE /gastos` | CRUD de gastos |
| `GET/POST/DELETE /ingresos` | CRUD de ingresos |
| `GET/POST/DELETE /operaciones` | CRUD de trades |
| `GET/POST/DELETE /crowdlending` | CRUD de inversiones crowdlending (Equito, Urbanitae) |
| `GET/POST/DELETE /fondos-myinvestor` | CRUD de fondos indexados |
| `GET/POST/PUT/DELETE /balances-fondo` | CRUD de saldos mensuales por fondo |

**Entidades consumidas:** Platform, Account, MonthlySnapshot, Expense, IncomeSource, InvestmentTransaction, CrowdlendingInvestment, MyInvestorFund, FundBalance

---

### Nómina (`/income`)

| Endpoint necesario | Uso |
|---|---|
| `GET /plataformas` | Selector de destino en distribución |
| `GET/POST/DELETE /asignaciones-salario` | CRUD de distribuciones de sueldo |
| `GET/POST/PUT/DELETE /compromisos` | CRUD de compromisos |
| `GET /compromisos/alertas?anio&mes` | Alertas de compromisos mes actual + 3 siguientes |
| `GET /instantaneas?cuentaId` | Buscar snapshot para registrar ingresos |
| `GET/POST/DELETE /ingresos` | CRUD de ingresos del mes |

**Entidades consumidas:** Platform, SalaryAllocation, Commitment, MonthlySnapshot, IncomeSource

**Nota sobre compromisos:** El endpoint `GET /compromisos/alertas` devuelve un desglose por mes (actual + 3 siguientes) con los compromisos que aplican a cada uno. Se muestra al planificar la distribución de nómina para que el usuario conozca sus obligaciones antes de decidir el destino del salario.

---

## 7. Mapeo Plataforma → Datos concretos

| Plataforma | Tipo | Qué registrar cada mes |
|---|---|---|
| **BBVA** | Banco tradicional | Saldo, ingresos (nómina), gastos |
| **B100** | Banco digital | Saldo por cada una de las 3 cuentas (corriente, ahorro, inversión) |
| **Revolut** | Banco digital | Saldo principal + bolsillos, intereses y TAE |
| **MyInvestor** | Banco + inversiones | Saldo cuenta corriente, fondos por ISIN con saldo mensual |
| **Mintos** | P2P lending | Saldo disponible + invertido, intereses generados |
| **Equito** | Crowdlending inmobiliario | Capital invertido, retornos pendientes, retornos recibidos |
| **Urbanitae** | Crowdlending inmobiliario | Capital invertido, retornos pendientes, retornos recibidos |
| **Bitvavo** | Exchange crypto | Cantidad BTC/ETH, valor EUR total |

---

## 8. Datos mock (sin API)

Mientras no haya backend, los datos iniciales se cargan desde archivos JSON en `src/assets/data/`. Los formularios de entrada mutan las signals en memoria. Cuando llegue la API, se sustituirán los imports JSON por `HttpClient.get()`.

---

## 9. Guía de migración a API

Orden recomendado para migrar de datos hardcodeados a llamadas reales. Cada fase es funcional por sí misma — al finalizar, la app funciona con datos reales para esa parte.

### Criterios de orden

1. **Dependencias primero** — lo que otras tablas referencian se migra antes
2. **Lectura antes que escritura** — GETs primero, CRUD después
3. **Pantallas simples antes que complejas** — Dashboard (solo lectura) antes que EntryForm (CRUD completo)
4. **Agrupación lógica** — entidades relacionadas se migran juntas

---

### Fase 1 — Datos base (plataformas + cuentas)

**Por qué primero:** Todo lo demás referencia `plataformas.id` y `cuentas.id`. Sin estas tablas, nada funciona.

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `GET` | `/plataformas` | Lectura |
| `GET` | `/plataformas/{id}` | Lectura |
| `GET` | `/cuentas` | Lectura (filtro `?plataformaId=`) |

**Cambios en frontend:**
- `FinancialDataService`: sustituir `import platforms from '...'` por `HttpClient.get('/plataformas')`
- Lo mismo con `accounts`
- Crear `ApiService` o interceptor base si no existe

**Pantallas afectadas (solo lectura):** Todas — Dashboard, MonthlyView, PlatformDetail, Trends, TradeLog, EntryForm, Income

**Verificación:** Dashboard muestra las plataformas reales con sus colores y saldos (aún vacíos).

---

### Fase 2 — Instantáneas (core)

**Por qué:** Entidad central. `gastos`, `fuentes_ingreso`, `posiciones` y `elementos_lista_tareas` dependen de ella.

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `GET` | `/instantaneas?anio&mes&cuentaId` | Lectura |
| `GET` | `/instantaneas/{id}` | Lectura |
| `POST` | `/instantaneas` | Escritura |
| `POST` | `/instantaneas/upsert` | Escritura |
| `PUT` | `/instantaneas/{id}` | Escritura |
| `DELETE` | `/instantaneas/{id}` | Escritura |

**Cambios en frontend:**
- Sustituir `import snapshots from '...'` por llamada HTTP
- Añadir `HttpClient` a los métodos `addSnapshot`, `updateSnapshot`, `upsertSnapshot`, `deleteSnapshot`
- `getSnapshotsByMonth`, `getSnapshotsByAccount` → HTTP GET con parámetros

**Pantallas afectadas:**
- **Dashboard** — muestra saldos reales
- **MonthlyView** — desglose por cuenta con datos reales
- **PlatformDetail** — historial de saldos real

**Verificación:** Dashboard y MonthlyView muestran datos reales. EntryForm puede guardar snapshots.

---

### Fase 3 — Gastos e ingresos

**Por qué:** Hijos directos de `instantaneas`. Se actualizan incrementalmente (`instantaneas.gastos += delta`).

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `GET` | `/gastos?instantaneaId` | Lectura |
| `POST` | `/gastos` | Escritura |
| `DELETE` | `/gastos/{id}?instantaneaId` | Escritura |
| `GET` | `/ingresos?instantaneaId` | Lectura |
| `POST` | `/ingresos` | Escritura |
| `DELETE` | `/ingresos/{id}?instantaneaId` | Escritura |
| `GET` | `/elementos-tareas?instantaneaId` | Lectura |
| `POST` | `/instantaneas/{id}/tareas` | Escritura |
| `POST` | `/instantaneas/{instantaneaId}/tareas/{elementoId}/alternar` | Escritura |

**Cambios en frontend:**
- `addExpense`, `deleteExpense` → HTTP
- `addIncome`, `deleteIncome` → HTTP
- La actualización incremental de `instantaneas.gastos`/`instantaneas.ingresos` se hace en backend (trigger o lógica de servicio)

**Pantallas afectadas:**
- **MonthlyView** — gráfico de categorías y lista de ingresos con datos reales
- **EntryForm (Gastos)** — formulario de gastos funcional
- **Income (Distribución)** — formulario de ingresos funcional

**Verificación:** Se pueden crear y borrar gastos/ingresos. Los totales se actualizan en instantánea.

---

### Fase 4 — Posiciones e operaciones de inversión

**Por qué:** Datos de inversiones. `posiciones` depende de `instantaneas`, `operaciones` depende de `cuentas`.

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `GET` | `/posiciones?instantaneaId` | Lectura |
| `POST` | `/posiciones` | Escritura |
| `DELETE` | `/posiciones/{id}` | Escritura |
| `GET` | `/operaciones?cuentaId` | Lectura |
| `POST` | `/operaciones` | Escritura |
| `DELETE` | `/operaciones/{id}` | Escritura |

**Cambios en frontend:**
- `holdings` signal → HTTP GET
- `trades` signal → HTTP GET
- `addHolding`, `deleteHolding`, `addTrade`, `deleteTrade` → HTTP

**Pantallas afectadas:**
- **PlatformDetail** — holdings y trades de la plataforma
- **TradeLog** — tabla de operaciones con filtros y P&L
- **EntryForm (Trades)** — formulario de trades funcional

**Verificación:** Se pueden registrar compras/ventas. TradeLog muestra operaciones reales con P&L.

---

### Fase 5 — Productos especializados (crowdlending + fondos MyInvestor)

**Por qué:** Datos específicos de ciertas plataformas. No bloquean a otras pantallas.

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `GET` | `/crowdlending?plataformaId` | Lectura |
| `POST` | `/crowdlending` | Escritura |
| `DELETE` | `/crowdlending/{id}` | Escritura |
| `GET` | `/fondos-myinvestor` | Lectura |
| `POST` | `/fondos-myinvestor` | Escritura |
| `PUT` | `/fondos-myinvestor/{id}` | Escritura |
| `DELETE` | `/fondos-myinvestor/{id}` | Escritura |
| `GET` | `/balances-fondo?anio&mes` | Lectura |
| `POST` | `/balances-fondo` | Escritura |
| `PUT` | `/balances-fondo/{id}` | Escritura |
| `DELETE` | `/balances-fondo/{id}` | Escritura |

**Cambios en frontend:**
- `crowdlending` signal → HTTP
- `myInvestorFunds`, `fundBalances` signals → HTTP
- CRUD methods → HTTP

**Pantallas afectadas:**
- **EntryForm (Mintos, Equito, Urbanitae, MyInvestor)** — formularios de crowdlending y fondos funcionales

**Verificación:** Se pueden registrar inversiones crowdlending y fondos MyInvestor con saldos mensuales.

---

### Fase 6 — Planificación (nómina)

**Por qué:** Entidades independientes. Solo afectan a la pantalla de Nómina.

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `GET` | `/asignaciones-salario?anio&mes` | Lectura |
| `POST` | `/asignaciones-salario` | Escritura |
| `PUT` | `/asignaciones-salario/{id}` | Escritura |
| `DELETE` | `/asignaciones-salario/{id}` | Escritura |
| `GET` | `/compromisos` | Lectura |
| `POST` | `/compromisos` | Escritura |
| `PUT` | `/compromisos/{id}` | Escritura |
| `DELETE` | `/compromisos/{id}` | Escritura |

**Cambios en frontend:**
- `salaryAllocations`, `commitments` signals → HTTP
- CRUD methods → HTTP

**Pantallas afectadas:**
- **Income** — distribución de sueldo, configuración y compromisos funcionales

**Verificación:** Se pueden crear distribuciones de sueldo y compromisos. Persisten entre sesiones.

---

### Fase 7 — CRUD de plataformas y cuentas

**Por qué:** Ya se leen en Fase 1. Ahora se añade escritura para gestión administrativa.

**Endpoints a crear:**

| Método | Ruta | Tipo |
|---|---|---|
| `POST` | `/plataformas` | Escritura |
| `PUT` | `/plataformas/{id}` | Escritura |
| `DELETE` | `/plataformas/{id}` | Escritura |
| `POST` | `/cuentas` | Escritura |
| `PUT` | `/cuentas/{id}` | Escritura |
| `DELETE` | `/cuentas/{id}` | Escritura |

**Cambios en frontend:**
- Opcional: pantalla de admin para gestionar plataformas/cuentas
- O mantener como datos semilla y no exponer UI

**Verificación:** Se pueden crear/editar/eliminar plataformas y cuentas desde la API.

---

### Resumen visual

```
Fase 1 ──── Fase 2 ──── Fase 3 ──── Fase 4 ──── Fase 5 ──── Fase 6 ──── Fase 7
base        core         gastos/      inversiones   crowdlending   nómina       admin
 datos                   ingresos                                 config       plataformas
                                                                             
 lectura     lectura      lectura      lectura        lectura       lectura      escritura
 + escritura + escritura  + escritura  + escritura    + escritura   + escritura
                                                                             
 Dashboard   Dashboard    MonthlyView  PlatformDetail EntryForm     Income       Admin
 + todas     + MonthlyView + EntryForm  + TradeLog    (Mintos,      (Nómina)     panel
             + EntryForm   + Income     + EntryForm    Equito,
                                              (Trades)  Urbanitae,
                                                        MyInvestor)
```

### Orden de pantallas migradas

| Orden | Pantalla | Fase que la completa |
|---|---|---|
| 1 | Dashboard | Fase 2 ✅ |
| 2 | MonthlyView | Fase 3 |
| 3 | PlatformDetail | Fase 4 |
| 4 | Trends | Fase 2 ✅ |
| 5 | TradeLog | Fase 4 |
| 6 | EntryForm | Fase 5 (todas las tabs) |
| 7 | Income | Fase 6 |
