// KM Studio — generazione dei programmi dei corsi con Claude.
// Riceve parametri del corso, storico, feedback e regole; risponde con un programma strutturato.
// L'app lo ripassa comunque dal suo controllo regole prima di salvarlo.
//
// Serve la variabile d'ambiente ANTHROPIC_API_KEY (Netlify → Site configuration → Environment variables).
// Facoltativa: ANTHROPIC_MODEL (predefinito: claude-sonnet-5-5).

const SCHEMA = {
  type: "object",
  properties: {
    formato: { type: "string" },
    intensita: { type: "integer", minimum: 1, maximum: 10 },
    blocchi: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          fase: { type: "string", enum: ["warm", "main", "finisher", "cool"] },
          min: { type: "integer", minimum: 1 },
          nota: { type: "string" },
          esercizi: {
            type: "array",
            items: {
              type: "object",
              properties: { n: { type: "string", description: "nome esatto dall'elenco esercizi_ammessi" }, d: { type: "string", description: "dosaggio: tempo, ripetizioni o stazione" } },
              required: ["n", "d"]
            }
          }
        },
        required: ["nome", "fase", "min", "esercizi"]
      }
    },
    motivazioni: { type: "array", items: { type: "string" }, description: "perché la seduta è fatta così, in italiano, frasi brevi" }
  },
  required: ["formato", "intensita", "blocchi", "motivazioni"]
};

export default async (req) => {
  if (req.method !== "POST") return new Response("Usa POST", { status: 405 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ errore: "ANTHROPIC_API_KEY non configurata" }, { status: 503 });

  let input;
  try { input = await req.json(); } catch { return Response.json({ errore: "JSON non valido" }, { status: 400 }); }

  const system = [
    "Sei il programmatore dei corsi di gruppo dello studio di personal training di Kone Moctar.",
    "Prepari la seduta di oggi per un corso, partendo dai parametri, dallo storico delle ultime sedute e dai feedback dei partecipanti.",
    "Regole vincolanti dello studio:",
    ...(input.regole || []).map((r) => "- " + r),
    "Usa SOLO esercizi presenti in esercizi_ammessi, scritti con il nome identico.",
    "La somma dei minuti dei blocchi deve essere uguale alla durata del corso.",
    "Parti da intensita_suggerita: puoi scostarti di 1 punto al massimo, spiegando perché.",
    "Scrivi in italiano, tono pratico da allenatore. Rispondi solo chiamando lo strumento salva_programma."
  ].join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 2500,
      system,
      tools: [{ name: "salva_programma", description: "Salva il programma della seduta di oggi", input_schema: SCHEMA }],
      tool_choice: { type: "tool", name: "salva_programma" },
      messages: [{ role: "user", content: JSON.stringify(input) }]
    })
  });
  if (!res.ok) return Response.json({ errore: "Claude ha risposto " + res.status, dettaglio: (await res.text()).slice(0, 500) }, { status: 502 });

  const out = await res.json();
  const tool = (out.content || []).find((b) => b.type === "tool_use");
  if (!tool) return Response.json({ errore: "Nessun programma nella risposta" }, { status: 502 });
  return Response.json({ programma: tool.input, modello: out.model });
};
