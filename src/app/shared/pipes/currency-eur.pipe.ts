import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyEUR', standalone: true })
export class CurrencyEURPipe implements PipeTransform {
  transform(value: number | null | undefined, showSign = false): string {
    if (value == null) { return '—'; }

    const formatted = value.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (showSign) {
      const sign = value > 0 ? '+' : '';
      return `${sign}${formatted} €`;
    }

    return `${formatted} €`;
  }
}
