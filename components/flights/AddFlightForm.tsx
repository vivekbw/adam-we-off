'use client';

import { useState } from 'react';
import type { Flight } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddFlightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (partial: Partial<Flight>) => void;
  defaults?: Partial<Flight>;
  buddyNames?: string[];
}

function makeInitial(defaults?: Partial<Flight>) {
  return {
    from: defaults?.from ?? '',
    fromCode: defaults?.fromCode ?? '',
    to: defaults?.to ?? '',
    toCode: defaults?.toCode ?? '',
    date: '',
    dep: '',
    arr: '',
    airline: '',
    cost: '',
  };
}

export function AddFlightForm({ open, onOpenChange, onAdd, defaults, buddyNames = [] }: AddFlightFormProps) {
  const [form, setForm] = useState(makeInitial(defaults));
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(makeInitial(defaults));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const from = form.from.trim();
    const to = form.to.trim();
    const date = form.date.trim();
    if (!from || !to || !date) return;

    const cost = form.cost === '' ? null : Number(form.cost);
    const costNum = cost !== null && !Number.isNaN(cost) ? cost : null;

    const bookingStatus: Record<string, string> = {};
    for (const name of buddyNames) {
      bookingStatus[name] = 'Need to Book';
    }

    onAdd({
      from,
      fromCode: form.fromCode.trim() || undefined,
      to,
      toCode: form.toCode.trim() || undefined,
      date,
      dep: form.dep.trim() || undefined,
      arr: form.arr.trim() || undefined,
      airline: form.airline.trim() || undefined,
      cost: costNum,
      status: 'Need to Book',
      seats: {},
      bookingStatus,
    });

    setForm(makeInitial());
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Flight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From city</Label>
              <Input
                id="from"
                value={form.from}
                onChange={(e) => update('from', e.target.value)}
                placeholder="e.g. Tokyo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To city</Label>
              <Input
                id="to"
                value={form.to}
                onChange={(e) => update('to', e.target.value)}
                placeholder="e.g. Hanoi"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromCode">From airport code</Label>
              <Input
                id="fromCode"
                value={form.fromCode}
                onChange={(e) => update('fromCode', e.target.value)}
                placeholder="e.g. NRT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toCode">To airport code</Label>
              <Input
                id="toCode"
                value={form.toCode}
                onChange={(e) => update('toCode', e.target.value)}
                placeholder="e.g. HAN"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dep">Departure time</Label>
              <Input
                id="dep"
                value={form.dep}
                onChange={(e) => update('dep', e.target.value)}
                placeholder="e.g. 10:45am"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arr">Arrival time</Label>
              <Input
                id="arr"
                value={form.arr}
                onChange={(e) => update('arr', e.target.value)}
                placeholder="e.g. 1:30pm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="airline">Airline</Label>
            <Input
              id="airline"
              value={form.airline}
              onChange={(e) => update('airline', e.target.value)}
              placeholder="e.g. Vietnam Airlines"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              value={form.cost}
              onChange={(e) => update('cost', e.target.value)}
              placeholder="Optional"
              min={0}
              step={0.01}
            />
          </div>

          <DialogFooter>
            <Button type="submit">Add Flight</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
