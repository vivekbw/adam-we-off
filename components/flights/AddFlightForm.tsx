'use client';

import { useEffect, useState } from 'react';
import type { Flight } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const FLIGHT_STATUSES = ['Need to Book', 'Booked'] as const;

export interface FlightFormValues {
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  date: string;
  dep: string;
  arr: string;
  airline: string;
  cost: string;
  status: string;
  seatsText: string;
}

interface FlightFormFieldsProps {
  form: FlightFormValues;
  onChange: (key: keyof FlightFormValues, value: string) => void;
  idPrefix?: string;
}

export interface AddFlightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (partial: Partial<Flight>) => void | Promise<void>;
  defaults?: Partial<Flight>;
  title?: string;
  description?: string;
  submitLabel?: string;
}

function seatsMapToText(seats?: Record<string, string>) {
  if (!seats || Object.keys(seats).length === 0) return '';
  return Object.entries(seats)
    .map(([name, seat]) => `${name}: ${seat}`)
    .join('\n');
}

function parseSeatsText(value: string) {
  const seats: Record<string, string> = {};

  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [name, ...seatParts] = line.split(/[:\-]/);
      const seat = seatParts.join(':').trim();
      if (name?.trim() && seat) {
        seats[name.trim()] = seat;
      }
    });

  return seats;
}

export function makeFlightFormValues(defaults?: Partial<Flight>): FlightFormValues {
  return {
    from: defaults?.from ?? '',
    fromCode: defaults?.fromCode ?? '',
    to: defaults?.to ?? '',
    toCode: defaults?.toCode ?? '',
    date: defaults?.date ?? '',
    dep: defaults?.dep ?? '',
    arr: defaults?.arr ?? '',
    airline: defaults?.airline ?? '',
    cost: defaults?.cost != null ? String(defaults.cost) : '',
    status: defaults?.status ?? 'Need to Book',
    seatsText: seatsMapToText(defaults?.seats),
  };
}

export function flightFormToPartial(
  form: FlightFormValues,
  defaults?: Partial<Flight>,
): Partial<Flight> {
  const cost = form.cost.trim() === '' ? null : Number(form.cost);

  return {
    ...defaults,
    from: form.from.trim(),
    fromCode: form.fromCode.trim().toUpperCase(),
    to: form.to.trim(),
    toCode: form.toCode.trim().toUpperCase(),
    date: form.date.trim(),
    dep: form.dep.trim() || undefined,
    arr: form.arr.trim() || undefined,
    airline: form.airline.trim() || undefined,
    cost: cost != null && !Number.isNaN(cost) ? cost : null,
    status: form.status,
    seats: parseSeatsText(form.seatsText),
  };
}

export function FlightFormFields({
  form,
  onChange,
  idPrefix = 'flight',
}: FlightFormFieldsProps) {
  const fieldId = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fieldId('from')}>From city</Label>
          <Input
            id={fieldId('from')}
            value={form.from}
            onChange={(event) => onChange('from', event.target.value)}
            placeholder="e.g. Tokyo"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('to')}>To city</Label>
          <Input
            id={fieldId('to')}
            value={form.to}
            onChange={(event) => onChange('to', event.target.value)}
            placeholder="e.g. Hanoi"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('fromCode')}>From airport code</Label>
          <Input
            id={fieldId('fromCode')}
            value={form.fromCode}
            onChange={(event) => onChange('fromCode', event.target.value)}
            placeholder="e.g. NRT"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('toCode')}>To airport code</Label>
          <Input
            id={fieldId('toCode')}
            value={form.toCode}
            onChange={(event) => onChange('toCode', event.target.value)}
            placeholder="e.g. HAN"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fieldId('status')}>Status</Label>
          <Select value={form.status} onValueChange={(value) => onChange('status', value)}>
            <SelectTrigger id={fieldId('status')} className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {FLIGHT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('date')}>Date</Label>
          <Input
            id={fieldId('date')}
            type="date"
            value={form.date}
            onChange={(event) => onChange('date', event.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fieldId('dep')}>Departure time</Label>
          <Input
            id={fieldId('dep')}
            value={form.dep}
            onChange={(event) => onChange('dep', event.target.value)}
            placeholder="e.g. 10:45am"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('arr')}>Arrival time</Label>
          <Input
            id={fieldId('arr')}
            value={form.arr}
            onChange={(event) => onChange('arr', event.target.value)}
            placeholder="e.g. 1:30pm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fieldId('airline')}>Airline</Label>
          <Input
            id={fieldId('airline')}
            value={form.airline}
            onChange={(event) => onChange('airline', event.target.value)}
            placeholder="e.g. Vietnam Airlines"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId('cost')}>Cost</Label>
          <Input
            id={fieldId('cost')}
            type="number"
            value={form.cost}
            onChange={(event) => onChange('cost', event.target.value)}
            placeholder="Optional"
            min={0}
            step={0.01}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId('seats')}>Seats</Label>
        <Textarea
          id={fieldId('seats')}
          value={form.seatsText}
          onChange={(event) => onChange('seatsText', event.target.value)}
          placeholder={'Adam: 30H\nKate: 30J'}
        />
      </div>
    </div>
  );
}

export function AddFlightForm({
  open,
  onOpenChange,
  onSubmit,
  defaults,
  title = 'Add Flight',
  description = 'Add or edit the route, timing, and booking status.',
  submitLabel = 'Save Flight',
}: AddFlightFormProps) {
  const [form, setForm] = useState<FlightFormValues>(makeFlightFormValues(defaults));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(makeFlightFormValues(defaults));
    }
  }, [defaults, open]);

  const update = (key: keyof FlightFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const partial = flightFormToPartial(form, defaults);
    if (!partial.from || !partial.to || !partial.date) return;

    try {
      setSubmitting(true);
      await onSubmit(partial);
      onOpenChange(false);
      setForm(makeFlightFormValues());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FlightFormFields form={form} onChange={update} />
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
