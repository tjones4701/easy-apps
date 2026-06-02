/**
 * Call a backend action from a React frontend.
 *
 * @param appId   - The app identifier (e.g. "leave-a-note")
 * @param name    - The action name (e.g. "getNotes")
 * @param input   - The action input payload
 * @param headers - Optional extra headers (e.g. auth headers)
 */
export async function callAction<TResult = unknown>(
  appId: string,
  name: string,
  input: unknown = {},
  headers: Record<string, string> = {}
): Promise<TResult> {
  const res = await fetch(`/apps/${appId}/api/actions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }

  return res.json() as Promise<TResult>;
}
