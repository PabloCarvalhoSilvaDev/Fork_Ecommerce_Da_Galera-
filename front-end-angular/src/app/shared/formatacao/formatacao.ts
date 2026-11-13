import { Pipe, PipeTransform } from '@angular/core';

const FORMATO_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** `959.6 | moeda` → "R$ 959,60". */
@Pipe({ name: 'moeda' })
export class MoedaPipe implements PipeTransform {
  transform(valor: number): string {
    return FORMATO_MOEDA.format(valor);
  }
}

/** `iso | data` → "09/11/2026"; `iso | data: 'curta'` → "09/11, 14:02". */
@Pipe({ name: 'data' })
export class DataPipe implements PipeTransform {
  transform(iso: string | null | undefined, formato: 'completa' | 'curta' = 'completa'): string {
    const data = iso ? new Date(iso) : null;
    // Intl lança RangeError com data inválida e derrubaria a tela inteira.
    if (!data || Number.isNaN(data.getTime())) {
      return '—';
    }
    return formato === 'curta' ? FORMATO_DATA_HORA.format(data) : FORMATO_DATA.format(data);
  }
}
