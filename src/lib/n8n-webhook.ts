export async function triggerN8nWebhook(
  webhookUrl: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("n8n webhook error:", error);
  }
}
