import { useEffect, useRef } from "react";

export function usePage<T extends HTMLElement>(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  const headingRef = useRef<T>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return headingRef;
}
