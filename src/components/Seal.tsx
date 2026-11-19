// Печать-иньчжан G17. Один и тот же знак - логотип, загрузчик, штамп на кейсах.
export function Seal({
  className,
  title,
  color = "#C8102E",
  carve = "#F4EFE6",
}: {
  className?: string;
  title?: string;
  color?: string;
  carve?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* неровный край оттиска */}
      <path
        fill={color}
        d="M7 5.5 30 4l22 1.2L78 4l15.5 1.5.8 22-1 24 1.2 26-1 17.5-21 .8-24-1-25 1.2L5.5 95l-1-20L6 51 4.2 27z"
      />
      <path
        fill="none"
        stroke={carve}
        strokeWidth="2.2"
        d="M13.5 13 50 12l36.5 1 .6 37-.6 37-36.5 1-36.5-1-.6-37z"
      />
      <g fill="none" stroke={carve} strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M43 28H24v44h19V52H34" />
        <path d="M56 28v44" />
        <path d="M66 28h14L70 72" />
      </g>
      {/* сколы оттиска */}
      <g fill={color}>
        <path d="M22 40l5 1-4 3z" />
        <path d="M74 60l4 2-5 2z" />
        <path d="M54 46l4 1-3 3z" />
      </g>
      <g fill={carve}>
        <circle cx="9" cy="62" r="1.2" />
        <circle cx="91" cy="34" r="1" />
        <path d="M60 93.5l6-.6-5 2z" />
      </g>
    </svg>
  );
}
