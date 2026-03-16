#!/usr/bin/env node

const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('Missing PDF file path.');
  }

  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const result = await parser.getText();
    process.stdout.write(result.text);
  } finally {
    await parser.destroy();
  }
}

main().catch((error) => {
  process.stderr.write(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
