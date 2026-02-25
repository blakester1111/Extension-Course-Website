export const metadata = {
  title: 'Privacy Notice — FCDC Extension Course',
  description: 'Privacy notice for the FCDC Extension Course platform.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Privacy Notice</h1>

      <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Effective Date:</strong> January 1, 2026
        </p>
        <p>
          The Founding Church of Scientology of Washington, D.C. (&quot;FCDC,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
          operates the FCDC Extension Course platform. This Privacy Notice describes how we collect,
          use, and protect your personal information when you use our website and services.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-foreground">Account Information:</strong> Name, email address, and password when you create an account.</li>
          <li><strong className="text-foreground">Course Progress:</strong> Lesson submissions, completion records, and grades.</li>
          <li><strong className="text-foreground">Communications:</strong> Messages you send through our contact or invite forms.</li>
          <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our platform, including pages visited and features used.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground pt-4">How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Provide and maintain the Extension Course platform.</li>
          <li>Process lesson submissions and provide supervisor feedback.</li>
          <li>Track your course progress and generate honor roll standings.</li>
          <li>Communicate with you about your account and courses.</li>
          <li>Send invitation emails on your behalf when you use the Invite a Friend feature.</li>
          <li>Improve our services and user experience.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground pt-4">Data Controller</h2>
        <p>
          FCDC is the data controller for all personal information collected through this platform.
          We process your data in accordance with applicable privacy laws.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Data Sharing</h2>
        <p>
          We do not sell your personal information. We may share your information with course
          supervisors for the purpose of grading your submissions, and with service providers who
          help us operate the platform (such as email delivery services).
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal
          information against unauthorized access, alteration, disclosure, or destruction.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal information by
          contacting us. You may also request that we stop processing your data in certain
          circumstances.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">Contact</h2>
        <p>
          For privacy-related inquiries, please contact us at:
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
