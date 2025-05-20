"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const queryCode = searchParams.get("code");
    setCode(queryCode || "No code provided.");
  }, [searchParams]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Code Viewer</h1>
      <pre className="bg-gray-100 p-4 rounded border">
        <code>{code}</code>
      </pre>
    </div>
  );
}
