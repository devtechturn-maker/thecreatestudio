import { Directive, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

const LENGTH = 10;
export const MOBILE_PATTERN = /^[6-9]\d{9}$/;

/** Keeps only digits, and drops a +91 / 91 / 0 prefix from a pasted, autofilled or saved number. */
export function toMobileDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** Mobile number input: digits only, and no more than 10. */
@Directive({
  selector: 'input[appMobileNumber]',
  host: {
    inputmode: 'numeric',
    '(beforeinput)': 'block($event)',
    '(input)': 'clean()',
  },
})
export class MobileNumberDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly control = inject(NgControl);

  // No maxlength attribute: it would cut a pasted "+91 98765 43210" before the prefix is removed.
  protected block(event: InputEvent): void {
    // Only single typed characters; paste and autofill are tidied in clean().
    if (event.inputType !== 'insertText' || event.data?.length !== 1) return;
    const { value, selectionStart, selectionEnd } = this.el;
    const replacing = (selectionEnd ?? 0) - (selectionStart ?? 0);
    if (!/\d/.test(event.data) || value.length - replacing >= LENGTH) event.preventDefault();
  }

  protected clean(): void {
    const value = toMobileDigits(this.el.value).slice(0, LENGTH);
    if (value !== this.el.value) this.el.value = value;
    this.control.control?.setValue(value);
  }
}
