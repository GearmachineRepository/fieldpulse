// ═══════════════════════════════════════════
// Upload Middleware — Multer config factory
// ═══════════════════════════════════════════

import multer from 'multer'
import path from 'path'
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_FILE_TYPES } from '../constants/index.js'

/**
 * Creates a multer instance scoped to the given uploads directory.
 * @param {string} uploadsDir  Absolute path to the uploads folder
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
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(1)
      if (ALLOWED_FILE_TYPES.test(ext)) return cb(null, true)
      cb(new Error(`File type .${ext} is not allowed`))
    },
  })
}
