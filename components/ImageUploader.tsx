
import React, { useState, useRef } from 'react';

interface Props {
  onUpload: (base64: string) => void;
}

// 이미지 리사이징 함수 (최대 1024px로 축소하여 API 안정성 향상)
const resizeImage = (file: File, maxSize: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 리사이징 필요 여부 확인
        const { width, height } = img;
        if (width <= maxSize && height <= maxSize) {
          // 이미 작으면 그대로 반환
          resolve(e.target?.result as string);
          return;
        }

        // 비율 유지하며 축소
        let newWidth = width;
        let newHeight = height;
        if (width > height) {
          if (width > maxSize) {
            newHeight = (height * maxSize) / width;
            newWidth = maxSize;
          }
        } else {
          if (height > maxSize) {
            newWidth = (width * maxSize) / height;
            newHeight = maxSize;
          }
        }

        // Canvas로 리사이징
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 고품질 리사이징
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // JPEG로 변환 (품질 0.9)
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        console.log(`📐 이미지 리사이징: ${width}x${height} → ${Math.round(newWidth)}x${Math.round(newHeight)}`);
        resolve(resizedBase64);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsResizing(true);
      try {
        // 이미지 리사이징 후 미리보기 설정
        const resizedBase64 = await resizeImage(file, 1024);
        setPreview(resizedBase64);
      } catch (error) {
        console.error('이미지 리사이징 실패:', error);
        // 실패 시 원본 사용
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsResizing(false);
      }
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
          onClick={() => !isResizing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group ${isResizing ? 'opacity-50 pointer-events-none' : ''}`}
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
