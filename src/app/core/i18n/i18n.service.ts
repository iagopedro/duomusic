import { Injectable } from '@angular/core';
import { PT_BR, I18nKey } from './pt-br';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly locale = PT_BR;

  /** Busca tipada — o autocomplete da IDE sugere as chaves disponíveis. */
  t(key: I18nKey, params?: Record<string, string | number>): string {
    return this.translate(key as string, params);
  }

  /** Busca sem tipagem — use quando a chave é uma string resolvida em tempo de execução. */
  tStr(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  private translate(key: string, params?: Record<string, string | number>): string {
    let value: string = (this.locale as Record<string, string>)[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replaceAll(`{${k}}`, String(v));
      });
    }
    return value;
  }
}
