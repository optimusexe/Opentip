import type { Metadata } from "next";

export const SITE_ORIGIN = "https://opentip.tech";
export const SITE_NAME = "Opentip";
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;
export const DEFAULT_SHARE_IMAGE_PATH = "/ogimage.png";
export const DEFAULT_SHARE_ALT = "Tip any repo in crypto.";

export function absoluteSiteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path === "" || path === "/") return SITE_ORIGIN;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export type ShareImage = {
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  alt: string;
  type: "image/png";
};

export function shareImage(path: string, alt: string = DEFAULT_SHARE_ALT): ShareImage {
  const url = absoluteSiteUrl(path);
  return {
    url,
    secureUrl: url,
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    alt,
    type: "image/png",
  };
}

export function pageShareMetadata(input: {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
}): Metadata {
  const image = shareImage(input.imagePath ?? DEFAULT_SHARE_IMAGE_PATH, input.imageAlt ?? DEFAULT_SHARE_ALT);
  const url = absoluteSiteUrl(input.path);
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
