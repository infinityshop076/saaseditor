import { useState, useEffect } from "react";

const FREE_LIMIT = 5;
const STORAGE_KEY = "watermarkai_credits_used";

export function useCredits() {
  const [used, setUsed] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    setUsed(stored);
    setLoaded(true);
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - used);
  const hasCredits = remaining > 0;

  const consume = () => {
    const next = used + 1;
    setUsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const reset = () => {
    setUsed(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { used, remaining, hasCredits, consume, reset, loaded, FREE_LIMIT };
}
