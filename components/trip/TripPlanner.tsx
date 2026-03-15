'use client';

import { useState, useCallback } from 'react';
import { GripVertical, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { ItinerarySegment } from '@/lib/constants';
import { fmtDate, addDays, daysBetween } from '@/lib/constants';
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

interface PlannerTripDates {
  startDate: string;
  endDate: string;
}

export interface TripPlannerProps {
  itinerary: ItinerarySegment[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  onSave: (updated: ItinerarySegment[], tripDates: PlannerTripDates) => void | Promise<void>;
  onAddSegment?: (partial: Partial<ItinerarySegment>) => void;
  onRemoveSegment?: (segId: string) => void;
  buddies?: BuddyRow[];
}

function moveSegment(list: ItinerarySegment[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function buildItineraryPreview(segments: ItinerarySegment[], tripStartDate: string) {
  if (segments.length === 0) return [];

  let currentStart = tripStartDate || segments[0].startDate;

  return segments.map((segment) => {
    const updated = {
      ...segment,
      startDate: currentStart,
      endDate: addDays(currentStart, segment.nights),
    };
    currentStart = updated.endDate;
    return updated;
  });
}

function getFallbackTripDates(
  itinerary: ItinerarySegment[],
  tripStartDate?: string | null,
  tripEndDate?: string | null,
) {
  const itineraryStart = itinerary[0]?.startDate ?? new Date().toISOString().split('T')[0];
  const itineraryEnd = itinerary[itinerary.length - 1]?.endDate ?? itineraryStart;

  return {
    startDate: tripStartDate ?? itineraryStart,
    endDate: tripEndDate ?? itineraryEnd,
  };
}

export function TripPlanner({
  itinerary,
  tripStartDate,
  tripEndDate,
  onSave,
  onAddSegment,
  onRemoveSegment,
  buddies = [],
}: TripPlannerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editIt, setEditIt] = useState<ItinerarySegment[]>([]);
  const [editTripStart, setEditTripStart] = useState('');
  const [editTripEnd, setEditTripEnd] = useState('');
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dragOverSegmentId, setDragOverSegmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [newNights, setNewNights] = useState('3');
  const fallbackTripDates = getFallbackTripDates(itinerary, tripStartDate, tripEndDate);
  const displayTripStart = editMode ? editTripStart : fallbackTripDates.startDate;
  const displayTripEnd = editMode ? editTripEnd : fallbackTripDates.endDate;
  const previewItinerary = editMode
    ? buildItineraryPreview(editIt, editTripStart || fallbackTripDates.startDate)
    : itinerary;
  const totalPlannedDays = previewItinerary.reduce((sum, segment) => sum + segment.nights, 0);
  const totalTripDays =
    displayTripStart && displayTripEnd ? daysBetween(displayTripStart, displayTripEnd) : 0;
  const plannedTripEnd = previewItinerary[previewItinerary.length - 1]?.endDate ?? displayTripStart;
  const isTripOverflowing =
    Boolean(displayTripEnd) &&
    previewItinerary.length > 0 &&
    Boolean(plannedTripEnd) &&
    plannedTripEnd > displayTripEnd;
  const validationErrors: string[] = [];

  if (editMode) {
    if (!editTripStart) {
      validationErrors.push('Set the trip start date so destination dates can be calculated.');
    }
    if (!editTripEnd) {
      validationErrors.push('Set the trip end date to define the trip boundary.');
    }
    if (editTripStart && editTripEnd && editTripEnd < editTripStart) {
      validationErrors.push('Trip end date must be on or after the trip start date.');
    }
  }
  const hasValidationErrors = validationErrors.length > 0 || isTripOverflowing;

  const enterEditMode = useCallback(() => {
    setEditIt(itinerary.map((i) => ({ ...i })));
    setEditTripStart(fallbackTripDates.startDate);
    setEditTripEnd(fallbackTripDates.endDate);
    setDraggedSegmentId(null);
    setDragOverSegmentId(null);
    setEditMode(true);
  }, [fallbackTripDates.endDate, fallbackTripDates.startDate, itinerary]);

  const cancelEdit = useCallback(() => {
    setDraggedSegmentId(null);
    setDragOverSegmentId(null);
    setEditMode(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (hasValidationErrors) return;

    const updated = buildItineraryPreview(editIt, editTripStart);

    try {
      setIsSaving(true);
      await onSave(updated, { startDate: editTripStart, endDate: editTripEnd });
      setEditMode(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save trip changes');
    } finally {
      setIsSaving(false);
    }
  }, [editIt, editTripEnd, editTripStart, hasValidationErrors, onSave]);

  const moveItem = useCallback((from: number, to: number) => {
    setEditIt((current) => moveSegment(current, from, to));
  }, []);

  const updateNights = useCallback((index: number, nights: number) => {
    setEditIt((current) => {
      const next = [...current];
      next[index] = { ...next[index], nights: Math.max(1, Math.min(30, nights)) };
      return next;
    });
  }, []);

  const handleDragStart = useCallback((segmentId: string) => {
    setDraggedSegmentId(segmentId);
    setDragOverSegmentId(segmentId);
  }, []);

  const handleDragEnter = useCallback((targetSegmentId: string) => {
    if (!draggedSegmentId || draggedSegmentId === targetSegmentId) return;

    setEditIt((current) => {
      const from = current.findIndex((segment) => segment.id === draggedSegmentId);
      const to = current.findIndex((segment) => segment.id === targetSegmentId);
      return moveSegment(current, from, to);
    });
    setDragOverSegmentId(targetSegmentId);
  }, [draggedSegmentId]);

  const handleDragEnd = useCallback(() => {
    setDraggedSegmentId(null);
    setDragOverSegmentId(null);
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
            <Button size="sm" onClick={() => void saveEdit()} disabled={hasValidationErrors || isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>
      <p className={styles.hint}>Changes cascade to all sections.</p>

      <div className={`${styles.boundsCard} ${hasValidationErrors ? styles.boundsCardError : ''}`}>
        <div className={styles.boundsHeader}>
          <div>
            <div className={styles.boundsEyebrow}>Master Trip Window</div>
            {editMode && (
              <div className={styles.boundsTitle}>
                {displayTripStart ? fmtDate(displayTripStart) : 'Set start'} →{' '}
                {displayTripEnd ? fmtDate(displayTripEnd) : 'Set end'}
              </div>
            )}
          </div>
          <div className={styles.boundsSummary}>
            {totalTripDays > 0 ? `${totalTripDays} days total` : 'Add dates'}
          </div>
        </div>

        {editMode ? (
          <>
            <div className={styles.boundsGrid}>
              <div className={styles.field}>
                <Label htmlFor="trip-start" className="text-xs">Trip start</Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={editTripStart}
                  onChange={(e) => setEditTripStart(e.target.value)}
                  aria-invalid={hasValidationErrors}
                  className="h-8 text-sm"
                />
              </div>
              <div className={styles.field}>
                <Label htmlFor="trip-end" className="text-xs">Trip end</Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={editTripEnd}
                  onChange={(e) => setEditTripEnd(e.target.value)}
                  aria-invalid={hasValidationErrors}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {previewItinerary.length > 0 && (
              <div className={styles.boundsPreview}>
                <span className={styles.boundsPreviewDate}>
                  {fmtDate(previewItinerary[0].startDate)} → {fmtDate(plannedTripEnd)}
                </span>
                <span className={styles.boundsPreviewDays}>{totalPlannedDays} days</span>
              </div>
            )}
            {isTripOverflowing && (
              <div className={styles.inlineAlert}>Too many days!</div>
            )}
            {validationErrors.length > 0 && (
              <div className={styles.errorList}>
                {validationErrors.map((error) => (
                  <div key={error} className={styles.errorItem}>
                    <TriangleAlert size={14} />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {previewItinerary.length > 0 && (
              <div className={styles.boundsPreview}>
                <span className={styles.boundsPreviewDate}>
                  {fmtDate(previewItinerary[0].startDate)} → {fmtDate(plannedTripEnd)}
                </span>
                <span className={styles.boundsPreviewDays}>{totalPlannedDays} days</span>
              </div>
            )}
            {isTripOverflowing && (
              <div className={styles.inlineAlert}>Too many days!</div>
            )}
          </>
        )}
      </div>

      {previewItinerary.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No segments yet. Add your first destination!</p>
        </div>
      )}

      <div className={styles.segmentList}>
        {(editMode ? editIt : itinerary).map((seg, i) => {
          const previewSeg = previewItinerary[i] ?? seg;

          return (
            <div
              key={seg.id}
              className={[
                styles.segment,
                draggedSegmentId === seg.id ? styles.segmentDragging : '',
                dragOverSegmentId === seg.id ? styles.segmentDropTarget : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(event) => {
                if (!editMode) return;
                event.preventDefault();
              }}
              onDragEnter={() => {
                if (!editMode) return;
                handleDragEnter(seg.id);
              }}
              onDrop={(event) => {
                if (!editMode) return;
                event.preventDefault();
                handleDragEnd();
              }}
            >
              {editMode ? (
                <div>
                  <div className={styles.editRow}>
                    <button
                      type="button"
                      className={styles.dragHandle}
                      draggable
                      aria-label={`Drag to reorder ${seg.city}`}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', seg.id);
                        handleDragStart(seg.id);
                      }}
                      onDragEnd={handleDragEnd}
                    >
                      <GripVertical size={14} />
                    </button>
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
                  <div className={styles.previewDates}>
                    {fmtDate(previewSeg.startDate)} → {fmtDate(previewSeg.endDate)}
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
          );
        })}
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
