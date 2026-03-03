'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ItinerarySegment } from '@/lib/constants';
import { fmtDate, addDays, daysBetween } from '@/lib/constants';
import type { BuddyRow } from '@/hooks/useBuddies';
import { motion, LayoutGroup } from 'framer-motion';
import { GripVertical } from 'lucide-react';
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
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  onTripDatesChange?: (start: string, end: string) => void;
}

export function TripPlanner({
  itinerary,
  onSave,
  onAddSegment,
  onRemoveSegment,
  buddies = [],
  tripStartDate: tripStartProp,
  tripEndDate: tripEndProp,
  onTripDatesChange,
}: TripPlannerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editIt, setEditIt] = useState<ItinerarySegment[]>([]);
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [newNights, setNewNights] = useState('3');

  const [dragPreview, setDragPreview] = useState<ItinerarySegment[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCurrentIndex = useRef<number | null>(null);
  const draggedId = useRef<string | null>(null);

  const [editingTripStart, setEditingTripStart] = useState(false);
  const [editingTripEnd, setEditingTripEnd] = useState(false);
  const [localTripStart, setLocalTripStart] = useState('');
  const [localTripEnd, setLocalTripEnd] = useState('');

  const masterStart = tripStartProp || itinerary[0]?.startDate || '';
  const itineraryEnd = itinerary.length > 0 ? itinerary[itinerary.length - 1].endDate : '';
  const masterEnd = tripEndProp || itineraryEnd;

  useEffect(() => {
    if (!editingTripStart) setLocalTripStart(masterStart);
  }, [masterStart, editingTripStart]);

  useEffect(() => {
    if (!editingTripEnd) setLocalTripEnd(masterEnd);
  }, [masterEnd, editingTripEnd]);

  const enterEditMode = useCallback(() => {
    setEditIt(itinerary.map((i) => ({ ...i })));
    setEditMode(true);
  }, [itinerary]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
  }, []);

  const recalcDatesFrom = useCallback((segments: ItinerarySegment[], startDate: string) => {
    const updated = [...segments];
    let currentStart = startDate;
    for (let i = 0; i < updated.length; i++) {
      updated[i] = {
        ...updated[i],
        startDate: currentStart,
        endDate: addDays(currentStart, updated[i].nights),
      };
      currentStart = addDays(currentStart, updated[i].nights);
    }
    return updated;
  }, []);

  const recalcDates = useCallback((segments: ItinerarySegment[]) => {
    return recalcDatesFrom(segments, masterStart || segments[0]?.startDate || '');
  }, [masterStart, recalcDatesFrom]);

  const saveEdit = useCallback(() => {
    const recalculated = recalcDatesFrom(editIt, masterStart || editIt[0]?.startDate || '');
    onSave(recalculated);
    setEditMode(false);
  }, [editIt, masterStart, onSave, recalcDatesFrom]);

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

  const handleSaveTripStart = useCallback(() => {
    setEditingTripStart(false);
    if (!localTripStart || localTripStart === masterStart) return;
    const source = editMode ? editIt : itinerary;
    const recalculated = recalcDatesFrom(source, localTripStart);
    if (editMode) {
      setEditIt(recalculated);
    } else {
      onSave(recalculated);
    }
    const endDate = recalculated.length > 0
      ? recalculated[recalculated.length - 1].endDate
      : (tripEndProp || '');
    if (endDate) {
      onTripDatesChange?.(localTripStart, endDate);
    }
  }, [localTripStart, masterStart, tripEndProp, editMode, editIt, itinerary, onSave, onTripDatesChange, recalcDatesFrom]);

  const handleSaveTripEnd = useCallback(() => {
    setEditingTripEnd(false);
    if (!localTripEnd || localTripEnd === masterEnd) return;
    if (!masterStart) return;
    onTripDatesChange?.(masterStart, localTripEnd);
  }, [localTripEnd, masterStart, masterEnd, onTripDatesChange]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragCurrentIndex.current = index;
    const source = editMode ? editIt : itinerary;
    draggedId.current = source[index].id;
    setIsDragging(true);
    if (!editMode) setDragPreview([...source]);
    e.dataTransfer.effectAllowed = 'move';
  }, [editMode, editIt, itinerary]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, overIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const from = dragCurrentIndex.current;
    if (from === null || from === overIndex) return;

    if (editMode) {
      setEditIt(prev => {
        const arr = [...prev];
        const [item] = arr.splice(from, 1);
        arr.splice(overIndex, 0, item);
        return arr;
      });
    } else {
      setDragPreview(prev => {
        if (!prev) return prev;
        const arr = [...prev];
        const [item] = arr.splice(from, 1);
        arr.splice(overIndex, 0, item);
        return arr;
      });
    }
    dragCurrentIndex.current = overIndex;
  }, [editMode]);

  const handleDragEnd = useCallback(() => {
    if (!editMode && dragPreview) {
      onSave(recalcDates(dragPreview));
    }
    setDragPreview(null);
    dragCurrentIndex.current = null;
    draggedId.current = null;
    requestAnimationFrame(() => setIsDragging(false));
  }, [editMode, dragPreview, onSave, recalcDates]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

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

  const displayIt = editMode
    ? editIt
    : dragPreview
      ? recalcDates(dragPreview)
      : itinerary;

  const allocatedNights = displayIt.reduce((sum, s) => sum + s.nights, 0);
  const tripDuration = masterStart && masterEnd ? daysBetween(masterStart, masterEnd) : allocatedNights;
  const nightsGap = tripDuration - allocatedNights;

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

      {(masterStart || displayIt.length > 0) && (
        <div className={`${styles.tripDates} ${nightsGap < 0 ? styles.tripDatesOver : ''}`}>
          <span className={styles.tripDatesLabel}>📅</span>
          <div className={styles.tripDatesRange}>
            {editingTripStart ? (
              <input
                type="date"
                value={localTripStart}
                onChange={(e) => setLocalTripStart(e.target.value)}
                onBlur={handleSaveTripStart}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTripStart(); }}
                autoFocus
                className={styles.tripDateInput}
              />
            ) : (
              <span
                className={styles.tripDateClickable}
                onClick={() => { setLocalTripStart(masterStart); setEditingTripStart(true); }}
              >
                {fmtDate(masterStart) || 'Start'}
              </span>
            )}
            <span className={styles.tripDateSep}>–</span>
            {editingTripEnd ? (
              <input
                type="date"
                value={localTripEnd}
                onChange={(e) => setLocalTripEnd(e.target.value)}
                onBlur={handleSaveTripEnd}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTripEnd(); }}
                autoFocus
                className={styles.tripDateInput}
              />
            ) : (
              <span
                className={styles.tripDateClickable}
                onClick={() => { setLocalTripEnd(masterEnd); setEditingTripEnd(true); }}
              >
                {fmtDate(masterEnd) || 'End'}
              </span>
            )}
          </div>
          <span className={styles.tripDatesNights}>
            {tripDuration}d
          </span>
        </div>
      )}

      {nightsGap < 0 && (
        <div className={styles.tripWarning}>
          <span className={styles.tripWarningIcon}>⚠️</span>
          <span>{Math.abs(nightsGap)} {Math.abs(nightsGap) === 1 ? 'night' : 'nights'} over — reduce stays or extend trip</span>
        </div>
      )}

      {nightsGap > 0 && (
        <div className={styles.tripGap}>
          <span className={styles.tripGapIcon}>📋</span>
          <span>{nightsGap} unplanned {nightsGap === 1 ? 'night' : 'nights'} — add destinations or shorten trip</span>
        </div>
      )}

      {nightsGap === 0 && displayIt.length > 0 && (
        <div className={styles.tripComplete}>
          <span>✓</span>
          <span>Trip fully planned · {allocatedNights} nights</span>
        </div>
      )}

      {displayIt.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No segments yet. Add your first destination!</p>
        </div>
      )}

      <LayoutGroup>
      <div className={styles.segmentList}>
        {displayIt.map((seg, i) => (
          <motion.div
            key={seg.id}
            layout={!isDragging}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`${styles.segment} ${draggedId.current === seg.id ? styles.dragging : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, i)}
            onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent<HTMLDivElement>, i)}
            onDrop={handleDrop as unknown as React.DragEventHandler<HTMLDivElement>}
            onDragEnd={handleDragEnd}
          >
            {editMode ? (
              <div>
                <div className={styles.editRow}>
                  <div className={styles.dragHandle}>
                    <GripVertical size={16} />
                  </div>
                  <span className={styles.segmentFlag}>{seg.flag}</span>
                  <span className={styles.segmentCity} style={{ flex: 1 }}>
                    {seg.city}
                  </span>
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
                <div className={styles.editRow}>
                  <Label className="text-xs">Nights:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={seg.nights ?? 1}
                    onChange={(e) =>
                      updateNights(i, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-16 h-7 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className={styles.segmentView}>
                <div className={styles.dragHandle}>
                  <GripVertical size={16} />
                </div>
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
          </motion.div>
        ))}
      </div>
      </LayoutGroup>

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
