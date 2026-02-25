export const metadata = {
  title: 'Terms of Use — FCDC Extension Course',
  description: 'Terms of use for the FCDC Extension Course platform.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Terms of Use</h1>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Effective Date:</strong> January 1, 2026
        </p>
        <p>
          Welcome to the FCDC Extension Course platform, operated by the Founding Church of
          Scientology of Washington, D.C. (&quot;FCDC,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or
          using this website, you agree to be bound by these Terms of Use.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Eligibility</h2>
        <p>
          You must be at least 18 years old or have the consent of a parent or guardian to use this
          platform. By creating an account, you represent that the information you provide is
          accurate and complete.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Account Responsibilities</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account. You agree to notify us immediately of
          any unauthorized use of your account.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Use the platform for any unlawful purpose.</li>
          <li>Submit false or misleading information.</li>
          <li>Interfere with or disrupt the platform or its servers.</li>
          <li>Attempt to gain unauthorized access to any part of the platform.</li>
          <li>Copy, distribute, or modify course materials without authorization.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground pt-4">Course Materials</h2>
        <p>
          All course materials, lesson content, and related resources are provided for your personal
          educational use only. These materials are protected by copyright and may not be reproduced,
          distributed, or shared without the prior written consent of FCDC.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Submissions</h2>
        <p>
          Lesson submissions are reviewed by qualified supervisors. FCDC reserves the right to
          assess, grade, and provide feedback on all submissions according to our educational
          standards.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Termination</h2>
        <p>
          FCDC reserves the right to suspend or terminate your access to the platform at any time,
          with or without cause, and with or without notice.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Limitation of Liability</h2>
        <p>
          The platform is provided &quot;as is&quot; without warranties of any kind. FCDC shall not be liable
          for any indirect, incidental, special, or consequential damages arising from your use of
          the platform.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Governing Law</h2>
        <p>
          These Terms of Use shall be governed by and construed in accordance with the laws of the
          District of Columbia, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Contact</h2>
        <p>
          For questions about these Terms of Use, please contact us at:
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
