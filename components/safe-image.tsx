"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
};

/**
 * next/image + onError fallback.
 * 이미지 깨지거나 src 없으면 가을 톤 placeholder ("이미지 준비중") 표시.
 */
export default function SafeImage({ src, alt, className, ...rest }: Props) {
  const [error, setError] = useState(!src);

  if (error || !src) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-cream/60 border border-maple/15 text-bark/60 ${
          className ?? ""
        }`}
      >
        <ImageOff className="h-5 w-5 text-maple/50" />
        <span className="text-[10px] font-semibold">이미지 준비중</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...rest}
    />
  );
}
