import { NextRequest } from 'next/server';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { unlink, writeFile } from 'node:fs/promises';
import { createManualReviewStayCandidate, parseStayDocumentText } from '@/lib/stays/import';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

async function extractTextFromPdf(file: File) {
  const tempPath = path.join(tmpdir(), `${randomUUID()}.pdf`);
  try {
    await writeFile(tempPath, Buffer.from(await file.arrayBuffer()));
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf-text.cjs');
    const { stdout } = await execFileAsync(process.execPath, [scriptPath, tempPath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

async function extractTextFromImage(file: File) {
  const Tesseract = await import('tesseract.js');
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await Tesseract.recognize(buffer, 'eng');
  return result.data.text ?? '';
}

async function extractTextFromFile(file: File) {
  if (isPdf(file)) return extractTextFromPdf(file);
  if (isImage(file)) return extractTextFromImage(file);
  return file.text();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData
      .getAll('files')
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return Response.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    const imported = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of files) {
      try {
        const text = await extractTextFromFile(file);
        imported.push(parseStayDocumentText(text, file.name));
      } catch (error) {
        imported.push(
          createManualReviewStayCandidate(
            file.name,
            'We could not confidently read this stay file. Fill in the details manually before confirming.',
          ),
        );
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Failed to read stay file.',
        });
      }
    }

    return Response.json({ imported, errors });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to import stay files.' },
      { status: 500 },
    );
  }
}
