import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-semibold">FCDC Extension Course</h3>
            <p className="text-sm text-muted-foreground">
              Complete your book and lecture courses from anywhere with the Founding Church of Scientology of Washington, D.C.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Quick Links</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/catalog" className="hover:text-foreground transition-colors">Catalog</Link>
              <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
              <Link href="/calculator" className="hover:text-foreground transition-colors">Calculator</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
              <Link href="/invite" className="hover:text-foreground transition-colors">Invite a Friend</Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Legal</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/copyright" className="hover:text-foreground transition-colors">Copyright</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Notice</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
              <Link href="/legal" className="hover:text-foreground transition-colors">Legal Notice</Link>
            </nav>
          </div>

          {/* External Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Related Sites</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="https://www.thefoundingchurch.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                The Founding Church
              </a>
              <a href="https://www.scientology.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Scientology.org
              </a>
              <a href="https://www.scientology.tv" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Scientology.tv
              </a>
              <a href="https://www.scientology.org/gaknews" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                GAK News
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; 2026 FCDC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
