import { useState } from "react";

// Full-screen blurred background image with a dark overlay for readability.
// Drop your image into /public as background.jpg (or .png/.jpeg/.webp) and it
// is picked up automatically. If no image is found, the sky→grass gradient
// from index.css shows through instead.
const CANDIDATES = [
  "background.jpg",
  "background.png",
  "background.jpeg",
  "background.webp",
];

export default function Background() {
  const [idx, setIdx] = useState(0);
  const src =
    idx < CANDIDATES.length
      ? `${import.meta.env.BASE_URL}${CANDIDATES[idx]}`
      : null;

  return (
    <div className="app-bg-wrap" aria-hidden="true">
      {src && (
        <img
          className="app-bg-img"
          src={src}
          alt=""
          onError={() => setIdx((i) => i + 1)}
        />
      )}
      <div className="app-bg-overlay" />
    </div>
  );
}
