import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import type { Theme } from '@/hooks/use-theme'

type LegalKind = 'privacy' | 'terms'

export function LegalPage({ kind, theme, onToggleTheme }: { kind: LegalKind; theme: Theme; onToggleTheme: () => void }) {
  const isPrivacy = kind === 'privacy'
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 signal-grid opacity-[0.45] dark:opacity-[0.24]" />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center px-4 sm:px-6">
          <a href="/" aria-label="FlashUpload home"><Brand /></a>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Button asChild variant="outline" size="sm"><a href="/"><ArrowLeft className="h-3.5 w-3.5" /> Back to app</a></Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[960px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-10">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> legal / production</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Effective September 26, 2026 · FlashUpload · flashupload.cassielae.me</p>
        </div>

        <article className="overflow-hidden rounded-[1.7rem] border border-border/75 bg-card/68 shadow-[0_28px_80px_-55px_rgba(15,23,42,.45)] backdrop-blur">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </article>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>FlashUpload is an open-source project.</span>
          <div className="flex gap-4"><a href="/privacy" className="hover:text-foreground">Privacy</a><a href="/terms" className="hover:text-foreground">Terms</a><a href="https://github.com/cassielxyz/flashupload" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">Source <ExternalLink className="h-3 w-3" /></a></div>
        </div>
      </main>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="divide-y divide-border/70">
      <LegalSection title="1. What FlashUpload does">
        <p>FlashUpload is a browser-based large-file uploader and Google Drive workspace. It uses Google Identity Services for sign-in and the Google Drive API to create and manage files and folders that you create with, or explicitly grant to, FlashUpload.</p>
        <p>File bytes are designed to travel directly from your browser to Google Drive. FlashUpload does not operate a first-party file relay or storage server for those upload bytes.</p>
      </LegalSection>
      <LegalSection title="2. Google account information and permissions">
        <p>When you connect Google, FlashUpload may receive your Google account name, email address, profile image, and a short-lived OAuth access token so it can show the connected account and perform the Drive operations you request.</p>
        <p>FlashUpload requests the narrow <code>https://www.googleapis.com/auth/drive.file</code> permission. This allows the app to create and manage files and folders created with FlashUpload or specifically made available to the app. FlashUpload does not request unrestricted access to every file in your Google Drive.</p>
      </LegalSection>
      <LegalSection title="3. Files and local browser data">
        <p>Your browser handles the local file you select, including metadata such as filename, size, MIME type, and last-modified time. Upload content is sent to Google Drive API endpoints.</p>
        <p>To support resumable transfers, FlashUpload temporarily stores resumable-session information in your browser's IndexedDB, including a session URL, transfer checkpoint, filename metadata, and destination folder identifier. These records are removed after successful completion or explicit cancellation where practical.</p>
      </LegalSection>
      <LegalSection title="4. OAuth tokens and authentication">
        <p>Google OAuth access tokens are held in page memory and are not intentionally persisted to localStorage by FlashUpload. If a token expires, the app may request a fresh token from Google Identity Services.</p>
        <p>You can revoke FlashUpload's access from your Google Account permissions at any time. You can also disconnect the account from the FlashUpload interface.</p>
      </LegalSection>
      <LegalSection title="5. Sharing and visibility">
        <p>Public link sharing is optional and disabled by default. If you explicitly enable the “Anyone-with-link” setting, FlashUpload asks Google Drive to create a public reader permission for newly completed uploads. Google Drive's own sharing controls and policies apply.</p>
      </LegalSection>
      <LegalSection title="6. Analytics, advertising, and selling data">
        <p>The production project does not include first-party advertising trackers or analytics by default. FlashUpload does not sell your personal information or file content.</p>
      </LegalSection>
      <LegalSection title="7. Service providers and third parties">
        <p>Google Identity Services and Google Drive are third-party services required for the connected Drive functionality. Their processing of information is governed by Google's applicable terms and privacy policies. Hosting and static delivery may be provided by the project's deployment provider.</p>
      </LegalSection>
      <LegalSection title="8. Security">
        <p>FlashUpload minimizes server-side data handling by keeping upload payloads on the direct browser-to-Google-Drive route. Resumable-session URLs are treated as sensitive browser-local data. No internet service can guarantee absolute security, so you should also protect your device and Google account.</p>
      </LegalSection>
      <LegalSection title="9. Your choices and deletion">
        <p>You can delete or trash files through FlashUpload's Drive workspace, remove local site data in your browser, disconnect Google, or revoke the app's Google access. Deleting data from Google Drive is subject to Google Drive behavior, retention, trash, and administrative policies.</p>
      </LegalSection>
      <LegalSection title="10. Contact and policy changes">
        <p>For privacy questions or project support, use the repository's public project channels. For a security vulnerability, use GitHub private vulnerability reporting when available rather than posting sensitive details in a public issue.</p>
        <p>This policy may be updated as FlashUpload changes. Material revisions will be reflected on this page with an updated effective date.</p>
      </LegalSection>
    </div>
  )
}

function TermsContent() {
  return (
    <div className="divide-y divide-border/70">
      <LegalSection title="1. Acceptance and service scope">
        <p>By using FlashUpload, you agree to these Terms of Service. FlashUpload provides a browser interface for resumable uploads and file-management operations with your connected Google Drive account.</p>
      </LegalSection>
      <LegalSection title="2. Your account and content">
        <p>You remain responsible for your Google account, the files you select, and the content you upload or manage. FlashUpload does not claim ownership of your files. You must have the right to upload, store, share, rename, move, or delete content you operate on through the service.</p>
      </LegalSection>
      <LegalSection title="3. Acceptable use">
        <p>Do not use FlashUpload to violate law, infringe rights, abuse Google services, bypass account or storage restrictions, distribute malicious content, or interfere with the service or other systems.</p>
      </LegalSection>
      <LegalSection title="4. Google Drive dependency">
        <p>FlashUpload depends on Google Identity Services and Google Drive APIs. Google account limits, storage quotas, rate limits, availability, policies, and sharing restrictions still apply. FlashUpload cannot guarantee that Google will accept every operation.</p>
      </LegalSection>
      <LegalSection title="5. Upload speed and reliability">
        <p>FlashUpload cannot exceed the physical upload bandwidth or reliability of your internet connection. Resumable sessions are intended to reduce wasted retransmission after interruptions, but successful completion cannot be guaranteed in every browser, network, device, or Google API condition.</p>
      </LegalSection>
      <LegalSection title="6. Public sharing">
        <p>If you enable public link sharing, you are asking Google Drive to make the relevant uploaded file readable to anyone who obtains that link. You are responsible for deciding whether a file is appropriate to share publicly.</p>
      </LegalSection>
      <LegalSection title="7. Availability and changes">
        <p>FlashUpload may change, suspend, or remove features as the project evolves, including to respond to browser, Google API, security, or deployment changes. Backward compatibility is not guaranteed.</p>
      </LegalSection>
      <LegalSection title="8. Disclaimer">
        <p>FlashUpload is provided on an “as is” and “as available” basis without warranties of uninterrupted operation, fitness for a particular purpose, or error-free transfers, to the extent permitted by applicable law. Keep independent backups of important data.</p>
      </LegalSection>
      <LegalSection title="9. Limitation of responsibility">
        <p>To the extent permitted by applicable law, the project maintainers are not responsible for indirect or consequential loss arising from network failures, third-party service behavior, lost credentials, deleted files, sharing choices, or unavailable Google Drive operations.</p>
      </LegalSection>
      <LegalSection title="10. Open source and contact">
        <p>The source code is available from the FlashUpload GitHub repository under its stated open-source license. Project questions may be raised through the repository's support channels. Security vulnerabilities should use private vulnerability reporting where available.</p>
      </LegalSection>
    </div>
  )
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="p-6 sm:p-8"><h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2><div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-foreground">{children}</div></section>
}
