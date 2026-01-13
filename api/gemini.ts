export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { subject, image, text } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `Bạn là chuyên gia môn ${subject}. Giải câu hỏi và trả về JSON:
  {
    "giai_nhanh": "Chỉ ghi đáp án cuối cùng (VD: x = 5)",
    "gia_su": "Tóm tắt lời giải ngắn gọn các bước",
    "skill": [
      {"q": "Câu trắc nghiệm tương tự 1", "o": ["A","B","C","D"], "a": "Đáp án đúng"},
      {"q": "Câu trắc nghiệm tương tự 2", "o": ["A","B","C","D"], "a": "Đáp án đúng"}
    ]
  }`;

  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt + (text ? `\nCâu hỏi: ${text}` : "") },
        ...(image ? [{ inlineData: { mimeType: "image/jpeg", data: image } }] : [])
      ]
    }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return new Response(data.candidates[0].content.parts[0].text, { headers: { 'Content-Type': 'application/json' } });
}