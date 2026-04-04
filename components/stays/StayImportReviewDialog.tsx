'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Stay } from '@/lib/constants';
import type { ImportedStayCandidate } from '@/lib/stays/import';
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
  StayFormFields,
  makeStayFormValues,
  stayFormToPartial,
  type StayFormValues,
} from './AddStayForm';

interface ReviewItem extends ImportedStayCandidate {
  id: string;
  included: boolean;
  form: StayFormValues;
}

export interface StayImportReviewDialogProps {
  open: boolean;
  drafts: ImportedStayCandidate[];
  buddyNames?: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (drafts: ImportedStayCandidate[]) => Promise<void>;
}

function toReviewItems(drafts: ImportedStayCandidate[]): ReviewItem[] {
  return drafts.map((draft, index) => ({
    ...draft,
    id: `${draft.sourceFile}-${index}`,
    included: true,
    form: makeStayFormValues(draft.stay),
  }));
}

export function StayImportReviewDialog({
  open,
  drafts,
  buddyNames = [],
  onOpenChange,
  onConfirm,
}: StayImportReviewDialogProps) {
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

  const updateItem = (id: string, key: keyof StayFormValues, value: string) => {
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
      toast.error('Keep at least one stay draft to import.');
      return;
    }

    const invalid = selected.filter(
      (item) =>
        !item.form.name.trim() ||
        !item.form.city.trim() ||
        !item.form.country.trim() ||
        !item.form.checkIn.trim() ||
        !item.form.checkOut.trim(),
    );

    if (invalid.length > 0) {
      toast.error('Each stay needs a name, city, country, check-in, and check-out before you confirm.');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(
        selected.map((item) => ({
          ...item,
          stay: stayFormToPartial(item.form, item.stay) as Partial<Stay>,
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
          <DialogTitle>Review Imported Stays</DialogTitle>
          <DialogDescription>
            We pulled the stay details from the files. Tweak anything that looks off, then confirm
            the stays you want to add.
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
                  <StayFormFields
                    form={item.form}
                    onChange={(key, value) => updateItem(item.id, key, value)}
                    buddyNames={buddyNames}
                    idPrefix={`import-stay-${index}`}
                  />
                </div>
              )}
            </section>
          ))}
        </div>

        <DialogFooter className="items-center">
          <div className="mr-auto text-sm text-slate-500">
            {includedCount} {includedCount === 1 ? 'stay' : 'stays'} ready to confirm
          </div>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={handleConfirm}>
            {submitting ? 'Confirming…' : 'Confirm Stays'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
