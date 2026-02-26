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
}

export function CertificateTemplate({
  studentName,
  courseTitle,
  attesterName,
  sealerName,
  issuedAt,
  certificateNumber,
  isBackentered,
}: CertificateTemplateProps) {
  const certRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = certRef.current
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${studentName}</title>
        <style>
          @page { size: landscape; margin: 0; }
          body { margin: 0; padding: 0; }
          ${getCertStyles()}
        </style>
      </head>
      <body>
        ${content.outerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Certificate
        </Button>
      </div>

      <div className="overflow-auto border rounded-lg bg-white p-4">
        <div ref={certRef} className="cert-page">
          {/* Top text */}
          <div className="cert-top-text">GOLDEN AGE OF KNOWLEDGE</div>

          {/* Gold line */}
          <div className="cert-gold-line" />

          {/* Seal/Crest placeholder */}
          <div className="cert-seal">
            <div className="cert-seal-inner">
              <div className="cert-seal-text-top">GOLDEN AGE</div>
              <div className="cert-seal-icon">&#9878;</div>
              <div className="cert-seal-text-bottom">KNOWLEDGE</div>
            </div>
          </div>

          {/* Organization */}
          <div className="cert-org">
            <div className="cert-org-name">Church of Scientology</div>
            <div className="cert-org-dept">Qualifications Division, Department of Validity</div>
          </div>

          {/* Certify text */}
          <div className="cert-certify-text">Does Hereby Certify That</div>

          {/* Student name */}
          <div className="cert-student-name">{studentName.toUpperCase()}</div>

          {/* Completion text */}
          <div className="cert-completion-text">
            <em>Has Completed the Training Requirements for<br />and is Recognized as a Graduate of the</em>
          </div>

          {/* Course title */}
          <div className="cert-course-title">
            {courseTitle.toUpperCase()}<br />
            EXTENSION COURSE
          </div>

          {/* Gold line */}
          <div className="cert-gold-line cert-bottom-line" />

          {/* Bottom section */}
          <div className="cert-bottom">
            <div className="cert-bottom-left">
              <div className="cert-attestation">
                <div className="cert-attest-label">Attested by</div>
                {isBackentered ? (
                  <div className="cert-attest-backentered">(Back-entered certificate)</div>
                ) : (
                  <div className="cert-attest-line" />
                )}
                <div className="cert-attest-title">Certificates & Awards</div>
              </div>
              <div className="cert-issued-info">
                <div className="cert-issued-line">
                  Issued at <span className="cert-issued-value">Founding Church of Scientology Washington, DC</span>
                </div>
              </div>
            </div>

            <div className="cert-bottom-center">
              <div className="cert-attestation">
                <div className="cert-attest-label">Attested by</div>
                {isBackentered ? (
                  <div className="cert-attest-backentered">(Back-entered certificate)</div>
                ) : (
                  <div className="cert-attest-name">{sealerName}</div>
                )}
                <div className="cert-attest-title">Keeper of the Seals and Signature</div>
              </div>
              <div className="cert-date-cert-row">
                <div className="cert-date-block">
                  Date <span className="cert-date-value">{formattedDate}</span>
                </div>
                <div className="cert-number-block">
                  Certificate No. <span className="cert-number-value">
                    {certificateNumber || (isBackentered ? 'Back-entered' : '—')}
                  </span>
                </div>
              </div>
            </div>

            <div className="cert-bottom-right">
              <div className="cert-founder-sig">
                <em>L. Ron Hubbard</em>
              </div>
              <div className="cert-founder-label">Founder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCertStyles() {
  return `
    .cert-page {
      width: 11in;
      min-height: 8.5in;
      background: #fffef9;
      padding: 0.5in 0.75in;
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #333;
      position: relative;
      box-sizing: border-box;
    }

    .cert-top-text {
      text-align: center;
      font-size: 11px;
      letter-spacing: 6px;
      color: #999;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .cert-gold-line {
      height: 1px;
      background: linear-gradient(to right, transparent, #c4a35a, transparent);
      margin: 8px 0;
    }

    .cert-bottom-line {
      margin-top: 24px;
    }

    .cert-seal {
      display: flex;
      justify-content: center;
      margin: 16px 0 12px;
    }

    .cert-seal-inner {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid #c4a35a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f0e0 0%, #fff 100%);
    }

    .cert-seal-text-top,
    .cert-seal-text-bottom {
      font-size: 8px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #8b7d3c;
      font-weight: bold;
    }

    .cert-seal-icon {
      font-size: 32px;
      color: #8b7d3c;
      line-height: 1;
    }

    .cert-org {
      text-align: center;
      margin: 12px 0 8px;
    }

    .cert-org-name {
      font-size: 16px;
      font-variant: small-caps;
      font-weight: bold;
      letter-spacing: 2px;
    }

    .cert-org-dept {
      font-size: 11px;
      font-variant: small-caps;
      letter-spacing: 1px;
      color: #555;
    }

    .cert-certify-text {
      text-align: center;
      font-style: italic;
      font-size: 13px;
      color: #666;
      margin: 16px 0 8px;
    }

    .cert-student-name {
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 3px;
      margin: 8px 0;
    }

    .cert-completion-text {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin: 8px 0;
      line-height: 1.6;
    }

    .cert-course-title {
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 2px;
      line-height: 1.4;
      margin: 8px 0 16px;
    }

    .cert-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 16px;
      padding-top: 8px;
    }

    .cert-bottom-left,
    .cert-bottom-center,
    .cert-bottom-right {
      flex: 1;
    }

    .cert-bottom-center {
      text-align: center;
    }

    .cert-bottom-right {
      text-align: right;
    }

    .cert-attestation {
      margin-bottom: 12px;
    }

    .cert-attest-label {
      font-size: 9px;
      font-style: italic;
      color: #888;
    }

    .cert-attest-line {
      border-bottom: 1px solid #ccc;
      width: 120px;
      margin: 4px 0 2px;
    }

    .cert-attest-name {
      font-style: italic;
      font-size: 14px;
      border-bottom: 1px solid #ccc;
      display: inline-block;
      padding-bottom: 2px;
      margin: 2px 0;
    }

    .cert-attest-backentered {
      font-style: italic;
      font-size: 10px;
      color: #aaa;
      margin: 4px 0 2px;
    }

    .cert-attest-title {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
    }

    .cert-issued-info {
      font-size: 8px;
      color: #888;
    }

    .cert-issued-line {
      font-style: italic;
    }

    .cert-issued-value {
      font-style: italic;
      border-bottom: 1px solid #ccc;
    }

    .cert-date-cert-row {
      display: flex;
      justify-content: center;
      gap: 24px;
      font-size: 8px;
      color: #888;
    }

    .cert-date-block,
    .cert-number-block {
      font-style: italic;
    }

    .cert-date-value,
    .cert-number-value {
      border-bottom: 1px solid #ccc;
      font-style: italic;
    }

    .cert-founder-sig {
      font-size: 18px;
      font-style: italic;
      margin-bottom: 4px;
    }

    .cert-founder-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
    }

    @media print {
      body { background: white; }
      .cert-page {
        width: 100%;
        min-height: auto;
        padding: 0.5in;
      }
    }
  `
}
