interface Props {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeading({ badge, title, subtitle, centered = true }: Props) {
  return (
    <div className={centered ? "text-center" : ""}>
      {badge && (
        <span className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {badge}
        </span>
      )}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
