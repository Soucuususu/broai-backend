
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://soucuususu.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return reply({ error: "Envie uma mensagem usando POST." }, 405);
    }

    if (request.headers.get("Origin") !== "https://soucuususu.github.io") {
      return reply({ error: "Origem não autorizada." }, 403);
    }

    try {
      const body = await request.json();

      if (!Array.isArray(body.messages)) {
        return reply({ error: "Envie uma lista de mensagens." }, 400);
      }

      const messages = body.messages
        .filter(
          (m) =>
            m &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string"
        )
        .slice(-12)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 4000),
        }));

      if (!messages.length || !messages.some((m) => m.role === "user")) {
        return reply({ error: "Digite uma mensagem para a BroAI." }, 400);
      }

      const result = await env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct-fp8",
        {
          messages: [
            {
              role: "system",
              content:
                "Você é a BroAI, uma assistente de inteligência artificial útil, competente e original. Responda em português brasileiro quando o usuário falar português. Seja clara, natural e direta. Ajude com estudos, programação, criatividade e dúvidas gerais. Use o contexto das mensagens anteriores. Nunca invente certeza quando não souber a resposta.",
            },
            ...messages,
          ],
          max_tokens: 700,
        }
      );

      return reply({
        response: result.response || "Não consegui gerar uma resposta.",
      });
    } catch (error) {
      console.error("Erro na BroAI:", error);
      return reply(
        { error: "A IA não conseguiu responder. Verifique a configuração do Worker AI." },
        500
      );
    }
  },
};
        
