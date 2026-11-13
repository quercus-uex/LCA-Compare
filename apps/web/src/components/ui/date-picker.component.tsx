import { DateTime, Info } from 'luxon';
import { type KeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useClickOutside } from '../../hooks/use-click-outside.ts';
import { toSupportedLanguage } from '../../i18n/index.ts';
import { Button, IconButton } from './button.component.tsx';
import { Select, useFieldControl } from './form.component.tsx';

// Las fechas son días sin hora («2025-11-05»), como las de <input type="date">. Se
// trabajan en UTC para que la zona horaria del navegador no las mueva de día
const parse = (iso: string | undefined) => {
  if (!iso) return null;
  const date = DateTime.fromISO(iso, { zone: 'utc' });
  return date.isValid ? date.startOf('day') : null;
};
const today = () => DateTime.utc().startOf('day');
const toIso = (date: DateTime) => date.toISODate() ?? '';

const clamp = (date: DateTime, min: DateTime | null, max: DateTime | null) =>
  min && date < min ? min : max && date > max ? max : date;

/** Las seis semanas (de lunes a domingo) que muestran el mes completo */
const monthGrid = (month: DateTime) => {
  const first = month.startOf('month').startOf('week');
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => first.plus({ days: w * 7 + d })));
};

const POPOVER_GAP = 8;

type Props = {
  /** Fecha en formato ISO (`aaaa-mm-dd`) o cadena vacía */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  /** Permite vaciar el campo */
  clearable?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  'aria-label'?: string;
};

/**
 * Selector de fecha con calendario desplegable. Se maneja con el teclado como
 * una cuadrícula: flechas (día y semana), Inicio y Fin (semana), Re Pág y Av Pág
 * (mes; con Mayús, año), Intro para elegir y Escape para cerrar.
 */
export const DatePicker = ({ value, onChange, min, max, placeholder, clearable, disabled, size = 'md', id, ...rest }: Props) => {
  const { t, i18n } = useTranslation();
  const control = useFieldControl(id);
  const locale = toSupportedLanguage(i18n.language);
  const minDate = parse(min);
  const maxDate = parse(max);
  const selected = parse(value);

  const [open, setOpen] = useState(false);
  // Día con el foco dentro del calendario; el mes visible es el suyo
  const [focused, setFocused] = useState(() => clamp(selected ?? today(), minDate, maxDate));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  // Solo se mueve el foco al día activo al abrir y al navegar con el teclado por la
  // cuadrícula: si se cambia de mes con los selectores, el foco se queda en ellos
  const focusDayRef = useRef(false);
  const dialogId = useId();
  const titleId = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useClickOutside(wrapperRef, useCallback(() => close(false), [close]));

  // El calendario va en la capa superior (popover) para que no lo recorte el
  // contenedor con scroll de un diálogo; se coloca junto al campo y lo sigue
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!open || !popover || !trigger) return;
    const place = () => {
      const r = trigger.getBoundingClientRect();
      const height = popover.offsetHeight;
      const below = r.bottom + POPOVER_GAP + height <= window.innerHeight || r.top < height + POPOVER_GAP;
      const left = Math.max(POPOVER_GAP, Math.min(r.left, window.innerWidth - popover.offsetWidth - POPOVER_GAP));
      popover.style.top = `${below ? r.bottom + POPOVER_GAP : r.top - height - POPOVER_GAP}px`;
      popover.style.left = `${left}px`;
    };
    // Escape cierra el calendario esté donde esté el foco, sin cerrar también el diálogo que lo contenga
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      close();
    };
    popover.showPopover();
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('keydown', onEscape, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('keydown', onEscape, true);
      if (popover.matches(':popover-open')) popover.hidePopover();
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !focusDayRef.current) return;
    focusDayRef.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, [open, focused]);

  const toggle = () => {
    if (!open) {
      setFocused(clamp(selected ?? today(), minDate, maxDate));
      focusDayRef.current = true;
    }
    setOpen(!open);
  };

  const select = (date: DateTime) => {
    onChange(toIso(date));
    close();
  };

  const isDisabled = (date: DateTime) => (!!minDate && date < minDate) || (!!maxDate && date > maxDate);
  const move = (date: DateTime) => setFocused(clamp(date, minDate, maxDate));

  const onGridKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, () => DateTime> = {
      ArrowLeft: () => focused.minus({ days: 1 }),
      ArrowRight: () => focused.plus({ days: 1 }),
      ArrowUp: () => focused.minus({ weeks: 1 }),
      ArrowDown: () => focused.plus({ weeks: 1 }),
      Home: () => focused.startOf('week'),
      End: () => focused.endOf('week').startOf('day'),
      PageUp: () => focused.minus(e.shiftKey ? { years: 1 } : { months: 1 }),
      PageDown: () => focused.plus(e.shiftKey ? { years: 1 } : { months: 1 }),
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    focusDayRef.current = true;
    move(next());
  };

  const firstYear = minDate?.year ?? today().year - 10;
  const lastYear = maxDate?.year ?? today().year + 5;
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const monthNames = Info.months('long', { locale });
  const weekdays = Info.weekdays('short', { locale });
  const weekdaysLong = Info.weekdays('long', { locale });
  const label = selected?.setLocale(locale).toLocaleString(DateTime.DATE_MED);
  const invalid = control['aria-invalid'];

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        {...control}
        {...rest}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        className={`input w-full cursor-pointer justify-start text-left ${size === 'sm' ? 'input-sm' : ''} ${invalid ? 'border-danger' : ''}`}
        onClick={toggle}
      >
        <FiCalendar aria-hidden className="shrink-0 text-muted" />
        <span className={`truncate ${label ? '' : 'text-muted'}`}>{label ?? placeholder ?? t('common.datePicker.placeholder')}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          id={dialogId}
          popover="manual"
          role="dialog"
          aria-labelledby={titleId}
          className="fixed inset-auto m-0 w-80 rounded-box border border-base-200 bg-base-100 p-3 text-base-content shadow-lg"
        >
          <h2 id={titleId} className="sr-only">{t('common.datePicker.dialog')}</h2>
          <div className="flex items-center gap-1">
            <IconButton
              icon={FiChevronLeft}
              label={t('common.datePicker.previousMonth')}
              disabled={!!minDate && focused.startOf('month') <= minDate.startOf('month')}
              onClick={() => move(focused.minus({ months: 1 }))}
            />
            <div className="min-w-0 flex-1">
              <Select
                size="sm"
                aria-label={t('common.datePicker.month')}
                className="capitalize"
                value={focused.month}
                onChange={(e) => move(focused.set({ month: Number(e.target.value) }))}
              >
                {monthNames.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
              </Select>
            </div>
            <div className="w-22 shrink-0">
              <Select
                size="sm"
                aria-label={t('common.datePicker.year')}
                value={focused.year}
                onChange={(e) => move(focused.set({ year: Number(e.target.value) }))}
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </Select>
            </div>
            <IconButton
              icon={FiChevronRight}
              label={t('common.datePicker.nextMonth')}
              disabled={!!maxDate && focused.startOf('month') >= maxDate.startOf('month')}
              onClick={() => move(focused.plus({ months: 1 }))}
            />
          </div>

          <table ref={gridRef} role="grid" aria-labelledby={titleId} className="mt-2 w-full table-fixed text-center text-sm" onKeyDown={onGridKeyDown}>
            <thead>
              <tr>
                {weekdays.map((day, i) => (
                  <th key={day} scope="col" abbr={weekdaysLong[i]} className="pb-1 text-xs font-medium text-muted">
                    {day.replace('.', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(focused).map((week) => (
                <tr key={toIso(week[0]!)}>
                  {week.map((day) => {
                    const isSelected = !!selected && day.hasSame(selected, 'day');
                    const isFocused = day.hasSame(focused, 'day');
                    const isToday = day.hasSame(today(), 'day');
                    const outside = !day.hasSame(focused, 'month');
                    return (
                      <td key={toIso(day)} role="gridcell" aria-selected={isSelected} className="p-0.5">
                        <button
                          type="button"
                          tabIndex={isFocused ? 0 : -1}
                          disabled={isDisabled(day)}
                          aria-label={day.setLocale(locale).toLocaleString(DateTime.DATE_HUGE)}
                          aria-current={isToday ? 'date' : undefined}
                          className={`flex size-9 w-full cursor-pointer items-center justify-center rounded-field tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-base-content/30 ${
                            isSelected
                              ? 'bg-primary font-semibold text-primary-content'
                              : `hover:bg-base-200 ${outside ? 'text-muted' : ''} ${isToday ? 'font-semibold ring-1 ring-secondary ring-inset' : ''}`
                          }`}
                          onClick={() => select(day)}
                        >
                          {day.day}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 flex justify-between gap-2 border-t border-base-200 pt-2">
            <Button variant="ghost" size="sm" disabled={isDisabled(today())} onClick={() => select(today())}>
              {t('common.datePicker.today')}
            </Button>
            {clearable && value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('');
                  close();
                }}
              >
                {t('common.datePicker.clear')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
