// ═══════════════════════════════════════════
// Upload Middleware — Multer config factory
// ═══════════════════════════════════════════

import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_FILE_TYPES } from '../constants/index.js'

// Extension-to-MIME mapping for double validation
const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
  'application/pdf',
])

/**
 * Creates a multer instance scoped to the given uploads directory.
 * @param {string} uploadsDir  Absolute path to the uploads folder
 */
export function createUpload(uploadsDir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(1)
      if (!ALLOWED_FILE_TYPES.test(ext)) {
        return cb(new Error(`File type .${ext} is not allowed`))
      }
      if (!ALLOWED_MIMES.has(file.mimetype)) {
        return cb(new Error(`MIME type ${file.mimetype} is not allowed`))
      }
      cb(null, true)
    },
  })
}
