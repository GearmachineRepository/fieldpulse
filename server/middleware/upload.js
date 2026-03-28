// ═══════════════════════════════════════════
// Upload Middleware — Multer + Supabase Storage
//
// Files are buffered in memory via multer, then
// uploaded to Supabase Storage. The filename on
// req.file(s) is set to the storage path so route
// code doesn't need to change.
//
// Falls back to disk storage if Supabase is not configured.
// ═══════════════════════════════════════════

import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import supabase from '../lib/supabase.js'
import { logger } from '../utils/logger.js'
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_FILE_TYPES } from '../constants/index.js'

const BUCKET = 'uploads'

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'application/pdf',
])

/**
 * Creates a multer instance.
 * - If Supabase is configured: uses memoryStorage (buffers in RAM)
 * - If not: falls back to disk storage
 */
export function createUpload(uploadsDir) {
  const storage = supabase
    ? multer.memoryStorage()
    : multer.diskStorage({
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

/**
 * Uploads a single file buffer to Supabase Storage.
 * Returns the filename (storage path).
 */
async function uploadFileToSupabase(file) {
  const ext = path.extname(file.originalname).toLowerCase()
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(filename, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  })

  if (error) {
    logger.error({ err: error, filename }, 'Supabase Storage upload failed')
    throw new Error('File upload failed')
  }

  return filename
}

/**
 * Express middleware — uploads multer memory-buffered files to Supabase Storage.
 * Must be used AFTER multer middleware in the chain.
 * Sets req.file.filename / req.files[].filename to the Supabase storage path.
 *
 * No-op if Supabase is not configured (files already saved to disk by multer).
 */
export function uploadToStorage(req, res, next) {
  if (!supabase) return next()

  const uploads = []

  if (req.file?.buffer) {
    uploads.push(
      uploadFileToSupabase(req.file).then((name) => {
        req.file.filename = name
      }),
    )
  }

  if (req.files?.length) {
    for (const file of req.files) {
      if (file.buffer) {
        uploads.push(
          uploadFileToSupabase(file).then((name) => {
            file.filename = name
          }),
        )
      }
    }
  }

  if (uploads.length === 0) return next()

  Promise.all(uploads)
    .then(() => next())
    .catch(next)
}
