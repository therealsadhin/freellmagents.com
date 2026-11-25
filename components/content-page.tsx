import type { ReactNode } from "react";

export function ContentPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1050px] flex-1 px-5 py-12 sm:px-7 sm:py-16 lg:px-12">
      <header className="max-w-3xl">
        <h1 className="font-heading text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      </header>
      <div className="prose-content mt-10 max-w-3xl text-[15px] leading-7 text-foreground">
        {children}
      </div>
    </main>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="font-heading text-2xl font-semibold tracking-[-0.025em]">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
