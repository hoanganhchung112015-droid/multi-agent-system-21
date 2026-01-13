import React, { useState, useRef } from 'react';
import { solveQuestion } from './services/aiService';

export default function App() {
  const [mon, setMon] = useState('MENU');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref cho nút tải ảnh

  // --- LOGIC CAMERA ---
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      alert("Lỗi: Không thể truy cập Camera. Hãy cấp quyền cho trình duyệt.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const startAutoCapture = async () => {
    await openCamera();
    setTimer(10);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const canvas = document.createElement('canvas');
          if (videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            stopCamera();
            handleExecute(canvas.toDataURL('image/jpeg'), "Câu hỏi từ ảnh chụp");
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // --- LOGIC TẢI ẢNH (BỔ SUNG) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleExecute(reader.result as string, "Câu hỏi từ file tải lên");
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGIC MICRO (BỔ SUNG) ---
  const handleMicrophone = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.start();

    setLoading(true); // Hiển thị trạng thái đang nghe
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleExecute(null, transcript);
    };

    recognition.onerror = () => {
      setLoading(false);
      alert("Lỗi ghi âm hoặc bạn chưa nói gì.");
    };
  };

  // --- LOGIC THỰC HIỆN CHUNG ---
  const handleExecute = async (img: string | null, txt: string | null) => {
    setLoading(true);
    setResult(null); // Xóa kết quả cũ để load cái mới
    try {
      const data = await solveQuestion(mon, img, txt);
      setResult(data);
      // Lưu nhật ký vào LocalStorage
      const logs = JSON.parse(localStorage.getItem('edu_logs') || '[]');
      localStorage.setItem('edu_logs', JSON.stringify([{ mon, time: new Date().toLocaleString() }, ...logs]));
    } catch (err) {
      alert("Kết nối Gemini thất bại. Thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>SYMBIOTIC AI</h1>
        <p className="subtitle">MULTI AGENT SYSTEMS 16.5</p>
        <div className="tab-menu">
          {['TOÁN HỌC', 'VẬT LÍ', 'HÓA HỌC', 'NHẬT KÝ'].map(m => (
            <button key={m} onClick={() => { setMon(m); setResult(null); stopCamera(); }} className={mon === m ? 'active' : ''}>{m}</button>
          ))}
        </div>
      </header>

      <main className="main-content">
        {mon !== 'MENU' && mon !== 'NHẬT KÝ' && (
          <div className="work-zone">
            <div className="camera-box">
              <video ref={videoRef} autoPlay playsInline />
              {timer > 0 && <div className="timer-overlay">{timer}s</div>}
              {loading && <div className="loading-spinner">🌀 Đang xử lý...</div>}
            </div>

            <div className="action-grid">
              <button className="btn-opt" onClick={startAutoCapture}>📸 BẤM CHỤP ĐỂ GIẢI</button>
              
              {/* Nút Tải ảnh: Kết nối với input file ẩn */}
              <button className="btn-opt" onClick={() => fileInputRef.current?.click()}>📁 TẢI ẢNH LÊN</button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />

              {/* Nút Micro */}
              <button className="btn-opt" onClick={handleMicrophone}>🎤 BẤM GHI ÂM</button>
              
              <button className="btn-opt btn-run" onClick={() => handleExecute(null, "Phân tích câu hỏi trên màn hình")}>🚀 BẤM GIẢI BÀI</button>
            </div>
          </div>
        )}

        {/* 3 MÔ-ĐUN KẾT QUẢ */}
        {result && (
          <div className="result-area">
            <div className="res-card yellow">
              <span>⚡ Giải nhanh - 1s:</span>
              <p>{result.giai_nhanh}</p>
            </div>
            <div className="res-card dark">
              <span>🎓 Gia sư AI:</span>
              <p>{result.gia_su}</p>
            </div>
            <div className="res-card orange">
              <span>🔥 Luyện Skill:</span>
              {result.skill.map((s:any, i:number) => (
                <div key={i} className="skill-q">
                  <b>Câu {i+1}:</b> {s.q} <br/>
                  <small>Đáp án: {s.a}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {mon === 'NHẬT KÝ' && (
          <div className="diary-view">
            <h3>Nhật ký học tập</h3>
            {JSON.parse(localStorage.getItem('edu_logs') || '[]').map((l:any, i:number) => (
              <div key={i} className="diary-item">{l.time} - {l.mon}</div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="footer">
        DỰ ÁN KHKT 2025 - THIẾT KẾ BỞI NHÓM AI TRƯỜNG THPT MAI SƠN
      </footer>
    </div>
  );
}