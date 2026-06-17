// edge-functions/large-language-model.ts
import { serve } from "https://deno.land/std/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  let contents: unknown[];
  try {
    const body = await req.json();

    // Support both {contents} format (Gemini-native) and
    // {system, messages} format (Anthropic-style shim requested by UI)
    if (Array.isArray(body.contents) && body.contents.length > 0) {
      contents = body.contents;
    } else if (body.messages) {
      // Convert Anthropic-style messages → Gemini contents
      const msgs = body.messages as Array<{ role: string; content: string }>;
      const systemPrompt: string = body.system ?? "";
      const geminiContents: unknown[] = [];
      if (systemPrompt) {
        geminiContents.push({ role: "user", parts: [{ text: systemPrompt }] });
        geminiContents.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions." }] });
      }
      for (const m of msgs) {
        geminiContents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
      contents = geminiContents;
    } else {
      throw new Error("Missing contents or messages");
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const upstream = await fetch(
    "https://app-ccsvi1y42nlt-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ contents }),
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
