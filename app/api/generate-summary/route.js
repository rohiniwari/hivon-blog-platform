import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { title, body } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.warn('GOOGLE_AI_API_KEY not set — skipping summary generation')
      return NextResponse.json({ summary: '' })
    }

    // Cost optimisation: truncate body to 3000 chars to minimise input tokens.
    // The summary is generated ONCE on creation and stored; never called again.
    const truncatedBody = body.slice(0, 3000)

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text:
                `You are a helpful assistant. Generate a concise, engaging summary of approximately 200 words for the following blog post. ` +
                `Write only the summary text — no labels, no markdown, no extra formatting.\n\n` +
                `Title: ${title}\n\nContent:\n${truncatedBody}`,
            }],
          }],
          generationConfig: {
            maxOutputTokens: 300,   // ~200 words + buffer
            temperature:     0.5,   // balanced creativity
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error:', errText)
      return NextResponse.json({ summary: '' })
    }

    const geminiData = await geminiResponse.json()
    const summary    = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('Summary generation error:', err)
    // Return empty summary rather than failing the whole post creation
    return NextResponse.json({ summary: '' })
  }
}
