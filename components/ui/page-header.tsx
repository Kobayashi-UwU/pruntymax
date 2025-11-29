interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <header className="space-y-4 text-center">
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">{eyebrow}</p>
      )}
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {subtitle && <p className="mx-auto max-w-2xl text-lg text-white/70">{subtitle}</p>}
    </header>
  );
}
