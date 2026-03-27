// ═══════════════════════════════════════════
// SDS QR Code Modal
// Generates a scannable QR code linking to
// the public SDS PDF view for field use.
// ═══════════════════════════════════════════

import { useEffect, useRef } from "react"
import QRCode from "qrcode"
import { Download, Printer } from "lucide-react"
import { Modal } from "./PageUI.jsx"
import s from "./SDSQRModal.module.css"

export default function SDSQRModal({ sds, onClose }) {
  const canvasRef = useRef(null)
  const url = `${window.location.origin}/sds/${sds.id}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      })
    }
  }, [url])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    const safeName = (sds.product_name || sds.name || "sds").replace(/\s+/g, "-").toLowerCase()
    link.download = `sds-${safeName}-qr.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const handlePrint = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL()
    const name = sds.product_name || sds.name || "SDS"
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>SDS QR — ${name}</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:monospace">
          <div style="text-align:center">
            <img src="${dataUrl}" width="256" height="256" />
            <p style="margin-top:12px;font-size:14px;font-weight:600">${name}</p>
            <p style="font-size:11px;color:#666;word-break:break-all">${url}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Modal title={`QR Code — ${sds.product_name || sds.name || "SDS"}`} onClose={onClose} size="sm">
      <div className={s.body}>
        <canvas ref={canvasRef} className={s.canvas} />
        <div className={s.url}>{url}</div>
        <div className={s.hint}>
          Scan this code to view the Safety Data Sheet. Works without login — safe for posting on trucks, trailers, and job sites.
        </div>
      </div>
      <div className={s.actions}>
        <button className={s.secondaryBtn} onClick={handleDownload}>
          <Download size={14} /> Download PNG
        </button>
        <button className={s.primaryBtn} onClick={handlePrint}>
          <Printer size={14} /> Print
        </button>
      </div>
    </Modal>
  )
}
