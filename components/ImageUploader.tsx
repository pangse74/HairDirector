
import React, { useState, useRef } from 'react';

interface Props {
  onUpload: (base64: string) => void;
}

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (preview) {
      onUpload(preview);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-xl mx-auto">
      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
        >
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <i className="fas fa-cloud-arrow-up text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">정면 사진 업로드</h3>
          <p className="text-slate-400 text-sm">얼굴이 잘 보이는 정면 사진이 가장 잘 나옵니다.</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group rounded-2xl overflow-hidden aspect-[3/4] max-h-[400px]">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            스타일 변환 시작하기
          </button>
        </div>
      )}
    </div>
  );
};
