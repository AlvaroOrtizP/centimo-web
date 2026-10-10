# Entidad: CryptoBalance — Balance mensual de cripto (Bitvavo)

> **Implementado:** `false`

Entidad dedicada a la inversión en criptomonedas. Actualmente el proyecto gestiona Bitvavo con el modelo genérico (plataforma `bitvavo` tipo `cripto` + cuenta `bitvavo-main` + instantáneas mensuales). Esta entidad propia guarda el balance mensual de la cartera de cripto de forma dedicada, como `revolut_balances` o `acciones_balances`, sin depender de instantáneas genéricas.

## Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | Clave natural `{AAAA-MM}` (p. ej. `2026-07`) |
| `mes` | VARCHAR(7) | Fecha mes-año en **una sola columna** (formato `YYYY-MM`) |
| `valor_total` | NUMERIC(12,2) | Valor total de la cartera de cripto a final de mes |
| `aporte_mensual` | NUMERIC(12,2) | Importe añadido ese mes (el aporte extra; puede ser 0) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

## Identificador

Fila única por `mes` ⇒ **clave natural legible `{AAAA-MM}`** (p. ej. `2026-07`), como `revolut_balances` y `acciones_balances`.

- Se refuerza con `UNIQUE(mes)` como red de seguridad.

**Decidido:** identificador natural `{AAAA-MM}`.

## Esquema de la tabla

```sql
CREATE TABLE crypto_balances (
  id                   VARCHAR(50)   PRIMARY KEY,
  mes                  VARCHAR(7)    NOT NULL UNIQUE,
  valor_total          NUMERIC(12,2) NOT NULL,
  aporte_mensual       NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_creacion       TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP     DEFAULT NOW()
);

COMMENT ON COLUMN crypto_balances.id IS 'Clave natural {AAAA-MM} (p. ej. 2026-07)';
COMMENT ON COLUMN crypto_balances.mes IS 'Fecha mes-año en una sola columna (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN crypto_balances.valor_total IS 'Valor total de la cartera de cripto a final de mes';
COMMENT ON COLUMN crypto_balances.aporte_mensual IS 'Importe añadido ese mes (el aporte extra; puede ser 0)';
COMMENT ON COLUMN crypto_balances.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN crypto_balances.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

> **Pendiente:** la tabla cubre la cartera de cripto en su conjunto (ahora solo existe Bitvavo). Si en el futuro entrara otra exchange, se añadiría una columna `plataforma` y la clave pasaría a `{plataforma}-{AAAA-MM}`.

## Endpoints

| Método | Path | Body / Query params | Uso |
|---|---|---|---|
| POST | `/crypto/balances` | `CryptoBalanceRequest` (mes, valor_total, aporte_mensual) | Crear o actualizar el balance de un mes (upsert por `mes`) |
| GET | `/crypto/balances` | `limit` (opcional con default), `order` (`asc`/`desc` por `mes`, opcional) | Listar los N últimos/primeros meses |
| PUT | `/crypto/balances/{id}` | `CryptoBalanceRequest` (mes, valor_total, aporte_mensual) | Actualizar el balance de un mes (`{AAAA-MM}`) |
| DELETE | `/crypto/balances/{id}` | — | Eliminar el balance de un mes (`{AAAA-MM}`) |

## Reglas de diseño

- Modelo de dominio: `CryptoBalance` (`id, mes, valorTotal, aporteMensual` + fechas), con `mes` de tipo `String` (`YYYY-MM`).
- Entidad JPA: `CryptoBalanceMO` (`@Table(name = "crypto_balances")`).
- **Convivencia con el modelo actual:** Bitvavo seguirá apareciendo en la pantalla de plataformas a través del modelo genérico (plataforma + cuenta + instantáneas). Esta entidad es un balance dedicado adicional; decidir en el momento de implementar si la pantalla de cripto pasa a leer de `crypto_balances` o conviven ambas fuentes.
- `mes` inmutable en el `UPDATE`: solo se actualizan `valor_total` y `aporte_mensual`.
- Sin FK a `cuentas` ni a `plataformas`.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `CryptoBalance` (domain model), `CryptoBalanceDrivingPort`, `CryptoBalanceUseCase`, `CryptoBalanceDrivenPort`.
- **Capa driven**: `CryptoBalanceMO`, `CryptoBalanceRepository`, `CryptoBalanceDatasourceAdapter`, `CryptoBalanceDatasourceMapper`.
- **Capa driving**: controlador implementando `CryptoBalanceApi` (swagger), `CryptoBalanceApiMapper`.
- **Swagger**: nuevos schemas y paths para el CRUD de `CryptoBalance`.
- **Flyway**: nueva migración `V24__create_crypto_balances.sql`.
- **Tests**: no hay IT de cripto actualmente; se podrá crear un `CryptoIT` para el CRUD mensual.