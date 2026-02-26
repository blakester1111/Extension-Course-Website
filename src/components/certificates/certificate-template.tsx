'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface CertificateTemplateProps {
  studentName: string
  courseTitle: string
  attesterName: string
  sealerName: string
  issuedAt: string
  certificateNumber: string
  isBackentered?: boolean
  sealImageUrl?: string | null
  attesterSignatureUrl?: string | null
  sealerSignatureUrl?: string | null
}

export function CertificateTemplate({
  studentName,
  courseTitle,
  attesterName,
  sealerName,
  issuedAt,
  certificateNumber,
  isBackentered,
  sealImageUrl,
  attesterSignatureUrl,
  sealerSignatureUrl,
}: CertificateTemplateProps) {
  const certRef = useRef<HTMLDivElement>(null)
  function handlePrint() {
    const content = certRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Certificate - ${studentName}</title>
      <style>@page{size:landscape;margin:0}body{margin:0;padding:0}${getCertCSS()}</style>
      </head><body>${content.outerHTML}</body></html>`)
    printWindow.document.close()
    printWindow.onload = () => printWindow.print()
  }

  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Split course title at colon for two-line display
  const colonIdx = courseTitle.indexOf(':')
  let line1 = courseTitle.toUpperCase()
  let line2: string | null = null
  if (colonIdx > 0) {
    line1 = courseTitle.substring(0, colonIdx).trim().toUpperCase()
    line2 = courseTitle.substring(colonIdx + 1).trim().toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Certificate
        </Button>
      </div>

      {/* Inject styles for in-page preview */}
      <style dangerouslySetInnerHTML={{ __html: getCertCSS() }} />

      <div className="overflow-auto border rounded-lg bg-white p-2 sm:p-4">
        <div ref={certRef} className="cp">
          <div className="cb">
            {/* Top header */}
            <div className="ct-top">Golden Age of Knowledge</div>
            <div className="ct-rule" />

            {/* Seal */}
            <div className="ct-seal">
              {sealImageUrl ? (
                <img src={sealImageUrl} alt="Seal" className="ct-seal-img" />
              ) : (
                <div className="ct-seal-ph">
                  <span className="ct-seal-ico">&#9878;</span>
                </div>
              )}
            </div>

            {/* Organization */}
            <div className="ct-org">Church of Scientology</div>
            <div className="ct-dept">Qualifications Division, Department of Validity</div>

            {/* Certify */}
            <div className="ct-cert"><em>Does Hereby Certify That</em></div>

            {/* Student */}
            <div className="ct-name">{studentName.toUpperCase()}</div>

            {/* Completion */}
            <div className="ct-comp">
              <em>Has Completed the Training Requirements for<br />and is Recognized as a Graduate of the</em>
            </div>

            {/* Course */}
            <div className="ct-course">
              {line1}<br />
              {line2 && <>{line2}<br /></>}
              EXTENSION COURSE
            </div>

            {/* Spacer pushes bottom section down */}
            <div className="ct-spacer" />

            {/* Bottom gold rule */}
            <div className="ct-rule" />

            {/* Signatures */}
            <div className="ct-sigs">
              <div className="ct-sig ct-sig-l">
                <div className="ct-sig-lbl">Attested by</div>
                <div className="ct-sig-box">
                  {isBackentered ? (
                    <span className="ct-be">(Back-entered)</span>
                  ) : attesterSignatureUrl ? (
                    <img src={attesterSignatureUrl} alt={attesterName} className="ct-sig-img" />
                  ) : (
                    <span className="ct-sig-ln" />
                  )}
                </div>
                <div className="ct-sig-ttl">Certificates &amp; Awards</div>
                <div className="ct-issued">
                  Issued at&nbsp;&nbsp;<span className="ct-ul">Founding Church of Scientology Washington, DC</span>
                </div>
              </div>

              <div className="ct-sig ct-sig-c">
                <div className="ct-sig-lbl">Attested by</div>
                <div className="ct-sig-box">
                  {isBackentered ? (
                    <span className="ct-be">(Back-entered)</span>
                  ) : sealerSignatureUrl ? (
                    <img src={sealerSignatureUrl} alt={sealerName} className="ct-sig-img" />
                  ) : sealerName ? (
                    <span className="ct-sig-nm">{sealerName}</span>
                  ) : (
                    <span className="ct-sig-ln" />
                  )}
                </div>
                <div className="ct-sig-ttl">Keeper of the Seals and Signature</div>
                <div className="ct-meta">
                  Date&nbsp;&nbsp;<span className="ct-ul">{formattedDate}</span>
                </div>
              </div>

              <div className="ct-sig ct-sig-r">
                <div className="ct-sig-lbl">&nbsp;</div>
                <div className="ct-sig-box ct-sig-box-r">
                  <em className="ct-founder">L. Ron Hubbard</em>
                </div>
                <div className="ct-sig-ttl">Founder</div>
                <div className="ct-meta ct-meta-r">
                  Certificate No.&nbsp;&nbsp;<span className="ct-ul">
                    {isBackentered ? (certificateNumber || 'Back Entered') : (certificateNumber || '—')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCertCSS() {
  return `
.cp{width:11in;height:8.5in;background:#fdfcf7;font-family:Georgia,'Times New Roman',serif;color:#2a2a2a;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
.cb{width:calc(100% - .8in);height:calc(100% - .6in);border:1px solid #c4a35a;padding:.25in .6in .2in;box-sizing:border-box;display:flex;flex-direction:column;align-items:center}

.ct-top{text-align:center;font-size:10px;letter-spacing:5px;color:#9a8a60;text-transform:uppercase;margin-bottom:2px}
.ct-rule{width:100%;height:1px;background:#c4a35a;margin:2px 0;flex-shrink:0}

.ct-seal{margin:10px 0 6px;display:flex;justify-content:center}
.ct-seal-img{height:80px;width:auto;object-fit:contain}
.ct-seal-ph{width:80px;height:80px;border-radius:50%;border:2px solid #c4a35a;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f5f0e0,#fdfcf7)}
.ct-seal-ico{font-size:32px;color:#8b7d3c}

.ct-org{text-align:center;font-size:14px;font-variant:small-caps;font-weight:bold;letter-spacing:2px;margin-top:4px}
.ct-dept{text-align:center;font-size:8px;font-variant:small-caps;letter-spacing:1.5px;color:#555;margin-bottom:6px}
.ct-cert{text-align:center;font-size:12px;color:#555;margin:6px 0 4px}
.ct-name{text-align:center;font-size:24px;font-weight:bold;letter-spacing:3px;margin:2px 0}
.ct-comp{text-align:center;font-size:11px;color:#555;line-height:1.6;margin:4px 0}
.ct-course{text-align:center;font-size:17px;font-weight:bold;letter-spacing:2px;line-height:1.5;margin:2px 0 0}

.ct-spacer{flex:1}

.ct-sigs{width:100%;display:flex;justify-content:space-between;align-items:flex-start;margin-top:6px}
.ct-sig{flex:1}
.ct-sig-l{text-align:left}
.ct-sig-c{text-align:left}
.ct-sig-r{text-align:right}

.ct-sig-lbl{font-size:8px;font-style:italic;color:#999}
.ct-sig-box{height:32px;display:flex;align-items:flex-end;margin:1px 0}
.ct-sig-box-r{justify-content:flex-end}
.ct-sig-img{max-height:30px;max-width:140px;object-fit:contain}
.ct-sig-ln{display:inline-block;width:120px;border-bottom:1px solid #ccc}
.ct-sig-nm{font-style:italic;font-size:13px}
.ct-sig-ttl{font-size:7px;text-transform:uppercase;letter-spacing:.5px;color:#999;margin-top:0}
.ct-be{font-style:italic;font-size:9px;color:#bbb}
.ct-founder{font-size:16px}

.ct-issued,.ct-meta{font-size:7px;color:#999;font-style:italic;margin-top:4px}
.ct-meta-r{text-align:right}
.ct-ul{border-bottom:1px solid #ccc;padding-bottom:1px}

@media print{body{background:#fff}.cp{width:100%;height:100vh}}
`
}
