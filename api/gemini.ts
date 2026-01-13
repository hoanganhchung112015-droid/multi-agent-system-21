import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subject, image, text } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Bạn là chuyên gia môn ${subject}. Giải câu hỏi và trả về JSON thuần túy:
    {
      "giai_nhanh": "Đáp án cuối",
      "gia_su": "Tóm tắt giải",
      "skill": [{"q": "Câu hỏi tương tự 1", "o": ["A","B","C","D"], "a": "Đáp án"}, {"q": "Câu hỏi tương tự 2", "o": ["A","B","C","D"], "a": "Đáp án"}]
    }`;

    const prompt = systemPrompt + (text ? `\nCâu hỏi: ${text}` : "");
    
    let result;
    if (image) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    let responseText = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi xử lý AI" });
  }
}
