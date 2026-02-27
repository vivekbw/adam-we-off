'use client';

import { useState, useCallback } from 'react';
import type { ItinerarySegment } from '@/lib/constants';
import { BUDDIES, fmtDate, addDays } from '@/lib/constants';
import styles from './TripPlanner.module.css';

export interface TripPlannerProps {
  itinerary: ItinerarySegment[];
  onSave: (updated: ItinerarySegment[]) => void;
}

export function TripPlanner({ itinerary, onSave }: TripPlannerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editIt, setEditIt] = useState<ItinerarySegment[]>([]);

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

  const displayIt = editMode ? editIt : itinerary;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>🗺️ Trip Planner</h3>
        {!editMode ? (
          <button
            type="button"
            onClick={enterEditMode}
            className={styles.editBtn}
          >
            Edit
          </button>
        ) : (
          <div className={styles.btnGroup}>
            <button
              type="button"
              onClick={cancelEdit}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className={styles.saveBtn}
            >
              Save
            </button>
          </div>
        )}
      </div>
      <p className={styles.hint}>Changes cascade to all sections.</p>

      <div className={styles.segmentList}>
        {displayIt.map((seg, i) => (
          <div key={seg.id} className={styles.segment}>
            {editMode ? (
              <div>
                <div className={styles.editRow}>
                  <span className={styles.segmentFlag}>{seg.flag}</span>
                  <span
                    className={styles.segmentCity}
                    style={{ flex: 1 }}
                  >
                    {seg.city}
                  </span>
                  <div className={styles.moveButtons}>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      onClick={() => moveItem(i, i - 1)}
                      disabled={i === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      onClick={() => moveItem(i, i + 1)}
                      disabled={i === editIt.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Nights:</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={seg.nights}
                    onChange={(e) =>
                      updateNights(i, parseInt(e.target.value, 10) || 1)
                    }
                    className={styles.editInput}
                  />
                  {i === 0 && (
                    <>
                      <label className={styles.editLabel}>Start:</label>
                      <input
                        type="date"
                        value={seg.startDate}
                        onChange={(e) => updateStartDate(e.target.value)}
                        className={styles.editDateInput}
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

      <div className={styles.buddiesSection}>
        <div className={styles.buddiesTitle}>Travellers</div>
        <div className={styles.buddiesList}>
          {BUDDIES.map((b) => (
            <div key={b.id} className={styles.buddy}>
              <div
                className={styles.buddyAvatar}
                style={{ backgroundColor: b.color }}
              >
                {b.avatar}
              </div>
              <span className={styles.buddyName}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
