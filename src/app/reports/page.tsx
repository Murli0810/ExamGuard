"use client";

import { FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchRecentSessions } from "@/lib/api-client";

export default function ReportsIndex() {

  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await fetchRecentSessions();
        setRecentSessions(res.sessions || []);
      } catch (e) {
        console.error("Failed to load recent sessions");
      }
    };
    loadRecent();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Executive Reports</h1>
        <p className="text-sm text-muted-foreground font-mono">/ session telemetry</p>
      </div>

      {recentSessions.length === 0 ? (
        <div className="panel p-12 flex flex-col items-center justify-center border-dashed border-border/60">
          <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-lg font-mono text-foreground">Awaiting Target Designation</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
            Execute a live pipeline from the Dashboard to automatically generate a report, or navigate to a specific Session ID to view historical telemetry.
          </p>
        </div>
      ) : (
        <div className="mt-6 mb-8">
          <h3 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-widest">Select Session Report</h3>
          <div className="rounded-md border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Session ID</th>
                  <th className="px-4 py-3 text-left font-medium">Total Commits</th>
                  <th className="px-4 py-3 text-left font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentSessions.map((session) => (
                  <tr 
                    key={session.session_id} 
                    className="hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
                      router.push(`/reports/${session.session_id}`);
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-primary">{session.session_id}</td>
                    <td className="px-4 py-3">{session.commit_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(session.last_active).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}