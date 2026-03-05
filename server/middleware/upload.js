// ═══════════════════════════════════════════
// Upload Middleware — Multer config factory
// Extracted from index.js for single responsibility
// ═══════════════════════════════════════════

import multer from 'multer'
import path from 'path'

/**
 * Creates a multer instance scoped to a given uploads directory.
 * @param {string} uploadsDir - Absolute path to the uploads folder
 */
export function createUpload(uploadsDir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
      cb(null, `${unique}${path.extname(file.originalname)}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|webp|heic|pdf/i
      const ext = path.extname(file.originalname).toLowerCase().slice(1)
      if (allowed.test(ext)) return cb(null, true)
      cb(new Error(`File type .${ext} is not allowed`))
    },
  })
}
