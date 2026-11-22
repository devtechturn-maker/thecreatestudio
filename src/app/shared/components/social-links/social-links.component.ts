import { ChangeDetectionStrategy, Component, ElementRef, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon.component';
import { detectPlatform } from './social-links.util';

const MAX_LINKS = 10;

/** Repeatable profile-link input that shows the platform's icon. The value is a string[]. */
@Component({
  selector: 'app-social-links',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SocialLinksComponent), multi: true }],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class SocialLinksComponent implements ControlValueAccessor {
  readonly invalid = input(false);
  readonly describedBy = input('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly values = signal<string[]>(['']);
  protected readonly disabled = signal(false);
  protected readonly full = computed(() => this.values().length >= MAX_LINKS);
  protected readonly rows = computed(() => {
    const values = this.values();
    const empty = !values.some((v) => v.trim());
    return values.map((value, i) => {
      const filled = !!value.trim();
      const platform = detectPlatform(value);
      return { value, platform, bad: filled ? !platform : empty && i === 0 };
    });
  });

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    this.values.set(value?.length ? value : ['']);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected edit(index: number, text: string): void {
    this.commit(this.values().map((v, i) => (i === index ? text : v)));
  }

  protected add(event: Event): void {
    event.preventDefault(); // Enter must not submit the form
    const values = this.values();
    const blank = values.findIndex((v) => !v.trim());
    if (blank >= 0) return this.focusRow(blank);
    if (this.full()) return;
    this.commit([...values, '']);
    this.focusRow(values.length);
  }

  protected remove(index: number): void {
    const next = this.values().filter((_, i) => i !== index);
    this.commit(next.length ? next : ['']);
    this.focusRow(Math.max(0, index - 1));
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.host.nativeElement.contains(event.relatedTarget as Node | null)) this.onTouched();
  }

  private commit(values: string[]): void {
    this.values.set(values);
    this.onChange(values);
  }

  private focusRow(index: number): void {
    setTimeout(() => this.host.nativeElement.querySelectorAll('input')[index]?.focus());
  }
}
