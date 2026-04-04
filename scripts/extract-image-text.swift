import AppKit
import Foundation
import Vision

guard CommandLine.arguments.count > 1 else {
  fputs("Usage: extract-image-text.swift <image-path>\n", stderr)
  exit(1)
}

let imagePath = CommandLine.arguments[1]
let imageUrl = URL(fileURLWithPath: imagePath)

guard let image = NSImage(contentsOf: imageUrl) else {
  fputs("Could not open image.\n", stderr)
  exit(1)
}

var rect = CGRect(origin: .zero, size: image.size)
guard let cgImage = image.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
  fputs("Could not create CGImage.\n", stderr)
  exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
  try handler.perform([request])
  let observations = request.results ?? []
  let lines = observations.compactMap { observation in
    observation.topCandidates(1).first?.string
  }
  FileHandle.standardOutput.write(lines.joined(separator: "\n").data(using: .utf8)!)
} catch {
  fputs("OCR failed: \(error.localizedDescription)\n", stderr)
  exit(1)
}
