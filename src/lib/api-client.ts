export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function triggerExamPipeline(submissionPayload: any) {
  const response = await fetch(`${API_BASE_URL}/grade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submissionPayload),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSessionHistory(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/history/${sessionId}`);
  
  if (!response.ok) {
    throw new Error(`History Fetch Error: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerStateRollback(sessionId: string, targetHash: string) {
  const response = await fetch(`${API_BASE_URL}/rollback/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_hash: targetHash }),
  });

  if (!response.ok) {
    throw new Error(`Rollback Error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGlobalThreats() {
  const response = await fetch(`${API_BASE_URL}/threats`);
  if (!response.ok) throw new Error(`Threats Fetch Error: ${response.statusText}`);
  return response.json();
}

export async function fetchSessionReport(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/report/${sessionId}`);
  if (!response.ok) throw new Error(`Report Fetch Error: ${response.statusText}`);
  return response.json();
}