import { getImageProps } from "next/image";
import manifest from "@/content/images.json";

type Name = keyof typeof manifest;

// <picture> с AVIF и запасным WebP. Размеры берутся из манифеста,
// который пишет scripts/optimize-images.mjs. Картинки кейсов («cases/<id>/<имя>»)
// лежат в public/cases, остальные - в public/images.
export function Pic({
  name,
  alt,
  sizes,
  eager = false,
  className,
}: {
  name: Name;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const { width, height } = manifest[name];
  const common = { alt, width, height, sizes };
  const path = name.startsWith("cases/") ? `/${name}` : `/images/${name}`;
  const { props: avif } = getImageProps({ ...common, src: `${path}.avif` });
  const { props: webp } = getImageProps({ ...common, src: `${path}.webp` });
  return (
    <picture>
      <source type="image/avif" srcSet={avif.srcSet} sizes={sizes} />
      <img
        {...webp}
        alt={alt}
        className={className}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
