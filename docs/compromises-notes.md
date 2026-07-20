# Compromises — Design Notes

Notas de diseño para la funcionalidad de compromisos recurrentes y futuros.

---

## Tipos de compromiso

| Tipo | Ejemplo | Comportamiento |
|---|---|---|
| `mensual` | Netflix, HBO | Se cobra TODOS los meses |
| `anual` | Seguro del coche, IBI | Se cobra un mes concreto cada año |
| `unico` | Multa, devolución | Se cobra solo en un mes+año específico |

---

## Alertas en planificación de nómina

Al crear o modificar una planificación de nómina (`asignaciones_salario`), el sistema informa de los compromisos del mes actual y los **3 meses siguientes**.

### Criterio de selección

```
Para cada mes M ∈ {mesActual, mesActual+1, mesActual+2, mesActual+3}:
  compromisos = filtro(mensual → siempre, anual → si mes = M, unico → si mes = M y año coincide)
```

### Ejemplo

| Mes | Compromisos detectados | Total |
|---|---|---|
| Jul 2026 | Netflix (15€), HBO (10€) | 25€ |
| Ago 2026 | Netflix (15€), HBO (10€) | 25€ |
| Sep 2026 | Netflix (15€), HBO (10€), IBI (150€) | 175€ |
| Oct 2026 | Netflix (15€), HBO (10€) | 25€ |

---

## Endpoint de alertas

`GET /compromisos/alertas?anio&mes`

Response:

```json
{
  "mesActual": {
    "anio": 2026,
    "mes": 7,
    "compromisos": [...],
    "total": 25.00
  },
  "mesSiguiente": {
    "anio": 2026,
    "mes": 8,
    "compromisos": [...],
    "total": 25.00
  },
  "mesPlus2": {
    "anio": 2026,
    "mes": 9,
    "compromisos": [...],
    "total": 175.00
  },
  "mesPlus3": {
    "anio": 2026,
    "mes": 10,
    "compromisos": [...],
    "total": 25.00
  }
}
```

---

## Lógica de filtrado por mes

```typescript
function compromisosPorMes(anio: number, mes: number): Compromiso[] {
  return compromisos.filter(c => {
    if (c.tipo === 'mensual') return true;
    if (c.tipo === 'anual') return c.mes === mes;
    if (c.tipo === 'unico') return c.mes === mes && (!c.anio || c.anio === anio);
    return false;
  });
}
```

---

## UI — Alertas

- Las alertas se muestran como tarjetas por mes con el total estimado
- Si `es_estimado = true`, el total se muestra como "≈ X€"
- Si no hay compromisos en un mes, no se muestra tarjeta para ese mes
- Las alertas se actualizan en tiempo real al CRUD de compromisos

---

## Futuras mejoras

- [ ] Añadir campo `notas` al compromiso para detalles extra
- [ ] Notificaciones push antes del cobro (3 días antes)
- [ ] Historial de compromisos pagados vs pendientes
- [ ] Alertas por email antes de compromisos grandes (>100€)
