import { Injectable } from '@angular/core';
import { PT_BR, I18nKey } from './pt-br';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly locale = PT_BR;

  /** Typed lookup — IDE autocomplete provides key suggestions. */
  t(key: I18nKey, params?: Record<string, string | number>): string {
    return this.translate(key as string, params);
  }

  /** Untyped lookup — use when key is a runtime string value. */
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
