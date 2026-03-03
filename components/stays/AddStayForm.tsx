'use client';

import { useState, useMemo } from 'react';
import { CalendarIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { daysBetween, fmtDate, type Stay, type ItinerarySegment } from '@/lib/constants';

interface AddStayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (partial: Partial<Stay>) => void;
  itinerary?: ItinerarySegment[];
  buddyNames?: string[];
}

interface FormState {
  name: string;
  city: string;
  country: string;
  flag: string;
  type: string;
  checkIn: string;
  checkOut: string;
  costPerNight: string;
  link: string;
  bookedBy: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  city: '',
  country: '',
  flag: '',
  type: '',
  checkIn: '',
  checkOut: '',
  costPerNight: '',
  link: '',
  bookedBy: '',
};

function toDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AddStayForm({ open, onOpenChange, onAdd, itinerary = [], buddyNames = [] }: AddStayFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const cityOptions = useMemo(() => {
    const seen = new Set<string>();
    return itinerary
      .filter((seg) => {
        const key = seg.city.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }, [itinerary]);

  const selectedSegment = useMemo(() => {
    if (!form.city) return null;
    return itinerary.find(
      (seg) => seg.city.toLowerCase() === form.city.toLowerCase()
    ) ?? null;
  }, [form.city, itinerary]);

  const segmentRange = useMemo(() => {
    if (!selectedSegment) return null;
    return {
      from: toDateLocal(selectedSegment.startDate),
      to: toDateLocal(selectedSegment.endDate),
    };
  }, [selectedSegment]);

  const nights =
    form.checkIn && form.checkOut
      ? Math.max(0, daysBetween(form.checkIn, form.checkOut))
      : 0;

  function handleCityChange(city: string) {
    const seg = itinerary.find(
      (s) => s.city.toLowerCase() === city.toLowerCase()
    );
    if (seg) {
      setForm((p) => ({
        ...p,
        city: seg.city,
        country: seg.country,
        flag: seg.flag,
        checkIn: seg.startDate,
        checkOut: seg.endDate,
      }));
    } else {
      setForm((p) => ({ ...p, city, country: '', flag: '' }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    if (!form.checkIn || !form.checkOut) return;
    const cost = parseFloat(form.costPerNight);
    if (Number.isNaN(cost) || cost < 0) return;

    onAdd({
      name: form.name.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      flag: form.flag,
      type: form.type.trim() || undefined,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      costPerNight: cost,
      nights,
      link: form.link.trim() || null,
      status: form.bookedBy ? 'Booked' : 'Need to Book',
      bookedBy: form.bookedBy || null,
    });

    setForm(INITIAL_STATE);
    setTriedSubmit(false);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(INITIAL_STATE);
      setTriedSubmit(false);
    }
    onOpenChange(nextOpen);
  }

  const hasItinerary = cityOptions.length > 0;

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
              <Label>City</Label>
              {hasItinerary ? (
                <Select
                  value={form.city}
                  onValueChange={handleCityChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((seg) => (
                      <SelectItem key={seg.id} value={seg.city}>
                        {seg.flag} {seg.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label>Country</Label>
              <Input
                value={form.country}
                readOnly={hasItinerary && !!form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, country: e.target.value }))
                }
                placeholder={hasItinerary ? 'Select a city first' : 'Country'}
                className={hasItinerary && form.city ? 'bg-muted cursor-default' : ''}
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
              <Label>Check-in date</Label>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !form.checkIn ? 'text-muted-foreground' : ''
                    } ${triedSubmit && !form.checkIn ? 'border-destructive' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.checkIn ? fmtDate(form.checkIn) : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.checkIn ? toDateLocal(form.checkIn) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const dateStr = toDateStr(date);
                        setForm((p) => ({ ...p, checkIn: dateStr }));
                      }
                      setCheckInOpen(false);
                    }}
                    defaultMonth={
                      form.checkIn
                        ? toDateLocal(form.checkIn)
                        : segmentRange?.from
                    }
                    modifiers={
                      segmentRange
                        ? { itineraryRange: { from: segmentRange.from, to: segmentRange.to } }
                        : undefined
                    }
                    modifiersClassNames={
                      segmentRange
                        ? { itineraryRange: 'bg-primary/10 text-primary rounded-none' }
                        : undefined
                    }
                  />
                  {selectedSegment && (
                    <div className="px-3 pb-2 text-xs text-muted-foreground text-center">
                      {selectedSegment.flag} {selectedSegment.city}: {fmtDate(selectedSegment.startDate)} – {fmtDate(selectedSegment.endDate)}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Check-out date</Label>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !form.checkOut ? 'text-muted-foreground' : ''
                    } ${triedSubmit && !form.checkOut ? 'border-destructive' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.checkOut ? fmtDate(form.checkOut) : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.checkOut ? toDateLocal(form.checkOut) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const dateStr = toDateStr(date);
                        setForm((p) => ({ ...p, checkOut: dateStr }));
                      }
                      setCheckOutOpen(false);
                    }}
                    defaultMonth={
                      form.checkOut
                        ? toDateLocal(form.checkOut)
                        : segmentRange?.to ?? segmentRange?.from
                    }
                    modifiers={
                      segmentRange
                        ? { itineraryRange: { from: segmentRange.from, to: segmentRange.to } }
                        : undefined
                    }
                    modifiersClassNames={
                      segmentRange
                        ? { itineraryRange: 'bg-primary/10 text-primary rounded-none' }
                        : undefined
                    }
                    disabled={
                      form.checkIn
                        ? { before: toDateLocal(form.checkIn) }
                        : undefined
                    }
                  />
                  {selectedSegment && (
                    <div className="px-3 pb-2 text-xs text-muted-foreground text-center">
                      {selectedSegment.flag} {selectedSegment.city}: {fmtDate(selectedSegment.startDate)} – {fmtDate(selectedSegment.endDate)}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
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
          {buddyNames.length > 0 && (
            <div className="grid gap-2">
              <Label>Booked By</Label>
              <Select
                value={form.bookedBy}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, bookedBy: v === '__none__' ? '' : v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not yet booked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not yet booked</SelectItem>
                  {buddyNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
