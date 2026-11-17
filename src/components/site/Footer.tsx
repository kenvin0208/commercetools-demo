import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

const companyLinks: FooterLink[] = [
  { label: "About us", href: "/about-us" },
  { label: "Our company", href: "/our-company" },
  { label: "Career", href: "/career" },
];

const accountLinks: FooterLink[] = [
  { label: "Terms and conditions", href: "/terms-and-conditions" },
  { label: "Cookies", href: "/cookies" },
  { label: "My account", href: "/account" },
  { label: "My orders", href: "/account/orders" },
];

const supportLinks: FooterLink[] = [
  { label: "Contact us", href: "/contact-us" },
  { label: "Returns", href: "/returns" },
  { label: "FAQs", href: "/faqs" },
];

function FooterLinks({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <section aria-labelledby={`${title.toLowerCase().replace(/\s/g, "-")}-footer-title`}>
      <h2 id={`${title.toLowerCase().replace(/\s/g, "-")}-footer-title`} className="text-sm font-bold text-white">
        {title}
      </h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-slate-400 transition hover:text-white focus-visible:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FacebookIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M13.8 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.4H8.2V13h2.6v8h3Z" /></svg>;
}

function YouTubeIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2C2 9 2 12 2 12s0 3 .4 4.8a2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2C22 15 22 12 22 12s0-3-.4-4.8ZM10 15.2V8.8l5.3 3.2-5.3 3.2Z" /></svg>;
}

function XIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M18.8 3H22l-7 8 8.2 10H17l-4.9-6.2L6.7 21H3.5l7.5-8.6L3.1 3h6.4l4.4 5.6L18.8 3Zm-1.1 16h1.8L8.6 4.9H6.7L17.7 19Z" /></svg>;
}

function GoogleMark() {
  return <svg aria-label="Google" viewBox="0 0 74 24" className="h-6 w-[74px]" role="img"><text x="0" y="18" fill="#4285F4" fontFamily="Arial, sans-serif" fontSize="21" fontWeight="700">G</text><text x="17" y="18" fill="currentColor" fontFamily="Arial, sans-serif" fontSize="19">oogle</text></svg>;
}

function AdobeMark() {
  return <svg aria-label="Adobe" viewBox="0 0 75 24" className="h-6 w-[75px]" role="img"><path d="M0 1h11l7 16L11 1H0Zm24 0h-5L8 23h24L24 1Z" fill="#ed1c24" /><text x="37" y="18" fill="currentColor" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700">Adobe</text></svg>;
}

function CommercetoolsMark() {
  return <svg aria-label="commercetools" viewBox="0 0 130 24" className="h-6 w-[130px]" role="img"><circle cx="11" cy="12" r="10" fill="#00b8de" /><path d="M7 11.3h8v2H7zM10 8h2v8h-2z" fill="white" /><text x="25" y="17" fill="currentColor" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700">commercetools</text></svg>;
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.45fr_0.75fr_1fr_0.75fr] lg:gap-8 lg:px-8 lg:py-16">
        <section aria-label="NamNX and partners">
          <Link href="/" className="inline-block text-3xl font-black tracking-tight text-white">
            NamNX
          </Link>

          <div className="mt-7 flex gap-3" aria-label="Social media">
            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="NamNX on Facebook" className="inline-flex size-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-white hover:bg-white hover:text-slate-950">
              <FacebookIcon />
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="NamNX on YouTube" className="inline-flex size-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-white hover:bg-white hover:text-slate-950">
              <YouTubeIcon />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="NamNX on X" className="inline-flex size-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-white hover:bg-white hover:text-slate-950">
              <XIcon />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-slate-300">
            <GoogleMark />
            <AdobeMark />
            <CommercetoolsMark />
          </div>
        </section>

        <FooterLinks title="Company" links={companyLinks} />
        <FooterLinks title="Customer care" links={accountLinks} />
        <FooterLinks title="Help" links={supportLinks} />
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} NamNX. All rights reserved.</p>
          <p>Designed for thoughtful shopping.</p>
        </div>
      </div>
    </footer>
  );
}
