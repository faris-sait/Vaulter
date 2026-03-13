export default function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-purple-300">// {eyebrow}</p> : null}
      <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl md:leading-[0.98]">{title}</h2>
      {description ? <p className="mt-5 max-w-2xl text-base leading-8 text-purple-200 md:text-xl">{description}</p> : null}
    </div>
  );
}
