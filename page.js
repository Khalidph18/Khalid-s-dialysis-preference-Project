'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold">App Restored</h1>
      <p className="mt-2">Your app is running without hydration errors.</p>
    </main>
  );
}
