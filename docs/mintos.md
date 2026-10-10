# Entidad: InteresAnualMintos — Intereses de Mintos por mes

> **Implementado:** `false`

Entidad dedicada a los intereses de la plataforma Mintos. **Una fila por mes-año**: cada registro guarda el valor final de la cartera de Mintos en un mes concreto (formato `YYYY-MM`, p. ej. `2026-07`), el importe añadido ese mes (el aporte extra, que puede ser 0) y una descripción opcional.

## Datos que guarda

Todos los campos son `NOT NULL` salvo los de auditoría.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(50) PK | UUID generado por la aplicación |
| `mes` | VARCHAR(7) | Fecha mes-año en **una sola columna** (formato `YYYY-MM`, p. ej. `2026-07`) |
| `importe_añadido` | NUMERIC(12,2) | Importe añadido ese mes (el aporte extra; puede ser 0) |
| `valor_final` | NUMERIC(12,2) | Valor final de la cartera al cerrar el mes |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP | Auditoría |

## Identificador

Clave de aplicación (UUID, `VARCHAR(50)`). Una fila por mes-año: `mes` es **`UNIQUE`**, de modo que no puede existir más de un registro para el mismo mes.

- Compatible con la convención `VARCHAR(50)` del proyecto.
- `UNIQUE(mes)` como red de seguridad (una fila por mes-año).
- Fecha mes-año en una sola columna `YYYY-MM`, como `b100_balances.mes`.

## Esquema de la tabla

```sql
CREATE TABLE mintos (
  id                   VARCHAR(50)   PRIMARY KEY,
  mes                  VARCHAR(7)    NOT NULL UNIQUE,
  importe_añadido      NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_final          NUMERIC(12,2) NOT NULL,
  fecha_creacion       TIMESTAMP     DEFAULT NOW(),
  fecha_actualizacion  TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_mintos_mes ON mintos(mes);

COMMENT ON COLUMN mintos.id IS 'UUID generado por la aplicación';
COMMENT ON COLUMN mintos.mes IS 'Fecha mes-año en una sola columna (YYYY-MM, p. ej. 2026-07)';
COMMENT ON COLUMN mintos.importe_añadido IS 'Importe añadido ese mes (el aporte extra; puede ser 0)';
COMMENT ON COLUMN mintos.valor_final IS 'Valor final de la cartera al cerrar el mes';
COMMENT ON COLUMN mintos.fecha_creacion IS 'Auditoría: fecha de creación';
COMMENT ON COLUMN mintos.fecha_actualizacion IS 'Auditoría: fecha de última actualización';
```

> **Adaptación pendiente:** el código y la migración `V15` actuales guardan la tabla `mintos_intereses_anuales` con `anio INTEGER NOT NULL UNIQUE`, `cantidad`, `retencion_impuestos`, `tipo_impositivo` e `importe_neto`. Hay que crear/reemplazar por la tabla `mintos` con `mes`, `importe_añadido` y `valor_final` (nueva migración o ajuste de `V15` si aún no está desplegada), incluir los `COMMENT ON COLUMN`, y ajustar dominio/entidad/repositorio/controlador a los nuevos campos.

## Endpoints

### Crear intereses de un mes (POST)

| Método | Path | Body | Uso |
|---|---|---|---|
| POST | `/mintos/intereses-anuales` | `MintosInterestAnnualCreate` (mes `YYYY-MM`, importeAñadido, valorFinal) | Crear el registro de intereses de un mes-año |

### Listar intereses (GET)

Obtener la lista de intereses por mes-año, opcionalmente filtrada por mes.

| Método | Path | Query params | Uso |
|---|---|---|---|
| GET | `/mintos/intereses-anuales` | `mes` (`YYYY-MM`, opcional) | Listar intereses por mes; si se indica `mes`, devuelve solo ese mes |

### Actualizar intereses de un mes (PUT)

| Método | Path | Body | Uso |
|---|---|---|---|
| PUT | `/mintos/intereses-anuales/{id}` | `MintosInterestAnnualCreate` (mes `YYYY-MM`, importeAñadido, valorFinal) | Actualizar importe añadido y valor final del mes |

### Eliminar intereses de un mes (DELETE)

| Método | Path | Uso |
|---|---|---|
| DELETE | `/mintos/intereses-anuales/{id}` | Eliminar el registro de intereses de un mes |

## Reglas de diseño

- Modelo de dominio: `InteresAnualMintos` (`id, mes, importeAñadido, valorFinal` + fechas), con `mes` de tipo `String` (`YYYY-MM`) y dinero en `BigDecimal`.
- Entidad JPA: `InteresAnualMintosMO` (`@Table(name = "mintos")`); fechas con `@CreationTimestamp` y `@UpdateTimestamp`.
- Sin FK a `cuentas`: los intereses son propios del ecosistema Mintos; no se guarda ninguna relación con plataformas/instantáneas.
- `mes` inmutable en el `UPDATE`: solo se actualizan importe añadido y valor final.
- Patrón hexagonal del proyecto, como `InteresAnualMintos` (referencia) o `BalanceFondo`.

## Capas de implementación previstas

- **Capa de aplicación**: `InteresAnualMintos` (domain model), `InteresAnualMintosDrivingPort`, `InteresAnualMintosUseCase`, `InteresAnualMintosDrivenPort`.
- **Capa driven**: `InteresAnualMintosMO`, `InteresAnualMintosRepository`, `InteresAnualMintosDatasourceAdapter`, `InteresAnualMintosDatasourceMapper`.
- **Capa driving**: `InteresAnualMintosController` implementando `MintosInteresesAnualesApi` (swagger), `InteresAnualMintosApiMapper`.
- **Swagger**: paths `/mintos/intereses-anuales` y schemas `MintosInterestAnnual`, `MintosInterestAnnualCreate` (mes `YYYY-MM`, importeAñadido, valorFinal; tag `MintosInteresesAnuales`).
- **Flyway**: ajustar `V15__create_mintos_intereses_anuales.sql` (o nueva migración) para la tabla `mintos` con `mes`, `importe_añadido` y `valor_final`, e incluir los `COMMENT ON COLUMN`.
- **Tests**: no existe IT específico del CRUD de esta entidad. `MintosIT` cubre la pantalla de la plataforma Mintos (plataforma + cuenta + instantáneas mensuales), no el CRUD de intereses.