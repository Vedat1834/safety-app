import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headers = request.headers;
        const apiKey = headers.get('x-api-key');
        const provider = headers.get('x-provider') || 'openai';

        const { hazard_zone, hazard_type, hazard_description, test_mode, custom_instruction, knowledge_context } = body;

        // --- TEST MODE ---
        if (test_mode) {
            if (!apiKey) return NextResponse.json({ error: 'API Key eksik' }, { status: 400 });

            // Simple verification call based on provider
            try {
                if (provider === 'openai') {
                    const verify = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    });
                    if (!verify.ok) throw new Error('OpenAI Key Geçersiz');
                } else if (provider === 'gemini') {
                    // Gemini usually requires key in query param for discovery, simple check not always std, 
                    // but we can try a generateContent call with empty prompt or check models
                    const verify = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                    if (!verify.ok) throw new Error('Gemini Key Geçersiz');
                }
                return NextResponse.json({ success: true });
            } catch (e: any) {
                return NextResponse.json({ error: e.message }, { status: 401 });
            }
        }

        // --- GENERATION MODE ---

        // If no API key provided, return MOCK data (fallback)
        if (!apiKey) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json(generateMockData(hazard_type));
        }

        // Real API Call
        try {
            let result;

            // Prompt Construction
            let systemPrompt = `Sen bir Makine Emniyeti Uzmanısın (ISO 12100). Verilen tehlike için risk azaltıcı önlemleri JSON formatında öner.
            Çıktı Formatı: { "design": "...", "engineering": "...", "administrative": "...", "references": "..." }
            Dil: Türkçe. Kısa, teknik ve net ol.
            "references" alanına sadece kullandığın standart numaralarını veya doküman isimlerini virgülle ayırarak yaz. Eğer genel bilgi kullandıysan "Genel Makine Emniyeti Bilgisi" yaz.`;

            if (knowledge_context) {
                systemPrompt += `\n\nÖNEMLİ: Aşağıdaki REFERANS DOKÜMANLARI (Knowledge Base) kullanarak cevap ver. Cevabını bu dokümanlara dayandır.
                \n--- REFERANS DOKÜMANLAR ---\n${knowledge_context}\n--- DOKÜMAN SONU ---\n`;
            }

            if (custom_instruction) {
                systemPrompt += `\n\nÖZEL SİSTEM TALİMATI (Bunu dikkate al): ${custom_instruction}`;
            }

            const userPrompt = `Tehlike Bölgesi: ${hazard_zone}
            Tehlike Tipi: ${hazard_type}
            Açıklama: ${hazard_description}
            
            Lütfen ISO standartlarına uygun önlemleri yaz.`;

            if (provider === 'openai') {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o", // or gpt-3.5-turbo
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) throw new Error(`OpenAI Error: ${response.statusText}`);
                const data = await response.json();
                let rawText = data.choices[0].message.content;
                rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                result = JSON.parse(rawText);

            } else if (provider === 'gemini') {
                const cleanKey = apiKey.trim();
                const tryGemini = async (model: string) => {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
                            }],
                            // Only use JSON mode for newer models
                            generationConfig: model.includes('1.5') ? { responseMimeType: "application/json" } : undefined
                        })
                    });
                    if (res.status === 404) return null; // Model not found, try next
                    if (!res.ok) throw new Error(`${model} Error: ${res.status} ${res.statusText}`);
                    return res;
                };

                // Try newer models first (verified available for this user)
                let response = await tryGemini('gemini-2.0-flash');
                if (!response) response = await tryGemini('gemini-1.5-flash');
                if (!response) response = await tryGemini('gemini-pro-latest');
                if (!response) response = await tryGemini('gemini-pro');

                if (!response) throw new Error("Hiçbir Gemini modeli bulunamadı (404).");

                const data = await response.json();
                let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

                // If the model didn't return pure JSON (older models), try to extract or just parse
                try {
                    result = JSON.parse(rawText);
                } catch (e) {
                    // Fallback if AI didn't return valid JSON
                    result = {
                        design: rawText,
                        engineering: "Detaylar yukarıdaki metindedir.",
                        administrative: "AI yanıtı ham metin olarak alındı."
                    };
                }
            }

            return NextResponse.json(result);

        } catch (error: any) {
            console.error("AI API Error:", error);
            // Fallback to mock on error to maintain UX? Or return error?
            // Let's return error so user knows key failed
            return NextResponse.json({ error: `AI Generation Failed: ${error.message || error}` }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

function generateMockData(type: string) {
    let suggestions = {
        design: "Tasarım aşamasında tehlikeli bölgeye erişim engellenmelidir.",
        engineering: "Uygun muhafaza ve güvenlik switchleri kullanılmalıdır.",
        administrative: "Operatör eğitimi verilmeli ve uyarı işaretleri konulmalıdır."
    };

    if (type === 'Mekanik') {
        suggestions.design = "Hareketli parçaların sıkışma noktaları izole edilmeli.";
        suggestions.engineering = "Sabit koruyucular veya ışık perdeleri entegre edilmeli.";
    } else if (type === 'Elektriksel') {
        suggestions.design = "Panolar IP65 sınıfı seçilmeli.";
        suggestions.engineering = "Kaçak akım rölesi ve topraklama kontrolü sağlanmalı.";
    }

    return suggestions;
}
