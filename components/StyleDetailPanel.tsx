import React, { useState, useRef, useEffect } from 'react';
import { HairstyleDetail } from '../services/hairstyleData';

interface StyleDetailPanelProps {
    style: HairstyleDetail;
    onClose: () => void;
    resultImage?: string;      // 3x3 그리드 이미지
    styleIndex?: number;       // 0-8 스타일 인덱스
    styleName?: string;        // 실제 스타일 이름
    onSave?: (imageData: string, styleName: string) => void;  // 저장 콜백
}

export const StyleDetailPanel: React.FC<StyleDetailPanelProps> = ({
    style,
    onClose,
    resultImage,
    styleIndex,
    styleName,
    onSave
}) => {
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 3x3 그리드에서 특정 셀 이미지 추출
    useEffect(() => {
        if (resultImage && styleIndex !== undefined && styleIndex >= 0 && styleIndex < 9) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // 각 셀의 크기 계산 (3x3 그리드)
                const cellWidth = img.width / 3;
                const cellHeight = img.height / 3;

                // 인덱스로부터 행과 열 계산
                const row = Math.floor(styleIndex / 3);
                const col = styleIndex % 3;

                // 캔버스 크기 설정
                canvas.width = cellWidth;
                canvas.height = cellHeight;

                // 해당 셀만 추출
                ctx.drawImage(
                    img,
                    col * cellWidth, row * cellHeight, cellWidth, cellHeight,
                    0, 0, cellWidth, cellHeight
                );

                setCroppedImage(canvas.toDataURL('image/png'));
            };
            img.src = resultImage;
        }
    }, [resultImage, styleIndex]);

    // 저장 핸들러
    const handleSave = () => {
        if (croppedImage && onSave) {
            onSave(croppedImage, styleName || style.name);
            setSaved(true);
        }
    };

    // 이미지 다운로드 핸들러
    const handleDownload = () => {
        if (croppedImage) {
            const link = document.createElement('a');
            link.href = croppedImage;
            link.download = `헤어디렉터_${styleName || style.name}_${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-start">
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* 패널 컨테이너 */}
            <div className="relative w-[90vw] max-w-md h-full bg-[#1a1a24] border-r border-white/10 flex flex-col shadow-2xl"
                style={{ animation: 'slideInLeft 0.3s ease-out forwards' }}
            >
                <style>{`
                    @keyframes slideInLeft {
                        from { transform: translateX(-100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}</style>

                {/* 헤더 */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {styleIndex !== undefined && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {styleIndex + 1}
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-white">{styleName || style.name}</h2>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {style.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {/* 스크롤 영역 */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* 시뮬레이션 이미지 */}
                    {croppedImage && (
                        <div className="p-4">
                            <div className="relative rounded-2xl overflow-hidden border-2 border-violet-500/30 shadow-lg shadow-violet-500/20">
                                <img
                                    src={croppedImage}
                                    alt={styleName || style.name}
                                    className="w-full h-auto"
                                />
                                {/* 스타일 라벨 */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-white font-bold text-sm">
                                        {styleName || style.name} 시뮬레이션
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="px-4 pb-4 space-y-5">
                        {/* 디렉터 코멘트 */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fas fa-quote-left text-violet-500"></i>
                                <h3 className="text-sm font-bold text-gray-200">Director's Pick</h3>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                                {style.description}
                            </p>
                        </section>

                        {/* 추천 얼굴형 */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fas fa-smile text-yellow-500"></i>
                                <h3 className="text-sm font-bold text-gray-200">이런 분께 추천</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed pl-3 border-l-2 border-yellow-500/50">
                                {style.faceShape}
                            </p>
                        </section>

                        {/* 손질 팁 */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fas fa-wand-magic-sparkles text-pink-500"></i>
                                <h3 className="text-sm font-bold text-gray-200">손질 꿀팁</h3>
                            </div>
                            <div className="bg-pink-500/5 p-3 rounded-xl border border-pink-500/10">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {style.stylingTip}
                                </p>
                            </div>
                        </section>

                        {/* 시술 정보 */}
                        <section>
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fas fa-info-circle text-blue-400"></i>
                                <h3 className="text-sm font-bold text-gray-200">시술 정보</h3>
                            </div>
                            <p className="text-blue-300 text-sm font-medium bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 inline-block">
                                {style.info}
                            </p>
                        </section>

                        {/* 미용실 팁 */}
                        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <div className="flex items-start gap-2">
                                <i className="fas fa-lightbulb text-violet-400 mt-0.5"></i>
                                <p className="text-violet-200/80 text-xs leading-relaxed">
                                    이 이미지를 미용실 디자이너에게 보여주시면 더 정확한 시술이 가능합니다!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    {croppedImage && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleDownload}
                                className="py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-download"></i>
                                다운로드
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saved}
                                className={`py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                                    saved
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                                }`}
                            >
                                <i className={`fas ${saved ? 'fa-check' : 'fa-bookmark'}`}></i>
                                {saved ? '저장됨' : '저장하기'}
                            </button>
                        </div>
                    )}
                    <button
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        onClick={onClose}
                    >
                        <span>확인</span>
                        <i className="fas fa-check"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};
