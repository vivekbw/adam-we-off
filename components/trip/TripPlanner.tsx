'use client';

import { useState, useCallback } from 'react';
import type { ItinerarySegment } from '@/lib/constants';
import { fmtDate, addDays } from '@/lib/constants';
import type { BuddyRow } from '@/hooks/useBuddies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import styles from './TripPlanner.module.css';

export interface TripPlannerProps {
  itinerary: ItinerarySegment[];
  onSave: (updated: ItinerarySegment[]) => void;
  onAddSegment?: (partial: Partial<ItinerarySegment>) => void;
  onRemoveSegment?: (segId: string) => void;
  buddies?: BuddyRow[];
}

export function TripPlanner({ itinerary, onSave, onAddSegment, onRemoveSegment, buddies = [] }: TripPlannerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editIt, setEditIt] = useState<ItinerarySegment[]>([]);
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [newNights, setNewNights] = useState('3');

  const enterEditMode = useCallback(() => {
    setEditIt(itinerary.map((i) => ({ ...i })));
    setEditMode(true);
  }, [itinerary]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
  }, []);

  const saveEdit = useCallback(() => {
    const updated = [...editIt];
    let currentStart = updated[0].startDate;
    for (let i = 0; i < updated.length; i++) {
      updated[i] = {
        ...updated[i],
        startDate: currentStart,
        endDate: addDays(currentStart, updated[i].nights),
      };
      currentStart = addDays(currentStart, updated[i].nights);
    }
    onSave(updated);
    setEditMode(false);
  }, [editIt, onSave]);

  const moveItem = useCallback((from: number, to: number) => {
    if (to < 0 || to >= editIt.length) return;
    const arr = [...editIt];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setEditIt(arr);
  }, [editIt]);

  const updateNights = useCallback((index: number, nights: number) => {
    const arr = [...editIt];
    arr[index] = { ...arr[index], nights: Math.max(1, Math.min(30, nights)) };
    setEditIt(arr);
  }, [editIt]);

  const updateStartDate = useCallback((date: string) => {
    const arr = [...editIt];
    arr[0] = { ...arr[0], startDate: date };
    setEditIt(arr);
  }, [editIt]);

  function handleAddSegment() {
    if (!onAddSegment || !newCity.trim()) return;
    onAddSegment({
      city: newCity.trim(),
      country: newCountry.trim(),
      flag: newFlag.trim(),
      nights: parseInt(newNights, 10) || 3,
      countryCode: '',
    });
    setNewCity('');
    setNewCountry('');
    setNewFlag('');
    setNewNights('3');
    setShowAddSegment(false);
  }

  const displayIt = editMode ? editIt : itinerary;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>🗺️ Trip Planner</h3>
        {!editMode ? (
          <Button variant="outline" size="sm" onClick={enterEditMode}>
            Edit
          </Button>
        ) : (
          <div className={styles.btnGroup}>
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit}>
              Save
            </Button>
          </div>
        )}
      </div>
      <p className={styles.hint}>Changes cascade to all sections.</p>

      {displayIt.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No segments yet. Add your first destination!</p>
        </div>
      )}

      <div className={styles.segmentList}>
        {displayIt.map((seg, i) => (
          <div key={seg.id} className={styles.segment}>
            {editMode ? (
              <div>
                <div className={styles.editRow}>
                  <span className={styles.segmentFlag}>{seg.flag}</span>
                  <span className={styles.segmentCity} style={{ flex: 1 }}>
                    {seg.city}
                  </span>
                  <div className={styles.moveButtons}>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => moveItem(i, i - 1)}
                      disabled={i === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => moveItem(i, i + 1)}
                      disabled={i === editIt.length - 1}
                    >
                      ↓
                    </Button>
                    {onRemoveSegment && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon-xs">✕</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {seg.city}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This segment will be permanently removed from the itinerary.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                              onRemoveSegment(seg.id);
                              setEditIt((prev) => prev.filter((s) => s.id !== seg.id));
                            }}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                <div className={styles.editRow}>
                  <Label className="text-xs">Nights:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={seg.nights}
                    onChange={(e) =>
                      updateNights(i, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-16 h-7 text-sm"
                  />
                  {i === 0 && (
                    <>
                      <Label className="text-xs">Start:</Label>
                      <Input
                        type="date"
                        value={seg.startDate}
                        onChange={(e) => updateStartDate(e.target.value)}
                        className="h-7 text-sm"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.segmentView}>
                <span className={styles.segmentFlag}>{seg.flag}</span>
                <div className={styles.segmentInfo}>
                  <div className={styles.segmentCity}>
                    {seg.city}, {seg.country}
                  </div>
                  <div className={styles.segmentDates}>
                    {fmtDate(seg.startDate)} → {fmtDate(seg.endDate)} ·{' '}
                    {seg.nights} nights
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {onAddSegment && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => setShowAddSegment(true)}
        >
          + Add Destination
        </Button>
      )}

      {buddies.length > 0 && (
        <div className={styles.buddiesSection}>
          <div className={styles.buddiesTitle}>Travellers</div>
          <div className={styles.buddiesList}>
            {buddies.map((b) => (
              <div key={b.id} className={styles.buddy}>
                <div
                  className={styles.buddyAvatar}
                  style={{ backgroundColor: b.color }}
                >
                  {b.avatar ?? b.name[0]}
                </div>
                <span className={styles.buddyName}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showAddSegment} onOpenChange={setShowAddSegment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Destination</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddSegment();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="seg-city">City</Label>
              <CityAutocomplete
                id="seg-city"
                value={newCity}
                onChange={setNewCity}
                onSelect={(city, country, flag) => {
                  setNewCity(city);
                  setNewCountry(country);
                  setNewFlag(flag);
                }}
                placeholder="Search for a city…"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seg-country">Country</Label>
                <Input
                  id="seg-country"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="Auto-filled"
                  readOnly
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seg-flag">Flag</Label>
                <Input
                  id="seg-flag"
                  value={newFlag}
                  readOnly
                  placeholder="Auto"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seg-nights">Nights</Label>
              <Input
                id="seg-nights"
                type="number"
                min={1}
                max={30}
                value={newNights}
                onChange={(e) => setNewNights(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddSegment(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
