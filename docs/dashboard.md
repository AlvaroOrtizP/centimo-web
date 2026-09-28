# Dashboard — Balance mensual consolidado de todas las entidades

> **Implementado:** `false`

Vista agregada del dashboard, con **tres endpoints de solo lectura** que consultan el **balance mensual de cada entidad** financiera del proyecto. No guarda nada propio: lee de las tablas de balance de las demás entidades (`revolut_balances`, `equito_balances`, `urbanitae_balances`, `mintos`, `acciones_balances`, `crypto_balances`, `b100_balances`, `banco_balances`, `balances_fondo`, `gastos`).

| Endpoint | Path | Pregunta que responde |
|---|---|---|
| 1 | `GET /dashboard/balances` | ¿Cómo se reparten mis datos **este mes** entre todas las entidades? → una fila por entidad + `total` |
| 2 | `GET /dashboard/balances/serie` | ¿Cómo evoluciona **una entidad** durante los **últimos X meses**? → una fila por mes |
| 3 | `GET /dashboard/categorias/serie` | ¿Cómo evolucionan las entidades de **una categoría** (Liquidez, Fija, Variable, Todas) durante los **últimos X meses**? → una fila por entidad y mes |

## Fuente de cada entidad

El dashboard no inventa el balance: cada entidad aporta el valor de su tabla de balance para el mes consultado.

| Código | Entidad | Tabla fuente | Campo balance | Campo aporte | Clave de unicidad |
|---|---|---|---|---|---|
| `revolut` | Revolut | `revolut_balances` | `balance_mensual` | `aporte_mensual` | `mes` |
| `equito` | Equito | `equito_balances` | `balance_mensual` | `aporte_mensual` | `mes` |
| `urbanitae` | Urbanitae | `urbanitae_balances` | `balance_mensual` | `aporte_mensual` | `mes` |
| `mintos` | Mintos | `mintos` | `valor_final` | `importe_añadido` | `mes` |
| `acciones` | Acciones | `acciones_balances` | `valor_total` | `aporte_mensual` | `mes` |
| `crypto` | Cripto | `crypto_balances` | `valor_total` | `aporte_mensual` | `mes` |
| `b100` | B100 | `b100_balances` | suma de `balance_mensual` de sus subcuentas | suma de `aporte_mensual` | `(tipo_subcuenta, mes)` |
| `myinvestor` | MyInvestor | `balances_fondo` | suma de `saldo` de sus activos | suma de `aportacion` | `(fondo_id, anio, mes)` |
| `bbva`, `caixabank`… | Bancos | `banco_balances` | `balance_mensual` | `aporte_mensual` | `(entidad, mes)` |
| `gastos` | Gastos | `gastos` | suma de `cantidad` | — (siempre 0) | periodo derivado de `fecha` |

> **Notas:**
> - **B100**: una sola fila en el dashboard con el total de sus subcuentas (`save` + `health`). El detalle por subcuenta se consulta en `/b100-balances`.
> - **MyInvestor**: una sola fila con el total de sus activos (fondos + roboadvisor). El desglose por activo se consulta en `/fund-balances`. Su `balances_fondo` guarda `anio`/`mes` en dos columnas numéricas: el dashboard convierte el `YYYY-MM` recibido en `anio` y `mes` para filtrar.
> - **Bancos**: una fila **por banco** (`bbva`, `caixabank`…), no una fila agregada: son entidades distintas. En el endpoint 1 cada banco es su propia fila; en el endpoint 2 se pueden pedir uno a uno (`entidad=bbva`) o todos juntos (sumando todas las filas de `banco_balances`).
> - **Gastos** (`gastos`) no tiene balance de patrimonio, con lo que **no participa del `total` agregado** ni del endpoint 1. Aun así es un valor seleccionable en el endpoint 2 (`entidad=gastos`) para pintarlo como serie propia. Su tabla no tiene columna de mes: el periodo se deriva de `fecha`, y **solo tiene un importe** (`cantidad`), sin distinguir ingreso de gasto. Por eso su `aporte` es siempre `0`.
> - **Acciones** (`acciones_balances`) y **Cripto** (`crypto_balances`) están planificadas pero **aún no existen en el repo** (solo hay doc de diseño). Hasta que se implementen no devuelven fila; el resto del endpoint no se ven afectado.

## Identificador y total

- Cada fila de la respuesta se identifica por su **código de entidad** (p. ej. `revolut`, `bbva`). Es el mismo valor que el front utiliza para mostrar la tarjeta.
- El campo `total` es la suma de los `balance` de todas las filas devueltas en el mes.

**Decidido:** una fila por entidad con su balance y aporte del mes, más un `total` global. Si una entidad no tiene registro del mes consultado, no aparece en la respuesta (y por tanto no suma al total).

## Endpoint

### 1. Obtener balance mensual del dashboard (GET)

| Método | Path | Query params | Respuesta |
|---|---|---|---|
| GET | `/dashboard/balances` | `mes` (`YYYY-MM`, **obligatorio**) | `DashboardResponse` (total + lista de `DashboardEntityBalance`) |

Ejemplo de respuesta con `mes=2026-07`:

```json
{
  "mes": "2026-07",
  "total": 94500.00,
  "entidades": [
    { "codigo": "revolut",  "nombre": "Revolut",   "balance": 12400.00, "aporte": 0.00 },
    { "codigo": "bbva",     "nombre": "BBVA",      "balance": 5000.00,  "aporte": 100.00 },
    { "codigo": "b100",     "nombre": "B100",      "balance": 10000.00, "aporte": 800.00 },
    { "codigo": "equito",   "nombre": "Equito",    "balance": 9000.00,  "aporte": 300.00 },
    { "codigo": "urbanitae","nombre": "Urbanitae", "balance": 12000.00, "aporte": 500.00 },
    { "codigo": "mintos",   "nombre": "Mintos",    "balance": 8500.00,  "aporte": 0.00 },
    { "codigo": "acciones", "nombre": "Acciones",  "balance": 18000.00, "aporte": 1000.00 },
    { "codigo": "crypto",   "nombre": "Cripto",    "balance": 4300.00,  "aporte": 200.00 },
    { "codigo": "myinvestor","nombre": "MyInvestor","balance": 15300.00,"aporte": 1500.00 }
  ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `mes` | string | Mes consultado (`YYYY-MM`) |
| `total` | number | Suma de `balance` de todas las entidades |
| `entidades[].codigo` | string | Identificador de la entidad (p. ej. `revolut`, `bbva`, `b100`) |
| `entidades[].nombre` | string | Nombre legible para el front |
| `entidades[].balance` | number | Balance de la entidad a final del mes |
| `entidades[].aporte` | number | Aporte hecho ese mes (0 si la entidad no registra aporte) |

> Las filas `acciones` y `crypto` del ejemplo no se devolverán hasta que existan `acciones_balances` y `crypto_balances` (ver nota en *Fuente de cada entidad*).

### 2. Obtener serie de balances por entidad (GET)

Devuelve la **evolución mensual** de **una entidad** concreta o, si no se indica entidad, la **evolución del total agregado**. El rango es el mes recibido (`mes`, el más reciente de la serie) más los `mesesAtras` meses anteriores.

| Método | Path | Query params | Respuesta |
|---|---|---|---|
| GET | `/dashboard/balances/serie` | `mes` (`YYYY-MM`, **obligatorio**), `entidad` (opcional), `mesesAtras` (opcional, default `6`) | `array` de `DashboardSerieBalance` |

| Query param | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `mes` | string `YYYY-MM` | sí | — | **Mes ancla**: el último (más reciente) mes de la serie |
| `entidad` | string | no | — | Código de entidad. Si se omite, cada fila es el **total agregado** de todas las entidades (excluidos gastos) |
| `mesesAtras` | integer `0..24` | no | `6` | Meses anteriores a incluir. El número de filas devueltas es **`mesesAtras + 1`** |

Valores admitidos en `entidad`: `revolut`, `equito`, `urbanitae`, `mintos`, `b100`, `myinvestor`, `gastos`, y los códigos de banco que existan en `banco_balances.entidad` (`bbva`, `caixabank`…). Un valor no reconocido devuelve `400`.

Ejemplo con `mes=2026-07`, `entidad=b100`, `mesesAtras=6` → **7 filas** (2026-01 … 2026-07):

```json
[
  { "mes": "2026-01", "balance": 9200.00,  "aporte": 800.00 },
  { "mes": "2026-02", "balance": 9450.50,  "aporte": 800.00 },
  { "mes": "2026-03", "balance": 9800.00,  "aporte": 800.00 },
  { "mes": "2026-04", "balance": 0.00,     "aporte": 0.00 },
  { "mes": "2026-05", "balance": 10250.75, "aporte": 800.00 },
  { "mes": "2026-06", "balance": 10500.00, "aporte": 800.00 },
  { "mes": "2026-07", "balance": 10000.00, "aporte": 800.00 }
]
```

Ejemplo **sin `entidad`** (`mes=2026-06`, `mesesAtras=2`) → el total de todas las entidades de cada mes, **sin sumar `gastos`**:

```json
[
  { "mes": "2026-04", "balance": 91200.00, "aporte": 2700.00 },
  { "mes": "2026-05", "balance": 93650.75, "aporte": 2900.00 },
  { "mes": "2026-06", "balance": 94500.00, "aporte": 3000.00 }
]
```

Ejemplo con `entidad=gastos` → suma de `cantidad` de los gastos de cada mes, con `aporte` siempre a `0`:

```json
[
  { "mes": "2026-04", "balance": 1180.20, "aporte": 0.00 },
  { "mes": "2026-05", "balance": 1345.75, "aporte": 0.00 },
  { "mes": "2026-06", "balance": 1090.00, "aporte": 0.00 }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `mes` | string | Mes de la fila (`YYYY-MM`) |
| `balance` | number | Balance de la entidad (o total agregado) a final del mes. `0` si no hay registro ese mes |
| `aporte` | number | Aporte del mes. `0` si no hay registro, y siempre `0` en el caso de `entidad=gastos` |

**Reglas del endpoint 2:**

- **Número de filas = `mesesAtras + 1`.** Con el valor actual del front (`mesesAtras=6`) son 7 filas: el mes ancla y los 6 anteriores. El rango cruza año con normalidad (ancla `2026-02` → serie desde `2025-08`).
- **Los meses sin datos se devuelven con `balance: 0` y `aporte: 0`**, no se omiten: el rango es fijo y la serie no tiene huecos para el front.
- **Orden ascendente** por `mes` (del más antiguo al más reciente). Si el front necesita el orden inverso, lo revierte en cliente.
- **Sin `entidad`, cada fila es la suma de todas las entidades** (revolut, equito, urbanitae, mintos, b100, myinvestor y todos los bancos) de ese mes, **`gastos` excluido**. El `aporte` es igualmente la suma de los aportes de esas mismas fuentes.
- **Agregación por entidad**: `b100` suma sus subcuentas `save` + `health`; `myinvestor` suma el `saldo` de todos sus activos; `b100`/`myinvestor`/bancos devuelven una única fila consolidada por mes, no una por subcuenta, fondo o banco.
- `mesesAtras` fuera de rango (`< 0` o `> 24`) o `mes` con formato inválido → `400`.

### 3. Obtener serie de balances por categoría (GET)

Igual que el endpoint 2, pero en vez de filtrar por **entidad** se filtra por **categoría** de activo, y cada mes devuelve el **detalle de todas las entidades** que pertenecen a esa categoría (no una fila agregada).

| Método | Path | Query params | Respuesta |
|---|---|---|---|
| GET | `/dashboard/categorias/serie` | `categoria` (**obligatorio**), `mes` (`YYYY-MM`, **obligatorio**), `mesesAtras` (opcional, default `6`) | `array` de `DashboardCategoriaBalance` |

| Query param | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `categoria` | enum | sí | — | `Liquidez`, `Fija`, `Variable` o `Todas` |
| `mes` | string `YYYY-MM` | sí | — | **Mes ancla**: el último (más reciente) mes de la serie |
| `mesesAtras` | integer `0..24` | no | `6` | Meses anteriores a incluir. Cada mes produce una fila por entidad de la categoría |

A diferencia del parámetro `entidad` del endpoint 2, **`categoria` sí es un conjunto cerrado** (`Todas`, `Liquidez`, `Fija`, `Variable`), por lo que se declara como `enum` en el swagger. Un valor fuera del conjunto devuelve `400`.

#### Mapa de categorías

La clasificación es un concepto de dominio, no de persistencia: no hay columna que la guarde, es un enum con el código de cada entidad.

| Categoría | Entidades que la componen |
|---|---|
| `Liquidez` | `revolut`, `bbva`, `caixabank`, `b100` |
| `Fija` | `mintos`, `equito`, `urbanitae` |
| `Variable` | `myinvestor`, `crypto`, `acciones` |
| `Todas` | Las tres categorías a la vez (10 códigos), **sin `gastos`** |

> **Gastos no pertenece a ninguna categoría**: no es patrimonio. Se puede pedir aparte como serie propia con `entidad=gastos` en el endpoint 2, pero no aparece en ninguna serie por categoría, ni siquiera en `Todas`.

Ejemplo con `categoria=Liquidez`, `mes=2026-06`, `mesesAtras=2` → 4 entidades × 3 meses = **12 filas**:

```json
[
  { "mes": "2026-04", "codigo": "revolut",    "balance": 12100.00, "aporte": 0.00 },
  { "mes": "2026-04", "codigo": "bbva",       "balance": 4800.00,  "aporte": 100.00 },
  { "mes": "2026-04", "codigo": "caixabank",  "balance": 2100.00,  "aporte": 0.00 },
  { "mes": "2026-04", "codigo": "b100",       "balance": 9500.00,  "aporte": 800.00 },
  { "mes": "2026-05", "codigo": "revolut",    "balance": 12250.00, "aporte": 0.00 },
  { "mes": "2026-05", "codigo": "bbva",       "balance": 4900.00,  "aporte": 100.00 },
  { "mes": "2026-05", "codigo": "caixabank",  "balance": 2200.00,  "aporte": 0.00 },
  { "mes": "2026-05", "codigo": "b100",       "balance": 9800.00,  "aporte": 800.00 },
  { "mes": "2026-06", "codigo": "revolut",    "balance": 12400.00, "aporte": 0.00 },
  { "mes": "2026-06", "codigo": "bbva",       "balance": 5000.00,  "aporte": 100.00 },
  { "mes": "2026-06", "codigo": "caixabank",  "balance": 2300.00,  "aporte": 0.00 },
  { "mes": "2026-06", "codigo": "b100",       "balance": 10000.00, "aporte": 800.00 }
]
```

**Reglas del endpoint 3:**

- **Una fila por entidad y mes**, con el mismo criterio de agregación interna que el endpoint 2: `b100` aparece como una única fila consolidada (sus subcuentas `save` + `health` ya sumadas) y `myinvestor` como una única fila consolidada (la suma del `saldo` de sus activos). No hay una fila por subcuenta, fondo o banco.
- **El número de filas es determinista**: `(entidades de la categoría) × (mesesAtras + 1)`, y lo fija el **enum de la categoría**, no lo que haya en la BD. Ej.: `Liquidez` con `mesesAtras=6` → 4 × 7 = **28 filas**; `Todas` → 10 × 7 = **70 filas**, de las cuales las de `crypto` y `acciones` salen a `0` mientras no existan sus tablas. `b100` y `myinvestor` no multiplican más porque van consolidados.
- **Cada entidad × mes sin datos devuelve `balance: 0` y `aporte: 0`**, igual que el endpoint 2: el rango es fijo y la serie no tiene huecos. Esto aplica también a entidades todavía no implementadas (`crypto`, `acciones`), que se quedan con `0` mientras no existan sus tablas.
- **Sin total por mes ni por categoría**: cada fila es el dato de una entidad. Si el front quiere el total de la categoría, lo suma en cliente a partir de las filas.
- **Orden**: ascendente por `mes` y, dentro de cada mes, por el orden de la categoría declarado en el mapa (Liquidez: Revolut, BBVA, CaixaBank, B100; Fija: Mintos, Equito, Urbanitae; Variable: MyInvestor, Cripto, Acciones; `Todas`: Liquidez → Fija → Variable).
- **Sin `nombre` en la fila**: es metadato estático que el front ya tiene de las tarjetas del endpoint 1; duplicarlo en hasta 70 filas es ruido.
- Mismas validaciones que el endpoint 2: `mesesAtras` fuera de `0..24` o `mes` con formato inválido → `400`.

## Reglas de diseño

- **Sin tabla propia ni migración**: el dashboard es una consulta de solo lectura sobre las tablas de balance existentes. Cuando una entidad no esté aún implementada, simplemente no devuelve fila.
- Modelo de dominio: `DashboardBalance` (`mes, total, entidades: List<DashboardEntityBalance>`) y `DashboardSerieBalance` (`mes, balance, aporte`), con `DashboardEntityBalance` (`codigo, nombre, balance, aporte`) y `DashboardCategoriaBalance` (`mes, codigo, balance, aporte`), dinero en `BigDecimal`.
- El `DashboardUseCase` inyecta los **puertos driven de cada entidad** (`RevolutBalanceDrivenPort`, `BancoBalanceDrivenPort`, `B100BalanceDrivenPort`, `FundBalanceDrivenPort`, `InteresAnualMintosDrivenPort`, `GastoDrivenPort`, …) y agrega por `mes`. No crea un puerto driven propio.
- Se delega en cada port existente en lugar de hacer un `JOIN` entre tablas: cada entidad conoce su propia fuente y clave; el dashboard se mantiene desacoplado de la persistencia.
- Sin `total` calculado en BD: se calcula en la capa de aplicación sumando los balances devueltos.
- **El rango de meses se construye en la capa de aplicación** con `YearMonth`: `YearMonth.parse(mes)` da el ancla y `minusMonths(i)` los anteriores (el formato `YYYY-MM` se mantiene correcto al cruzar de año). Para `balances_fondo` se usan `getYear()`/`getMonthValue()`; para `gastos`, `YearMonth.atDay(1)`/`atEndOfMonth()` sobre `fecha`.
- **La clasificación por categoría es dominio puro**: un enum `CategoriaEntidad` (`Liquidez`, `Fija`, `Variable`, `Todas`) que sabe qué códigos de entidad contiene cada una, más el orden de salida. No se persiste ni se deduce de la BD: no hay columna de categoría en ninguna tabla.
- **El endpoint 3 reutiliza el endpoint 2**: `DashboardUseCase` resuelve la categoría a su lista de códigos, y para cada código pide su serie por la misma vía que `entidad`. No hay una segunda ruta de agregación.
- Orden de las filas del endpoint 1: en orden establecido por el front (según la posición de las tarjetas). **Decidido:** el front reordena; el endpoint devuelve las entidades en el orden de la tabla de fuentes (Revolut, Equito, Urbanitae, Mintos, Acciones, Cripto, B100, MyInvestor, Bancos).

## Capas de implementación prevista

- **Capa de aplicación**: `DashboardBalance`, `DashboardSerieBalance`, `DashboardEntityBalance`, `DashboardCategoriaBalance` (domain models), enums `CategoriaEntidad` y el de códigos de entidad, `DashboardDrivingPort`, `DashboardUseCase`, `DashboardDrivenPort` no necesario (se reutilizan los ports de cada entidad).
- **Capa driving**: `DashboardController` implementando `DashboardApi` (swagger, tag `Dashboard`), `DashboardApiMapper`.
- **Swagger**: tag `Dashboard` con tres paths — `/dashboard/balances` (`mes`), `/dashboard/balances/serie` (`mes`, `entidad`, `mesesAtras`) y `/dashboard/categorias/serie` (`categoria`, `mes`, `mesesAtras`) — y schemas `DashboardResponse`, `DashboardEntityBalance`, `DashboardSerieBalance`, `DashboardCategoriaBalance`. Los tres en el mismo tag → una sola interfaz `DashboardApi` con tres métodos.
- **Flyway**: ninguna.
- **Tests**: `DashboardIT` que siembra balances de distintas entidades para un mes y comprueba el `total` y la lista de entidades del endpoint 1; para el endpoint 2, siembra varios meses (incluido un mes sin registros y un rango que cruce año) y comprueba el número de filas, el orden, los ceros y el total agregado; y para el endpoint 3, comprueba el desglose por categoría (que `Liquidez` devuelve revolut + los bancos + b100, que `Fija` no devuelve bancos, que `Todas` no incluye `gastos`, y que el número de filas es entidades × meses).

### Métodos de puerto que hay que añadir

Los ports actuales solo filtran por **un** mes o dan `limit` sobre un subconjunto; para los endpoints 2 y 3 hacen falta consultas por **rango de meses**. Todos son de lectura y en la capa `driven`:

| Puerto | Método a añadir | Uso |
|---|---|---|
| `RevolutBalanceDrivenPort` | `List<RevolutBalance> findByMesIn(List<String> meses)` | Serie de revolut |
| `EquitoBalanceDrivenPort` | `List<EquitoBalance> findByMesIn(List<String> meses)` | Serie de equito |
| `UrbanitaeBalanceDrivenPort` | `List<UrbanitaeBalance> findByMesIn(List<String> meses)` | Serie de urbanitae |
| `InteresAnualMintosDrivenPort` | `List<InteresAnualMintos> findByMesIn(List<String> meses)` | Serie de mintos (tabla `mintos`, no tiene `…Balance…` en el nombre) |
| `B100BalanceDrivenPort` | `List<B100Balance> findByTipoSubcuentaAndMesIn(TipoSubcuentaB100 tipo, List<String> meses)` | Serie de b100 (una llamada por cada `TipoSubcuentaB100`) |
| `BancoBalanceDrivenPort` | `List<BancoBalance> findByEntidadInAndMesIn(List<String> entidades, List<String> meses)`, `List<BancoBalance> findByMesIn(List<String> meses)` y `List<String> findEntidades()` | Serie de un banco, serie de **todos** los bancos del mes, y resolver qué códigos de banco existen. La variante `In` en la entidad es la que necesita el endpoint 3, porque `Liquidez` agrupa `bbva` y `caixabank` en una sola consulta |
| `FundBalanceDrivenPort` | `List<BalanceFondo> findByAnioAndMesIn(List<Integer> anios, List<Integer> meses)` | Serie de myinvestor (o reutilizar `findByAnioAndMes` por mes) |
| `GastoDrivenPort` | — | Ya tiene `findByPeriodo(year, month, order)`, reutilizable |

## Decisiones pendientes / riesgos

1. **Hay que crear el enum de códigos de entidad.** El `codigo` del dashboard no tiene tipo de dominio, y la tabla `plataformas` (con `id`, `nombre`, `tipo`, `orden`) **ya no existe** — se eliminó en la puesta a cero del proyecto. El endpoint 3 lo hace inevitable: el mapa de categorías necesita una fuente de verdad con código, nombre legible y categoría de cada entidad. Propuesta: un enum de dominio en `application/.../domain/enums/` con `codigo`, `nombre` y `CategoriaEntidad` por valor. No requiere migración y evita hardcodear el mapa en varios sitios. La alternativa (b), recrear `plataformas` con una migración nueva, solo se justifica si además se quiere persistir el `orden`/`icono`/`color` de las tarjetas.
2. **Un banco nuevo no aparece en las categorías hasta añadirlo al enum.** `banco_balances.entidad` es texto libre (`VARCHAR(50)`), sin FK ni catálogo: si alguien mete `bankinter` en la tabla, el endpoint 2 lo seguirá resolviendo (búsqueda dinámica) pero **no pertenece a ninguna categoría**, así que no saldrá en el endpoint 3. Conviene recordarlo al dar de alta un banco nuevo.
3. **`entidad` del endpoint 2 no puede ser `enum` cerrado en el swagger** (por el punto anterior, el conjunto de bancos es abierto), a diferencia de `categoria` del endpoint 3 que sí lo es. Se documenta `entidad` como `type: string` con la lista de valores válidos en la descripción, y el backend devuelve `400` si no resuelve a ninguna fuente.
4. **Rendimiento / N+1.** El endpoint 2 pide hasta 25 filas × 8 fuentes; el endpoint 3 llega a 70 filas. Conviene resolver el rango **con una consulta por fuente** (los métodos `…MesIn` de la tabla anterior) y no con una llamada por mes; solo `gastos` va por mes, reutilizando `findByPeriodo`.
5. **Nulos en `balances_fondo`.** `intereses`, `aportacion` y `retirada` son **nullable** (a diferencia del `NOT NULL DEFAULT 0` del resto de tablas): al sumar hay que tratar `null` como `0`, o la serie de `myinvestor` devolverá `null` en `aporte` en lugar de `0`.
6. **`acciones` y `crypto` no existen** (`docs/refactor/acciones.md` y `crypto.md` son solo diseño). Hasta que se implementen, `entidad=acciones` y `entidad=crypto` deben devolver `400` (código no reconocido) en el endpoint 2; en el endpoint 3 sus filas salen a `0` dentro de `Variable` y `Todas`.
7. **Nombre de columna con `ñ`**: `mintos.importe_añadido`. Es el campo de `aporte` de mintos; cuidado al escribir `@Query` nativo o SQL a mano.
8. **`gastos` no es un balance de patrimonio.** Es seleccionable como serie propia con `entidad=gastos` (endpoint 2) pero no pertenece a ninguna categoría, así que no aparece nunca en el endpoint 3. Su tabla tiene un único importe `cantidad` (sin separar ingresos de gastos) y el periodo se deriva de `fecha`, así que la suma por mes es puramente informativa.
