import {
  ChangeDetectionStrategy, Component, ElementRef, computed, forwardRef, inject, input, signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon.component';

/**
 * Branded dropdown for reactive forms. With `multiple`, the value is a string[] (in option order)
 * and the count and chips are shown; otherwise it is a string.
 *
 * Follows the ARIA "select-only combobox" pattern: focus stays on the trigger and
 * aria-activedescendant points at the highlighted option.
 */
@Component({
  selector: 'app-dropdown',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DropdownComponent), multi: true }],
  host: {
    '[class.is-open]': 'open()',
    '(document:pointerdown)': 'onOutside($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class DropdownComponent implements ControlValueAccessor {
  readonly controlId = input.required<string>();
  readonly labelId = input.required<string>();
  readonly options = input.required<readonly string[]>();
  readonly placeholder = input('Select an option');
  readonly multiple = input(false);
  /** Plural and singular word for what is being picked, e.g. "services" / "service". */
  readonly noun = input('options');
  readonly nounOne = input('option');
  readonly invalid = input(false);
  readonly errorId = input('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly selected = signal<string[]>([]);
  protected readonly open = signal(false);
  protected readonly active = signal(0);
  protected readonly disabled = signal(false);

  protected readonly summary = computed(() => {
    const s = this.selected();
    if (!s.length) return this.placeholder();
    return this.multiple() ? this.countText() : s[0];
  });
  protected readonly countText = computed(() => {
    const n = this.selected().length;
    return `${n} ${n === 1 ? this.nounOne() : this.noun()} selected`;
  });

  private typed = '';
  private typedAt = 0;
  private onChange: (value: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};

  // ------------------------------------------------------------------ ControlValueAccessor

  writeValue(value: string | string[] | null): void {
    this.selected.set(Array.isArray(value) ? value : value ? [value] : []);
  }

  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) this.open.set(false);
  }

  // ------------------------------------------------------------------ interaction

  focus(): void {
    this.trigger().nativeElement.focus();
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  protected pick(option: string): void {
    if (this.disabled()) return;
    if (!this.multiple()) {
      this.commit([option]);
      this.close();
      this.focus();
      return;
    }
    const next = new Set(this.selected());
    if (next.has(option)) next.delete(option);
    else next.add(option);
    this.commit(this.options().filter((o) => next.has(o)));
  }

  protected remove(option: string): void {
    this.commit(this.selected().filter((o) => o !== option));
    this.focus(); // the chip that had focus is gone
  }

  protected clear(): void {
    this.commit([]);
    this.focus();
  }

  protected done(): void {
    this.close();
    this.focus();
  }

  protected onEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    event.stopPropagation();
    this.done();
  }

  protected onKey(event: KeyboardEvent): void {
    const last = this.options().length - 1;
    const open = this.open();
    const key = event.key;

    if (key === 'Tab') {
      // In multi-select, Tab moves on to Clear / Done; leaving the component closes it.
      if (!this.multiple()) this.close();
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!open) this.show();
      else if (event.altKey && key === 'ArrowUp') this.close();
      else this.highlight(Math.min(last, Math.max(0, this.active() + (key === 'ArrowDown' ? 1 : -1))));
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      if (!open) this.show();
      this.highlight(key === 'Home' ? 0 : last);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault(); // also stops Enter submitting the form
      if (open) this.pick(this.options()[this.active()]);
      else this.show();
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.typeahead(key.toLowerCase());
    }
  }

  protected onOutside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    // Tabbing on to the chips also closes the panel, which would otherwise cover them.
    if (next && !this.host.nativeElement.querySelector('.anchor')?.contains(next)) this.close();
    if (next && this.host.nativeElement.contains(next)) return;
    // A null relatedTarget (window switch, tap on plain text) is left to onOutside.
    if (!this.open()) this.onTouched();
  }

  private show(): void {
    if (this.disabled()) return;
    this.open.set(true);
    this.focus(); // Safari does not focus a button when it is clicked
    this.active.set(Math.max(0, this.options().indexOf(this.selected()[0])));
    setTimeout(() => {
      this.host.nativeElement.querySelector('.panel')?.scrollIntoView({ block: 'nearest' });
      this.revealActive();
    });
  }

  private close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
  }

  private commit(value: string[]): void {
    this.selected.set(value);
    this.onChange(this.multiple() ? [...value] : (value[0] ?? ''));
  }

  private highlight(index: number): void {
    this.active.set(index);
    setTimeout(() => this.revealActive());
  }

  /** Scrolls only the list, never the page. */
  private revealActive(): void {
    const list = this.host.nativeElement.querySelector<HTMLElement>('.list');
    const option = list?.children[this.active()] as HTMLElement | undefined;
    if (!list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }

  private typeahead(char: string): void {
    const now = Date.now();
    this.typed = now - this.typedAt < 600 ? this.typed + char : char;
    this.typedAt = now;
    const index = this.options().findIndex((o) => o.toLowerCase().startsWith(this.typed));
    if (index < 0) return;
    if (!this.open()) this.show();
    this.highlight(index);
  }
}
