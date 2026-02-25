import Link from 'next/link'

export const metadata = {
  title: 'Legal Notice — FCDC Extension Course',
  description: 'Legal notice and disclaimers for the FCDC Extension Course platform.',
}

export default function LegalPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Legal Notice</h1>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-semibold text-foreground">Operating Entity</h2>
        <p>
          This website is owned and operated by the Founding Church of Scientology of Washington,
          D.C. (FCDC), a religious organization established in 1955.
        </p>
        <address className="not-italic">
          Founding Church of Scientology of Washington, D.C.<br />
          1701 20th St NW<br />
          Washington, DC 20009<br />
          United States of America
        </address>

        <h2 className="text-lg font-semibold text-foreground pt-4">Purpose</h2>
        <p>
          The FCDC Extension Course platform is provided as a religious educational service,
          enabling individuals to study the works of L. Ron Hubbard through structured book and
          lecture courses with qualified supervision.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Disclaimers</h2>
        <p>
          While FCDC endeavors to ensure that the information on this website is accurate and
          up-to-date, we make no representations or warranties of any kind, express or implied,
          about the completeness, accuracy, reliability, or availability of the website or the
          information, products, services, or related graphics contained on the website.
        </p>
        <p>
          Any reliance you place on such information is strictly at your own risk. In no event will
          FCDC be liable for any loss or damage, including without limitation indirect or
          consequential loss or damage, arising from the use of this website.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">External Links</h2>
        <p>
          This website may contain links to external websites that are not operated by FCDC. We
          have no control over the content and practices of these sites and cannot be responsible
          for their respective privacy policies or practices.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Intellectual Property</h2>
        <p>
          SCIENTOLOGY, DIANETICS, L. RON HUBBARD, LRH, and related marks are trademarks and
          service marks owned by Religious Technology Center (RTC) and are used with its permission.
          For more details, see our{' '}
          <Link href="/copyright" className="text-primary hover:underline">Copyright & Trademark</Link>{' '}
          page.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Related Legal Documents</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <Link href="/copyright" className="text-primary hover:underline">Copyright & Trademark</Link>
          </li>
          <li>
            <Link href="/privacy" className="text-primary hover:underline">Privacy Notice</Link>
          </li>
          <li>
            <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
