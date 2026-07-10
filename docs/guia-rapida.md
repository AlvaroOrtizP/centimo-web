# Guía de Centimo — Cómo usar la web

Centimo te ayuda a controlar tus finanzas personales mes a mes. Aquí te explico cómo usarla.

---

## 1. El panel principal (Dashboard)

Al entrar, ves un resumen del mes:

- **Tarjetas superiores**: patrimonio neto, ingresos del mes, gastos del mes y ahorro neto. Cada una muestra si mejoraste o empeoraste respecto al mes anterior.
- **Gráfico de línea**: evolución de tu patrimonio en los últimos 6 meses.
- **Tabla de plataformas**: lista de todos tus bancos y servicios con su balance, ingresos y gastos. Cada fila es cliqueable para ver el detalle.

## 2. Cómo cambiar de mes

Arriba a la derecha hay dos desplegables: mes y año. Selecciona el mes que quieras ver y todas las pantallas se actualizan.

## 3. Vista mensual

En el menú lateral, haz clic en "Vista Mensual". Aquí ves:

- **Desglose por plataforma**: cada plataforma con sus cuentas. Haz clic en una cuenta para expandir y ver sus inversiones (holdings) y gastos.
- **Gráfico de gastos por categoría**: un gráfico de donut con colores. Abajo aparecen las categorías con su total.
- **Lista de ingresos**: todos los ingresos registrados ese mes.

## 4. Detalle de una plataforma

Haz clic en cualquier plataforma desde el Dashboard o la Vista Mensual. Aquí ves:

- Información general (nombre, tipo, cuentas).
- **Gráfico de evolución del balance** mes a mes.
- **Tabla mensual** con balance, ingresos y gastos de cada mes.
- Si es una plataforma de inversión, también verás los **holdings** (lo que tienes invertido) y los **trades** (operaciones de compra/venta).

## 5. Tendencias

En el menú lateral, "Tendencias" te muestra 4 gráficos globales:

- Evolución del patrimonio neto en el tiempo.
- Ingresos vs gastos mes a mes.
- Distribución de tu dinero entre plataformas.
- Tasa de ahorro (%).

## 6. Trades (operaciones)

En "Trades" ves todas tus operaciones de compra/venta. Puedes filtrar por:

- **Activo** (ej: BTC, AAPL)
- **Estado** (abiertas o cerradas)
- **Plataforma**

Las filas se pintan en verde (ganancia) o rojo (pérdida). Arriba hay tarjetas con total invertido, retirado, y P&L global.

## 7. Cómo introducir datos — "Entrada Datos"

Desde el menú lateral, ve a "Entrada Datos". Selecciona una plataforma y un mes. Verás un formulario por cada cuenta de esa plataforma. El formulario cambia según el tipo de cuenta:

### Cuentas de banco (cuenta corriente o ahorro)
1. Introduce el **saldo** de la cuenta.
2. Añade **ingresos**: escribe una cantidad, selecciona el tipo (nómina, interés, etc.) y una descripción. Pulsa "Añadir".
3. Añade **gastos**: selecciona una categoría (comida, ocio, coche, trabajo, ejercicio, aseo, medicamento, discord, otros), escribe cantidad y descripción. Pulsa "Añadir".
4. Cuando termines, pulsa **"Guardar Snapshot"**.

### Cuentas de inversión (fondos, ETFs, acciones)
1. Introduce el **saldo de la cartera**.
2. Añade **holdings**: nombre del activo, cantidad y precio unitario. Pulsa "Añadir".
3. Pulsa "Guardar Snapshot".

### Cuentas de crypto
1. Introduce el **saldo de la cartera**.
2. Añade **holdings**: activo, cantidad y precio.
3. Añade **trades**: tipo (compra/venta), activo, cantidad, precio y fecha.
4. Pulsa "Guardar Snapshot".

### Añadir gasto suelto
Si solo quieres registrar un gasto sin rellenar todo el formulario, usa el botón "Añadir Gasto" que aparece abajo. Selecciona la cuenta, categoría, cantidad y descripción.

### Añadir trade suelto
Similar, usa "Añadir Trade" para registrar una compra/venta rápida: selecciona cuenta, tipo, activo, cantidad, precio y fecha.

---

## Resumen del flujo

```
Cada mes:
  1. Ve a "Entrada Datos"
  2. Selecciona cada plataforma que uses
  3. Introduce saldos, ingresos, gastos
  4. Pulsa "Guardar Snapshot"
  5. Revisa en Dashboard / Vista Mensual / Tendencias
```

Los datos que introduces se guardan solo en memoria (no hay base de datos ni conexión a bancos). Es una herramienta de autocontrol, no un agregador bancario.
