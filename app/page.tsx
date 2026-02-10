import { Dashboard } from "@/components/Dashboard";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Dashboard />
      <footer className="mt-10 text-xs muted">
        GitHub Pages + Actions • dados em <code className="text-white/80">public/data</code>
      </footer>
    </main>
  );
}
