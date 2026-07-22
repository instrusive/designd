"use client";

import { useCallback, useRef, useState } from "react";

export function useResizablePanel({
  defaultWidth,
  min = 200,
  max = 800,
  side,
}: {
  defaultWidth: number;
  min?: number;
  max?: number;
  side: "left" | "right";
}) {
  const [width, setWidth] = useState(defaultWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta =
          side === "right"
            ? startX.current - ev.clientX
            : ev.clientX - startX.current;
        setWidth(Math.max(min, Math.min(max, startWidth.current + delta)));
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [width, min, max, side]
  );

  return { width, onMouseDown };
}
