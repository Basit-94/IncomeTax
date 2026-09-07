/** Compare engine-produced signed net positions; never parse money copy. */
export function regimeReaction(selected: "new" | "old" | null, outcomes: { new: number; old: number } | null): "idle" | "happy" | "concerned" {
  if (!selected || !outcomes || !Number.isFinite(outcomes.new) || !Number.isFinite(outcomes.old) || outcomes.new === outcomes.old) return "idle";
  return outcomes[selected] > outcomes[selected === "new" ? "old" : "new"] ? "happy" : "concerned";
}
export function agentReaction(status: "running" | "waiting_for_input" | "waiting_for_review" | "completed" | "cancelled" | "failed", sending: boolean, error: string | null): "working" | "listening" | "reading" | "happy" | "idle" | "error" {
  if (error || status === "failed") return "error";
  if (status === "cancelled") return "idle";
  if (sending || status === "running") return "working";
  if (status === "waiting_for_review") return "reading";
  if (status === "waiting_for_input") return "listening";
  return "happy";
}
