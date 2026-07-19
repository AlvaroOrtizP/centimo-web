# Backend — Centimo

Documentación completa del backend: tablas, endpoints, modelos de datos y su uso en cada pantalla.

---

## 1. Visión general

Centimo es una app de finanzas personales. El backend gestiona plataformas financieras, cuentas, snapshots mensuales, inversiones, gastos, ingresos y configuración de nómina.

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
| `alertas` | Avisos para meses concretos |
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
alertas (independiente)
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

Compromisos de pago — gastos recurrentes o puntuales.

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

**Filtrado por mes (`buscarCompromisosPorMes(mes)`):**
```
mensual → SIEMPRE se incluye
anual   → solo si c.mes = mes
unico   → solo si c.mes = mes AND (c.anio = null OR c.anio = anioActual)
```

---

### 2.14 `alertas`

Alertas que se muestran como aviso amarillo en la pestaña de Distribución Mensual.

```sql
CREATE TABLE alertas (
  id                  VARCHAR(50)  PRIMARY KEY,
  descripcion         VARCHAR(200) NOT NULL,
  mes                 INTEGER      NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio                INTEGER      NOT NULL,
  fecha_creacion      TIMESTAMP    DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_alertas_fecha ON alertas(anio, mes);
```

**Lógica de negocio:**
- Cada alerta se asocia a un mes+año concretos
- `buscarAlertasPorAnioYMes(anio, mes)` devuelve las alertas que coinciden exactamente con el mes indicado
- En la UI, si existe al menos una alerta para el mes actual, se muestra un banner amarillo

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

### CategoriaGasto
`aseo` · `coche` · `comida` · `discord` · `ejercicio` · `hacienda` · `medicamento` · `ocio` · `otros` · `trabajo`

### EstadoProyecto (crowdlending)
`activo` · `completado` · `impagado`

---

## 4. Endpoints

### 4.1 Plataformas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/plataformas` | Listar plataformas |
| `GET` | `/plataformas/{id}` | Obtener plataforma |
| `POST` | `/plataformas` | Crear plataforma |
| `PUT` | `/plataformas/{id}` | Actualizar plataforma |
| `DELETE` | `/plataformas/{id}` | Eliminar plataforma |

### 4.2 Cuentas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/cuentas` | Listar cuentas (filtro `?plataformaId=`) |
| `GET` | `/cuentas/{id}` | Obtener cuenta |
| `POST` | `/cuentas` | Crear cuenta |
| `PUT` | `/cuentas/{id}` | Actualizar cuenta |
| `DELETE` | `/cuentas/{id}` | Eliminar cuenta |

### 4.3 Instantáneas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/instantaneas?anio&mes&cuentaId` | Listar instantáneas (filtros opcionales) |
| `GET` | `/instantaneas/{id}` | Obtener instantánea |
| `POST` | `/instantaneas` | Crear instantánea |
| `POST` | `/instantaneas/upsert` | Crear o actualizar (upsert) |
| `PUT` | `/instantaneas/{id}` | Actualizar instantánea |
| `DELETE` | `/instantaneas/{id}` | Eliminar instantánea |
| `POST` | `/instantaneas/{instantaneaId}/tareas/{elementoId}/alternar` | Alternar elemento de la lista de tareas |

### 4.4 Posiciones de inversión

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/posiciones?instantaneaId` | Listar posiciones de una instantánea |
| `POST` | `/posiciones` | Crear posición |
| `DELETE` | `/posiciones/{id}` | Eliminar posición |

### 4.5 Operaciones de inversión

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/operaciones?cuentaId` | Listar operaciones (filtro por cuenta) |
| `POST` | `/operaciones` | Crear operación |
| `DELETE` | `/operaciones/{id}` | Eliminar operación |

### 4.6 Gastos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/gastos?instantaneaId` | Listar gastos de la instantánea |
| `POST` | `/gastos` | Crear gasto |
| `DELETE` | `/gastos/{id}?instantaneaId` | Eliminar gasto (decrementa gastos de la instantánea) |

### 4.7 Ingresos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/ingresos?instantaneaId` | Listar ingresos de la instantánea |
| `POST` | `/ingresos` | Crear ingreso |
| `DELETE` | `/ingresos/{id}?instantaneaId` | Eliminar ingreso (decrementa ingresos de la instantánea) |

### 4.8 Crowdlending

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/crowdlending?plataformaId` | Listar inversiones crowdlending |
| `POST` | `/crowdlending` | Crear inversión crowdlending |
| `DELETE` | `/crowdlending/{id}` | Eliminar inversión crowdlending |

### 4.9 Fondos MyInvestor

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/fondos-myinvestor` | Listar fondos |
| `GET` | `/fondos-myinvestor/{id}` | Obtener fondo |
| `POST` | `/fondos-myinvestor` | Crear fondo |
| `PUT` | `/fondos-myinvestor/{id}` | Actualizar fondo |
| `DELETE` | `/fondos-myinvestor/{id}` | Eliminar fondo |

### 4.10 Balances de fondo

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/balances-fondo?anio&mes` | Listar saldos del mes |
| `POST` | `/balances-fondo` | Crear saldo |
| `PUT` | `/balances-fondo/{id}` | Actualizar saldo |
| `DELETE` | `/balances-fondo/{id}` | Eliminar saldo |

### 4.11 Asignaciones de salario

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/asignaciones-salario?anio&mes` | Distribuciones del mes |
| `POST` | `/asignaciones-salario` | Crear distribución |
| `PUT` | `/asignaciones-salario/{id}` | Actualizar distribución |
| `DELETE` | `/asignaciones-salario/{id}` | Eliminar distribución |

### 4.12 Compromisos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/compromisos` | Todos los compromisos |
| `GET` | `/compromisos?mes=` | Compromisos filtrados por mes |
| `GET` | `/compromisos/{id}` | Obtener compromiso |
| `POST` | `/compromisos` | Crear compromiso |
| `PUT` | `/compromisos/{id}` | Actualizar compromiso |
| `DELETE` | `/compromisos/{id}` | Eliminar compromiso |

### 4.13 Alertas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/alertas?anio&mes` | Listar alertas (filtros opcionales) |
| `GET` | `/alertas/{id}` | Obtener alerta |
| `POST` | `/alertas` | Crear alerta |
| `PUT` | `/alertas/{id}` | Actualizar alerta |
| `DELETE` | `/alertas/{id}` | Eliminar alerta |

---

## 5. Uso por pantalla

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
| `GET/POST/PUT/DELETE /alertas` | CRUD de alertas |
| `GET /instantaneas?cuentaId` | Buscar snapshot para registrar ingresos |
| `GET/POST/DELETE /ingresos` | CRUD de ingresos del mes |

**Entidades consumidas:** Platform, SalaryAllocation, Commitment, Alert, MonthlySnapshot, IncomeSource

---

## 6. Mapeo Plataforma → Datos concretos

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

## 7. Datos mock (sin API)

Mientras no haya backend, los datos iniciales se cargan desde archivos JSON en `src/assets/data/`. Los formularios de entrada mutan las signals en memoria. Cuando llegue la API, se sustituirán los imports JSON por `HttpClient.get()`.
