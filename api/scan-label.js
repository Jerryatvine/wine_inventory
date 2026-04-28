import Anthropic from '@anthropic-ai/sdk'

// Vercel runs this as a Node serverless function. Image payloads are larger
// than the default body limit, so bump it.
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

const SYSTEM_PROMPT = `You are an expert sommelier and wine-label OCR specialist.

Your job: extract structured wine information from a photo of a single wine bottle label. Read every visible word on the label, then map what you see onto the schema.

What to extract:
- name: the wine's specific name. This is usually the proprietary cuvée name (e.g. "Insignia", "Hommage", "Opus One"). If there is no proprietary name, use the appellation/region designation (e.g. "Margaux", "Châteauneuf-du-Pape"). Never put the producer here unless the producer name *is* the wine name (common for single-estate wines like "Château Margaux").
- producer: the winery, estate, château, domaine, or brand. Often appears with prefixes like "Château", "Domaine", "Tenuta", "Bodega", "Weingut".
- vintage: the 4-digit year. If no year is visible (NV — non-vintage), use null.
- varietal: the grape variety or blend (e.g. "Cabernet Sauvignon", "Pinot Noir", "Bordeaux Blend", "GSM"). For Old World wines that don't list grapes on the label, infer from the appellation when confident (e.g. Sancerre = Sauvignon Blanc, Barolo = Nebbiolo, Chablis = Chardonnay). Leave empty string if you can't infer confidently.
- region: the wine region or appellation (e.g. "Napa Valley", "Bordeaux", "Margaux", "Russian River Valley", "Mosel").
- country: the country of origin. Infer from region if not printed.
- confidence: "high" if you can read most of the label clearly and the wine is well-known. "medium" if some fields are guesses. "low" if the image is blurry, partially obscured, or hard to read.
- is_wine_label: true if this looks like a wine bottle label. false if the image is something else (a person, food, an empty room, a non-wine bottle, etc.).

Rules:
- Use empty string "" for any string field you cannot determine. Use null for vintage when there's no year.
- Don't make up information. If the label is too blurry to read a field, leave it blank — do not guess.
- Strip "Château" / "Domaine" / etc. from the name field if those words are part of the producer name; keep them with the producer.
- Output ONLY the JSON object matching the schema. No prose, no markdown, no commentary.`

const WINE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    producer: { type: 'string' },
    vintage: { type: ['integer', 'null'] },
    varietal: { type: 'string' },
    region: { type: 'string' },
    country: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    is_wine_label: { type: 'boolean' },
  },
  required: ['name', 'producer', 'vintage', 'varietal', 'region', 'country', 'confidence', 'is_wine_label'],
  additionalProperties: false,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' })
  }

  const { image, mediaType } = req.body || {}
  if (!image || !mediaType) {
    return res.status(400).json({ error: 'image (base64) and mediaType are required' })
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
    return res.status(400).json({ error: `Unsupported mediaType: ${mediaType}` })
  }

  const client = new Anthropic()

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // cache so repeat scans cost ~10% of first one
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: 'Extract this wine label as JSON matching the schema.' },
          ],
        },
      ],
      output_config: {
        format: { type: 'json_schema', schema: WINE_SCHEMA },
      },
    })

    // Find the text block — structured outputs come back as a JSON string in a text block.
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

    if (!parsed.is_wine_label) {
      return res.status(200).json({
        is_wine_label: false,
        message: "That doesn't look like a wine label. Try a clearer photo.",
      })
    }

    return res.status(200).json({
      is_wine_label: true,
      name: parsed.name,
      producer: parsed.producer,
      vintage: parsed.vintage,
      varietal: parsed.varietal,
      region: parsed.region,
      country: parsed.country,
      confidence: parsed.confidence,
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
