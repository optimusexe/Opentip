"use client";

import { useEffect, useState } from "react";

export function FeatureVideo({ name }: { name: string }) {
  const [still, setStill] = useState(false);
  const [posterOnly, setPosterOnly] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const poster = `/videos/${name}.jpg`;
  if (still || posterOnly) {
    return (
      <div className="mkt-vid">
        <img src={poster} alt="" />
      </div>
    );
  }

  return (
    <div className="mkt-vid">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        onError={() => setPosterOnly(true)}
      >
        <source src={`/videos/${name}.webm`} type="video/webm" />
        <source src={`/videos/${name}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
