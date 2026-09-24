import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-8">
      <header>
        <Link href="/" className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">
          Salon AI
        </Link>
        <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-[#5a4144]">Son güncelleme: {updated}</p>
      </header>
      <div className="space-y-6 text-[1.05rem] leading-relaxed text-[#5a4144]">{children}</div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-[#3b2a2c]">{title}</h2>
      {children}
    </section>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-[#f6ebe4] px-1.5 py-0.5 font-medium text-[#8e4b56]">
      {children}
    </span>
  );
}
