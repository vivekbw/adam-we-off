'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './StayImportDropzone.module.css';

export interface StayImportDropzoneProps {
  onImport: (files: File[]) => Promise<void>;
}

export function StayImportDropzone({ onImport }: StayImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      await onImport(files);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,image/*,text/plain,.txt,.html,.htm,.eml"
        multiple
        className={styles.input}
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      <div className={styles.copy}>
        <div className={styles.iconWrap}>
          {uploading ? <Loader2 size={18} className={styles.spinner} /> : <FileUp size={18} />}
        </div>
        <div>
          <div className={styles.title}>Drop stay confirmations or screenshots here</div>
          <p className={styles.subtitle}>
            We&apos;ll pull the stay details, let you review them, and add a fallback image when needed.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Reading files…' : 'Choose Files'}
      </Button>
    </div>
  );
}
