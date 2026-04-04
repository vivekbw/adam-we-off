'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { daysBetween, type Stay } from '@/lib/constants';
import { flagForCountry } from '@/lib/country-flags';

const STAY_STATUSES = ['Need to Book', 'Booked'] as const;
const STAY_TYPES = ['Hotel', 'Hostel', 'Villa', 'House', 'Apartment', 'Boutique', 'Resort', 'Guesthouse'] as const;

export interface StayFormValues {
  name: string;
  city: string;
  country: string;
  type: string;
  status: string;
  bookedBy: string;
  checkIn: string;
  checkOut: string;
  costPerNight: string;
  link: string;
  confirmationLink: string;
}

interface StayFormFieldsProps {
  form: StayFormValues;
  onChange: (key: keyof StayFormValues, value: string) => void;
  buddyNames?: string[];
  idPrefix?: string;
}

export interface AddStayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (partial: Partial<Stay>) => void | Promise<void>;
  defaults?: Partial<Stay>;
  buddyNames?: string[];
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function makeStayFormValues(defaults?: Partial<Stay>): StayFormValues {
  return {
    name: defaults?.name ?? '',
    city: defaults?.city ?? '',
    country: defaults?.country ?? '',
    type: defaults?.type ?? 'Hotel',
    status: defaults?.status ?? 'Need to Book',
    bookedBy: defaults?.bookedBy ?? '',
    checkIn: defaults?.checkIn ?? '',
    checkOut: defaults?.checkOut ?? '',
    costPerNight: defaults?.costPerNight != null ? String(defaults.costPerNight) : '0',
    link: defaults?.link ?? '',
    confirmationLink: defaults?.confirmationLink ?? '',
  };
}

export function stayFormToPartial(form: StayFormValues, defaults?: Partial<Stay>): Partial<Stay> {
  const costPerNight = Number(form.costPerNight);
  const checkIn = form.checkIn.trim();
  const checkOut = form.checkOut.trim();
  const nights = checkIn && checkOut ? Math.max(daysBetween(checkIn, checkOut), 1) : defaults?.nights ?? 1;
  const country = form.country.trim();

  return {
    ...defaults,
    name: form.name.trim(),
    city: form.city.trim(),
    country,
    flag: defaults?.flag ?? flagForCountry(country),
    type: form.type.trim() || 'Hotel',
    status: form.status,
    bookedBy: form.bookedBy.trim() || null,
    checkIn,
    checkOut,
    nights,
    costPerNight: Number.isNaN(costPerNight) ? 0 : costPerNight,
    link: form.link.trim() || null,
    confirmationLink: form.confirmationLink.trim() || null,
  };
}

export function StayFormFields({
  form,
  onChange,
  buddyNames = [],
  idPrefix = 'stay',
}: StayFormFieldsProps) {
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const nights =
    form.checkIn && form.checkOut ? Math.max(daysBetween(form.checkIn, form.checkOut), 0) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={fieldId('name')}>Name</Label>
        <Input
          id={fieldId('name')}
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="Accommodation name"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fieldId('city')}>City</Label>
          <Input
            id={fieldId('city')}
            value={form.city}
            onChange={(event) => onChange('city', event.target.value)}
            placeholder="City"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId('country')}>Country</Label>
          <Input
            id={fieldId('country')}
            value={form.country}
            onChange={(event) => onChange('country', event.target.value)}
            placeholder="Country"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={fieldId('type')}>Type</Label>
          <Select value={form.type} onValueChange={(value) => onChange('type', value)}>
            <SelectTrigger id={fieldId('type')} className="w-full">
              <SelectValue placeholder="Stay type" />
            </SelectTrigger>
            <SelectContent>
              {STAY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId('status')}>Status</Label>
          <Select value={form.status} onValueChange={(value) => onChange('status', value)}>
            <SelectTrigger id={fieldId('status')} className="w-full">
              <SelectValue placeholder="Stay status" />
            </SelectTrigger>
            <SelectContent>
              {STAY_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId('bookedBy')}>Booked by</Label>
          <Select value={form.bookedBy || '__none__'} onValueChange={(value) => onChange('bookedBy', value === '__none__' ? '' : value)}>
            <SelectTrigger id={fieldId('bookedBy')} className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {buddyNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fieldId('checkin')}>Check-in date</Label>
          <Input
            id={fieldId('checkin')}
            type="date"
            value={form.checkIn}
            onChange={(event) => onChange('checkIn', event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId('checkout')}>Check-out date</Label>
          <Input
            id={fieldId('checkout')}
            type="date"
            value={form.checkOut}
            onChange={(event) => onChange('checkOut', event.target.value)}
            required
          />
        </div>
      </div>

      {nights > 0 && (
        <p className="text-muted-foreground text-sm">{nights} night{nights === 1 ? '' : 's'}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fieldId('cost')}>Cost per night</Label>
          <Input
            id={fieldId('cost')}
            type="number"
            min={0}
            step={0.01}
            value={form.costPerNight}
            onChange={(event) => onChange('costPerNight', event.target.value)}
            placeholder="0"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId('link')}>Property link</Label>
          <Input
            id={fieldId('link')}
            type="url"
            value={form.link}
            onChange={(event) => onChange('link', event.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId('confirmationLink')}>Confirmation link</Label>
        <Input
          id={fieldId('confirmationLink')}
          type="url"
          value={form.confirmationLink}
          onChange={(event) => onChange('confirmationLink', event.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

export function AddStayForm({
  open,
  onOpenChange,
  onSubmit,
  defaults,
  buddyNames = [],
  title = 'Add Stay',
  description = 'Add or edit the stay details, dates, and booking status.',
  submitLabel = 'Save Stay',
}: AddStayFormProps) {
  const [form, setForm] = useState<StayFormValues>(makeStayFormValues(defaults));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(makeStayFormValues(defaults));
    }
  }, [defaults, open]);

  const update = (key: keyof StayFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const partial = stayFormToPartial(form, defaults);
    if (!partial.name || !partial.city || !partial.country || !partial.checkIn || !partial.checkOut) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(partial);
      onOpenChange(false);
      setForm(makeStayFormValues());
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
          <StayFormFields form={form} onChange={update} buddyNames={buddyNames} />
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
