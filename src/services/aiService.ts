export const solveQuestion = async (subject: string, image: string | null, text: string | null) => {
  let compressed = null;
  if (image) {
    compressed = await new Promise<string>((resolve) => {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 800 / img.width;
        canvas.width = 800; canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, 800, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
      };
    });
  }
  const res = await fetch('/api/gemini', {
    method: 'POST',
    body: JSON.stringify({ subject, image: compressed, text })
  });
  return await res.json();
};