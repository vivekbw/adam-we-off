'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Flight } from '@/lib/constants';
import type { ImportedFlightCandidate } from '@/lib/flights/import';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FlightFormFields,
  flightFormToPartial,
  makeFlightFormValues,
  type FlightFormValues,
} from './AddFlightForm';

interface ReviewItem extends ImportedFlightCandidate {
  id: string;
  included: boolean;
  form: FlightFormValues;
}

export interface FlightImportReviewDialogProps {
  open: boolean;
  drafts: ImportedFlightCandidate[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (drafts: ImportedFlightCandidate[]) => Promise<void>;
}

function toReviewItems(drafts: ImportedFlightCandidate[]): ReviewItem[] {
  return drafts.map((draft, index) => ({
    ...draft,
    id: `${draft.sourceFile}-${index}`,
    included: true,
    form: makeFlightFormValues(draft.flight),
  }));
}

export function FlightImportReviewDialog({
  open,
  drafts,
  onOpenChange,
  onConfirm,
}: FlightImportReviewDialogProps) {
  const [items, setItems] = useState<ReviewItem[]>(() => toReviewItems(drafts));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setItems(toReviewItems(drafts));
    }
  }, [drafts, open]);

  const includedCount = useMemo(
    () => items.filter((item) => item.included).length,
    [items],
  );

  const updateItem = (id: string, key: keyof FlightFormValues, value: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, form: { ...item.form, [key]: value } } : item,
      ),
    );
  };

  const toggleIncluded = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, included: !item.included } : item,
      ),
    );
  };

  const handleConfirm = async () => {
    const selected = items.filter((item) => item.included);
    if (selected.length === 0) {
      toast.error('Keep at least one flight draft to import.');
      return;
    }

    const invalid = selected.filter(
      (item) =>
        !item.form.from.trim() ||
        !item.form.to.trim() ||
        !item.form.date.trim(),
    );

    if (invalid.length > 0) {
      toast.error('Each flight needs a from city, to city, and date before you confirm.');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(
        selected.map((item) => ({
          ...item,
          flight: flightFormToPartial(item.form, item.flight) as Partial<Flight>,
        })),
      );
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Review Imported Flights</DialogTitle>
          <DialogDescription>
            We pulled what we could from the files. Edit anything that looks off, then confirm the
            flights you want to add.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-2">
          {items.map((item, index) => (
            <section
              key={item.id}
              className={`rounded-2xl border p-5 transition-opacity ${
                item.included ? 'bg-white/90' : 'bg-slate-50/80 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    File {index + 1}
                  </div>
                  <div className="text-base font-semibold text-slate-900">{item.sourceFile}</div>
                  <div className="text-sm text-slate-600">{item.summary}</div>
                  {item.confirmationCode && (
                    <div className="text-xs text-slate-500">
                      Confirmation: {item.confirmationCode}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant={item.included ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => toggleIncluded(item.id)}
                >
                  {item.included ? 'Skip This One' : 'Include Again'}
                </Button>
              </div>

              {item.warnings.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.warnings.map((warning) => (
                    <span
                      key={warning}
                      className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                    >
                      {warning}
                    </span>
                  ))}
                </div>
              )}

              {item.extractedText && (
                <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700">
                    View extracted text
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                    {item.extractedText}
                  </pre>
                </details>
              )}

              {item.included && (
                <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <FlightFormFields
                    form={item.form}
                    onChange={(key, value) => updateItem(item.id, key, value)}
                    idPrefix={`import-flight-${index}`}
                  />
                </div>
              )}
            </section>
          ))}
        </div>

        <DialogFooter className="items-center">
          <div className="mr-auto text-sm text-slate-500">
            {includedCount} {includedCount === 1 ? 'flight' : 'flights'} ready to confirm
          </div>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={handleConfirm}>
            {submitting ? 'Confirming…' : 'Confirm Flights'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
