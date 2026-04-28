import { useState, useEffect, useCallback } from "react";

export function useCredits() {
  const [remaining, setRemaining] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setRemaining(data.credits);
        setIsPro(data.isPro);
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const consume = async () => {
    try {
      const res = await fetch("/api/credits", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRemaining(data.credits);
        setIsPro(data.isPro);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error consuming credit:", err);
      return false;
    }
  };

  const hasCredits = isPro || remaining > 0;

  return { remaining, isPro, hasCredits, consume, refresh: fetchCredits, loaded };
}
