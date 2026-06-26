import { NextResponse } from "next/server";

// Force refresh: v2
export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        // Get Key from Header (Client) OR Env (Server)
        const apiKey = req.headers.get("x-api-key") || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key missing. Please set it in settings." }, { status: 401 });
        }

        const systemPrompt = `
            You are an expert Safety Consultant AI. 
            I will provide you with raw text copied from a Word Table containing a safety checklist.
            
            The structure is typically:
            [Question/Description Column] [Reference Column] [Result Columns: U, UD, NA] [Explanation Column]

            Your task is to extracting the meaningful "Question" or "Requirement" text and the "Category".

            Rules:
            1. **Category Detection**: If you see lines like "17) Teknik dokümantasyon" or "18) Doğrulama", use these as the CATEGORY for subsequent items.
            2. **Question Extraction**: The main text usually describes a safety requirement (e.g., "Bir makinanın elektrik donanımının tesisi..."). Use this full text as the "question".
            3. **Ignore Noise**: Ignore columns like "Ref.", "U", "UD", "NA", "AÇIKLAMA", "17.1", "18.2" if they appear as isolated text.
            4. **Sub-items**: If there act parts like "a)...", "b)...", treat them as separate checklist items or combine them meaningfully.

            Output JSON Array:
            [{
                "category": "String (The current section header, e.g., '17) Teknik dokümantasyon')",
                "question": "String (The requirement text)"
            }]

            Ensure the output is ONLY valid JSON. Clean up newline characters within the question text.
        `;

        const userPrompt = `RAW TEXT:\n${text}`;

        // List of models to try in order
        const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
        let data = null;
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
                        }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (res.status === 404) {
                    console.log(`Model ${model} not found, trying next...`);
                    continue;
                }

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(`Gemini Error (${model}): ${res.status} - ${JSON.stringify(errData)}`);
                }

                data = await res.json();
                break; // Success!

            } catch (e) {
                lastError = e;
                console.error(`Attempt failed for ${model}:`, e);
            }
        }

        if (!data) {
            throw lastError || new Error("All models failed.");
        }

        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        // Clean up markdown just in case, though responseMimeType should handle it
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        const checklistItems = JSON.parse(rawText);

        return NextResponse.json({ items: checklistItems });

    } catch (error: any) {
        console.error("AI Parse Error:", error);
        return NextResponse.json({ error: error.message || "Failed to parse checklist" }, { status: 500 });
    }
}
