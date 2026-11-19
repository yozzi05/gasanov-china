import { getImageProps } from "next/image";
import manifest from "@/content/images.json";

type Name = keyof typeof manifest;

// <picture> с AVIF и запасным WebP. Размеры берутся из манифеста,
// который пишет scripts/optimize-images.mjs.
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
  const { props: avif } = getImageProps({ ...common, src: `/images/${name}.avif` });
  const { props: webp } = getImageProps({ ...common, src: `/images/${name}.webp` });
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
