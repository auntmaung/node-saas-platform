import Image from "next/image";
import styles from "./page.module.css";

export default async function Home() {
  // During Day 1 we’ll call core-api directly (no fancy proxy yet).
  const baseUrl = process.env.CORE_API_BASE_URL ?? "http://localhost:4000";

  let api: any = null;
  try {
    const res = await fetch(`${baseUrl}/health`, { cache: "no-store" });
    api = await res.json();
  } catch (e) {
    api = { error: "core-api not reachable" };
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>SaaS Platform</h1>
      <p>Web is up.</p>

      <h2>core-api /health</h2>
      <pre>{JSON.stringify(api, null, 2)}</pre>
    </main>
  );
}

