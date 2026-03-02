'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mutate as globalMutate } from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { createTrip, type CreateTripInput } from '@/hooks/useTrips';

interface NewTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTripModal({ open, onOpenChange }: NewTripModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverCity, setCoverCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Trip name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateTripInput = {
        name: trimmedName,
        start_date: startDate || null,
        end_date: endDate || null,
        cover_city: coverCity.trim() || null,
      };
      const id = await createTrip(input);
      if (id) {
        toast.success('Trip created');
        globalMutate('trips');
        onOpenChange(false);
        router.push(`/trip/${id}`);
        setName('');
        setStartDate('');
        setEndDate('');
        setCoverCity('');
      } else {
        toast.error('Failed to create trip');
      }
    } catch {
      toast.error('Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSubmitting) {
      setName('');
      setStartDate('');
      setEndDate('');
      setCoverCity('');
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Trip</DialogTitle>
          <DialogDescription>
            Create a new trip to start planning your adventure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="trip-name">Trip name</Label>
            <Input
              id="trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer in Europe"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="start-date">Start date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end-date">End date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover-city">Cover city</Label>
            <CityAutocomplete
              id="cover-city"
              value={coverCity}
              onChange={setCoverCity}
              onSelect={(city) => setCoverCity(city)}
              placeholder="Search for a city…"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Trip'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
