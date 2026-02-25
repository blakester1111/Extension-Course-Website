export const metadata = {
  title: 'Copyright & Trademark — FCDC Extension Course',
  description: 'Copyright and trademark information for the FCDC Extension Course.',
}

export default function CopyrightPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Copyright & Trademark</h1>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          &copy; 2026 Founding Church of Scientology of Washington, D.C. (FCDC). All rights reserved.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Copyright Notice</h2>
        <p>
          All content on this website, including but not limited to text, graphics, logos, images,
          audio clips, digital downloads, data compilations, and software, is the property of FCDC
          or its content suppliers and is protected by United States and international copyright laws.
        </p>
        <p>
          The compilation of all content on this site is the exclusive property of FCDC and is
          protected by U.S. and international copyright laws.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Trademark Notice</h2>
        <p>
          SCIENTOLOGY, DIANETICS, L. RON HUBBARD, LRH, and related marks are trademarks and
          service marks owned by Religious Technology Center (RTC) and are used with its permission.
        </p>
        <p>
          The FCDC Extension Course name and logo are trademarks of the Founding Church of
          Scientology of Washington, D.C.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Permitted Use</h2>
        <p>
          You may view and download material from this site for personal, non-commercial use only,
          provided you retain all copyright, trademark, and other proprietary notices contained in
          the original materials.
        </p>
        <p>
          You may not modify, reproduce, distribute, republish, display, or transmit any portion of
          this site for commercial purposes without the prior written consent of FCDC.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Contact</h2>
        <p>
          For questions about copyright or trademark matters, please contact us at:
        </p>
        <address className="not-italic">
          Founding Church of Scientology of Washington, D.C.<br />
          1701 20th St NW<br />
          Washington, DC 20009
        </address>
      </section>
    </div>
  )
}
