import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  const { messages, tripContext } = await req.json();

  const systemPrompt = `You are a friendly expert travel assistant for "We Off" app. ${tripContext || 'Trip: Asia Summer 2026, May 24 – Jun 13. Cities: Tokyo (5n), Hanoi (4n), Chiang Mai (2n), Bangkok (3n), Phi Phi Islands (2n), Ubud (2n), Uluwatu (2n). Group: Adam (shellfish allergy), Kate (vegetarian), Vienna, and the user. All flights booked except DPS→YYZ return. Vietnam e-visa required.'} Be concise and helpful.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return Response.json(
        { error: `Anthropic API error: ${res.status}`, details: errorBody },
        { status: res.status }
      );
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(parsed.delta.text));
                  }
                } catch {
                  // skip unparseable lines
                }
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to connect to Anthropic API' },
      { status: 500 }
    );
  }
}
