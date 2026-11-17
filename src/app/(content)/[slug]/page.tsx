import Link from "next/link";
import { notFound } from "next/navigation";

const pages = {
  "about-us": {
    eyebrow: "About NamNX",
    title: "Thoughtful pieces for everyday living.",
    description: "NamNX brings together useful, lasting objects that make home feel more personal.",
  },
  "our-company": {
    eyebrow: "Our company",
    title: "Made for a more considered way to shop.",
    description: "We curate modern essentials with clear information and a simple shopping experience.",
  },
  career: {
    eyebrow: "Careers",
    title: "Build the next chapter with us.",
    description: "We are always interested in meeting people who care about products, craft, and customer experience.",
  },
  "terms-and-conditions": {
    eyebrow: "Terms and conditions",
    title: "The details of shopping with NamNX.",
    description: "Our terms explain orders, payment, delivery, returns, and use of this website.",
  },
  cookies: {
    eyebrow: "Cookies",
    title: "How we use cookies.",
    description: "Cookies help the store remember your cart and make the site work smoothly.",
  },
  "contact-us": {
    eyebrow: "Contact us",
    title: "We are here to help.",
    description: "For product, delivery, or account questions, contact our customer care team.",
  },
  returns: {
    eyebrow: "Returns",
    title: "Returns made straightforward.",
    description: "Start by finding the relevant order in your account, then contact us with your order number.",
  },
  faqs: {
    eyebrow: "Frequently asked questions",
    title: "Answers for the common things.",
    description: "Find help with orders, delivery, returns, and your NamNX account.",
  },
} as const;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug as keyof typeof pages];

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{page.eyebrow}</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{page.title}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{page.description}</p>
      <Link href="/products" className="mt-10 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
        Explore the collection
      </Link>
    </div>
  );
}
