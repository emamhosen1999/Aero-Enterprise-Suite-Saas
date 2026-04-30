import { forwardRef, useState, useId } from 'react';
import { Icon } from '../icons/icons.jsx';
import { cx } from './Primitives.jsx';

/** Field — label + hint + error wrapper. */
export const Field = forwardRef(function Field(
  { label, hint, error, required, htmlFor, className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('aeos-field', className)} {...rest}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cx('aeos-label', required && 'aeos-label-required')}
        >
          {label}
        </label>
      )}
      {children}
      {error  && <span className="aeos-field-error" role="alert">{error}</span>}
      {!error && hint && <span className="aeos-field-hint">{hint}</span>}
    </div>
  );
});

/** Input — text input with optional icon slots and error state. */
export const Input = forwardRef(function Input(
  { leftIcon, rightIcon, error, className, type = 'text', ...rest },
  ref
) {
  const inputEl = (
    <input
      ref={ref}
      type={type}
      className={cx('aeos-input', error && 'error', className)}
      {...rest}
    />
  );
  if (!leftIcon && !rightIcon) return inputEl;
  return (
    <div className="aeos-input-group">
      {leftIcon && (
        <span className="aeos-input-group-icon" aria-hidden="true">
          <Icon name={leftIcon} size={16} />
        </span>
      )}
      {inputEl}
      {rightIcon && (
        <span className="aeos-input-group-icon" style={{ left: 'auto', right: '0.75rem' }} aria-hidden="true">
          <Icon name={rightIcon} size={16} />
        </span>
      )}
    </div>
  );
});

/** Textarea — multiline input. */
export const Textarea = forwardRef(function Textarea({ error, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx('aeos-input', error && 'error', className)}
      {...rest}
    />
  );
});

/** Select — dropdown with options array or children. */
export const Select = forwardRef(function Select(
  { options = [], error, className, children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={cx('aeos-input', error && 'error', className)} {...rest}>
      {children ?? options.map((o, i) =>
        typeof o === 'string'
          ? <option key={i} value={o}>{o}</option>
          : <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>
      )}
    </select>
  );
});

/** Checkbox — native checkbox with inline label. */
export const Checkbox = forwardRef(function Checkbox({ label, className, ...rest }, ref) {
  return (
    <label className={cx('aeos-check-label', className)}>
      <input ref={ref} type="checkbox" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
});

/** Radio — native radio button with inline label. */
export const Radio = forwardRef(function Radio({ label, className, ...rest }, ref) {
  return (
    <label className={cx('aeos-check-label', className)}>
      <input ref={ref} type="radio" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
});

/** RadioGroup — managed group of Radio inputs. */
export function RadioGroup({ name, value, onChange, options = [], dir = 'column' }) {
  return (
    <div
      role="radiogroup"
      style={{ display: 'flex', flexDirection: dir, gap: dir === 'column' ? '8px' : '16px' }}
    >
      {options.map(o => (
        <Radio
          key={o.value}
          name={name}
          value={o.value}
          checked={value === o.value}
          onChange={e => onChange?.(e.target.value)}
          label={o.label}
        />
      ))}
    </div>
  );
}

/** Toggle — accessible on/off switch. */
export function Toggle({ checked, onChange, disabled, label, id: idProp, ...rest }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const inner = (
    <span className="aeos-toggle">
      <input
        id={id}
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        role="switch"
        aria-checked={!!checked}
        {...rest}
      />
      <span className="aeos-toggle-slider" />
    </span>
  );
  if (!label) return inner;
  return (
    <label
      htmlFor={id}
      className="aeos-toggle-row"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {inner}
      <span className="aeos-text-sm aeos-text-primary">{label}</span>
    </label>
  );
}

/** SearchInput — input pre-decorated with a search icon and optional kbd shortcut. */
export const SearchInput = forwardRef(function SearchInput(
  { value, onChange, placeholder = 'Search…', shortcut, className, ...rest },
  ref
) {
  return (
    <div className="aeos-input-group" style={{ position: 'relative' }}>
      <span className="aeos-input-group-icon" aria-hidden="true">
        <Icon name="search" size={16} />
      </span>
      <input
        ref={ref}
        type="search"
        className={cx('aeos-input', className)}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
      {shortcut && (
        <kbd
          className="aeos-kbd"
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
        >
          {shortcut}
        </kbd>
      )}
    </div>
  );
});

/** FileInput — styled file picker showing selected filename. */
export function FileInput({ accept, multiple, onChange, label = 'Choose file', className }) {
  const [name, setName] = useState('');
  return (
    <label className={cx('aeos-file-input', className)}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={e => {
          setName(Array.from(e.target.files ?? []).map(f => f.name).join(', '));
          onChange?.(e);
        }}
      />
      <span className="aeos-btn aeos-btn-soft aeos-btn-sm">
        <Icon name="document" size={14} />
        {label}
      </span>
      {name && (
        <span className="aeos-text-sm aeos-text-secondary" style={{ marginLeft: 8 }}>
          {name}
        </span>
      )}
    </label>
  );
}

/** DatePicker — native date input styled as an AEOS input. */
export const DatePicker = forwardRef(function DatePicker(
  { value, onChange, placeholder, error, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type="date"
      className={cx('aeos-input', error && 'error', className)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
    />
  );
});
