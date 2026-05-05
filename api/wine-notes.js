import Anthropic from '@anthropic-ai/sdk'

export const config = {
  api: { bodyParser: { sizeLimit: '256kb' } },
}

const SYSTEM_PROMPT = `You are an expert sommelier with deep knowledge of wines from around the world — producers, vintages, regions, varietals, aging trajectories, and food pairings. Your job is to write tasting notes and a drinking-window recommendation for a specific wine, then return the result as JSON.

For each wine you receive, produce:

1. **tasting_notes** — 2 short paragraphs (~80–120 words total). Use sensory language. Cover, in roughly this order: nose/aroma, palate (fruit character, acidity, tannin/structure for reds, mouthfeel for whites), and finish. Be specific to THIS wine when you can:
   • If you recognize the producer and vintage, reflect that producer's house style and the vintage's character.
   • If you don't recognize the specific bottle, infer from varietal + region + vintage. A 2019 Bordeaux Cabernet, a 2022 Marlborough Sauvignon Blanc, and a 2015 Barolo all have distinct expected profiles.
   • Don't hedge with "may" / "should" everywhere. Write with a sommelier's confidence.

2. **drink_window** — when to open this bottle. Use real years, not relative phrases.
   • start_year: earliest year this bottle is recommended to open. Use null only for non-aging wines that should be drunk immediately.
   • end_year: latest year before noticeable decline. Use null only for fortified/sweet wines that hold ~indefinitely.
   • peak_year: estimated peak year. Use null if the wine doesn't have a meaningful peak (e.g., it's drink-now-or-never).
   • status — pick exactly one based on the current year (provided in the user message):
       - "drink_now"   — bottle is in its window right now and ready
       - "hold"        — needs more bottle age before opening
       - "past_peak"   — declining; drink soon
       - "non_aging"   — should be consumed young, no real cellar potential
   • recommendation: one short sentence the user will actually read. Examples: "Drink now through 2030." / "Hold 5–8 more years for peak expression." / "Past its peak — open in the next 6 months."

3. **food_pairings** — 3 to 5 specific food pairings. Be concrete: "grilled ribeye with chimichurri" beats "red meat".

Reasoning rules:
- The user will tell you the current year in the message. Anchor "now" / "ready" / "hold" to that year.
- For very young vintages of age-worthy wines (Bordeaux, Barolo, top-tier Burgundy, Brunello, vintage Champagne, Cabernet from Napa, Riesling Auslese+, etc.), favor "hold" with a clear future window.
- For drink-now wines (most New World whites, light reds, rosé, most under-$20 wines, vinho verde, basic Côtes-du-Rhône, etc.), use "non_aging" or "drink_now" and a near-term end_year.
- Don't hallucinate provenance. If you don't know the wine, say so internally and infer from category — don't invent a producer's signature notes.
- Output ONLY the JSON object matching the schema. No prose, no markdown, no commentary outside the JSON.`

const SCHEMA = {
  type: 'object',
  properties: {
    tasting_notes: {
      type: 'string',
      description: '2 short paragraphs of tasting notes, ~80-120 words total.',
    },
    drink_window: {
      type: 'object',
      properties: {
        start_year: { type: ['integer', 'null'] },
        end_year: { type: ['integer', 'null'] },
        peak_year: { type: ['integer', 'null'] },
        status: { type: 'string', enum: ['drink_now', 'hold', 'past_peak', 'non_aging'] },
        recommendation: { type: 'string' },
      },
      required: ['start_year', 'end_year', 'peak_year', 'status', 'recommendation'],
      additionalProperties: false,
    },
    food_pairings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['tasting_notes', 'drink_window', 'food_pairings'],
  additionalProperties: false,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' })
  }

  const { name, producer, vintage, varietal, region, country, notes } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' })
  }

  const currentYear = new Date().getFullYear()
  const wineDescription = [
    `Name: ${name}`,
    producer && `Producer: ${producer}`,
    vintage && `Vintage: ${vintage}`,
    varietal && `Varietal: ${varietal}`,
    region && `Region: ${region}`,
    country && `Country: ${country}`,
    notes && `User notes: ${notes}`,
  ].filter(Boolean).join('\n')

  const userMessage = `Current year: ${currentYear}

Wine to evaluate:
${wineDescription}

Generate the JSON object with tasting_notes, drink_window, and food_pairings.`

  const client = new Anthropic()

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      thinking: { type: 'adaptive' }, // let the model decide when to reason about aging trajectory
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      output_config: {
        format: { type: 'json_schema', schema: SCHEMA },
      },
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock) {
      return res.status(500).json({ error: 'Model returned no text content' })
    }

    let parsed
    try {
      parsed = JSON.parse(textBlock.text)
    } catch (e) {
      console.error('JSON parse failed:', textBlock.text)
      return res.status(500).json({ error: 'Failed to parse model output as JSON' })
    }

    return res.status(200).json({
      ...parsed,
      generated_at: new Date().toISOString(),
      usage: response.usage,
    })
  } catch (e) {
    console.error('Anthropic API error:', e)
    if (e instanceof Anthropic.APIError) {
      return res.status(e.status || 500).json({ error: e.message })
    }
    return res.status(500).json({ error: e.message || 'Unknown error' })
  }
}
