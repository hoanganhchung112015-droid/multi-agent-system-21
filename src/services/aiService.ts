export const solveQuestion = async (subject: string, image: string | null, text: string | null) => {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, image, text })
  });
  if (!res.ok) throw new Error("API Error");
  return await res.json();
};
