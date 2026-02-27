'use client';

import { useState } from 'react';
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
import { daysBetween, type Stay } from '@/lib/constants';

interface AddStayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (partial: Partial<Stay>) => void;
}

const INITIAL_STATE = {
  name: '',
  city: '',
  country: '',
  type: '',
  checkIn: '',
  checkOut: '',
  costPerNight: '',
  link: '',
};

export function AddStayForm({ open, onOpenChange, onAdd }: AddStayFormProps) {
  const [form, setForm] = useState(INITIAL_STATE);

  const nights =
    form.checkIn && form.checkOut
      ? Math.max(0, daysBetween(form.checkIn, form.checkOut))
      : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cost = parseFloat(form.costPerNight);
    if (Number.isNaN(cost) || cost < 0) return;

    onAdd({
      name: form.name.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      type: form.type.trim() || undefined,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      costPerNight: cost,
      nights,
      link: form.link.trim() || null,
      status: 'Need to Book',
      bookedBy: null,
    });

    setForm(INITIAL_STATE);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setForm(INITIAL_STATE);
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stay</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="stay-name">Name</Label>
            <Input
              id="stay-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Accommodation name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stay-city">City</Label>
              <Input
                id="stay-city"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="City"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stay-country">Country</Label>
              <Input
                id="stay-country"
                value={form.country}
                onChange={(e) =>
                  setForm((p) => ({ ...p, country: e.target.value }))
                }
                placeholder="Country"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stay-type">Type</Label>
            <Input
              id="stay-type"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              placeholder="e.g. Hotel, Hostel, Villa, Boutique"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stay-checkin">Check-in date</Label>
              <Input
                id="stay-checkin"
                type="date"
                value={form.checkIn}
                onChange={(e) =>
                  setForm((p) => ({ ...p, checkIn: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stay-checkout">Check-out date</Label>
              <Input
                id="stay-checkout"
                type="date"
                value={form.checkOut}
                onChange={(e) =>
                  setForm((p) => ({ ...p, checkOut: e.target.value }))
                }
                required
              />
            </div>
          </div>
          {nights > 0 && (
            <p className="text-muted-foreground text-sm">{nights} night(s)</p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="stay-cost">Cost per night</Label>
            <Input
              id="stay-cost"
              type="number"
              min={0}
              step={0.01}
              value={form.costPerNight}
              onChange={(e) =>
                setForm((p) => ({ ...p, costPerNight: e.target.value }))
              }
              placeholder="0"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stay-link">Link</Label>
            <Input
              id="stay-link"
              type="url"
              value={form.link}
              onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Stay</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
