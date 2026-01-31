import React, { useRef, useEffect, useState } from 'react';
import { FaceAnalysisResult, FaceShape } from '../types';
import { sendAnalysisReport, isValidEmail } from '../services/emailService';
import { ShareModal } from './ShareModal';

interface Props {
  analysisResult: FaceAnalysisResult;
  originalImage: string;
  resultImage?: string;  // 3x3 그리드 이미지
  onReset: () => void;
  onStyleClick?: (styleId: string, styleIndex?: number, styleName?: string, gridImage?: string) => void;
  styles?: string[];  // 추천 스타일 목록
  userEmail?: string | null;  // 결제 시 입력한 이메일
  isDemoMode?: boolean;  // 무료 체험 모드
  onPaymentClick?: () => void;  // 결제 버튼 클릭 핸들러
}

// 얼굴형 아이콘 매핑
const FACE_SHAPE_ICONS: Record<FaceShape, string> = {
  oval: 'fa-egg',
  round: 'fa-circle',
  square: 'fa-square',
  oblong: 'fa-rectangle-vertical',
  heart: 'fa-heart',
  diamond: 'fa-gem',
};

// 얼굴형별 골격 특징 상세 설명
const FACE_SHAPE_BONE_STRUCTURE: Record<FaceShape, {
  forehead: string;
  cheekbone: string;
  jaw: string;
  overall: string;
}> = {
  oval: {
    forehead: '이마가 광대뼈보다 약간 넓으며 부드러운 곡선을 그립니다.',
    cheekbone: '광대뼈가 얼굴의 가장 넓은 부분이며 적절히 돌출되어 있습니다.',
    jaw: '턱선이 부드럽게 좁아지며 둥근 턱 끝을 가지고 있습니다.',
    overall: '세로와 가로 비율이 1.5:1에 가까운 이상적인 비율입니다.'
  },
  round: {
    forehead: '이마의 너비와 턱의 너비가 비슷하며 둥근 헤어라인을 가집니다.',
    cheekbone: '광대뼈가 넓고 풍성한 볼살이 특징입니다.',
    jaw: '턱선이 둥글고 각이 거의 없으며 부드러운 인상입니다.',
    overall: '세로와 가로 비율이 1:1에 가까워 동그란 인상을 줍니다.'
  },
  square: {
    forehead: '이마가 넓고 직선적인 헤어라인을 가지고 있습니다.',
    cheekbone: '광대뼈와 턱의 너비가 비슷하여 각진 인상을 줍니다.',
    jaw: '턱선이 강하고 각져 있어 강인한 인상을 만듭니다.',
    overall: '이마, 광대, 턱의 너비가 비슷하여 균형잡힌 사각형 형태입니다.'
  },
  oblong: {
    forehead: '이마가 넓고 세로로 긴 편이며 높은 헤어라인을 가집니다.',
    cheekbone: '광대뼈가 평평하고 볼이 좁은 편입니다.',
    jaw: '턱이 좁고 길며 얼굴 전체가 세로로 길어 보입니다.',
    overall: '세로 길이가 가로 너비의 2배에 가까운 긴 형태입니다.'
  },
  heart: {
    forehead: '이마가 넓고 헤어라인이 V자 또는 하트 모양을 그립니다.',
    cheekbone: '광대뼈가 높고 도드라지며 얼굴 상부가 넓습니다.',
    jaw: '턱이 좁고 뾰족하며 얼굴 하부로 갈수록 좁아집니다.',
    overall: '이마가 가장 넓고 턱으로 갈수록 좁아지는 역삼각형 형태입니다.'
  },
  diamond: {
    forehead: '이마가 좁고 헤어라인이 좁은 편입니다.',
    cheekbone: '광대뼈가 가장 넓고 도드라져 얼굴의 중심이 됩니다.',
    jaw: '턱이 좁고 뾰족하며 강한 턱선을 가집니다.',
    overall: '광대뼈가 가장 넓고 이마와 턱이 좁은 다이아몬드 형태입니다.'
  },
};

// 얼굴형별 스타일링 팁
const FACE_SHAPE_STYLING_TIPS: Record<FaceShape, string[]> = {
  oval: [
    '대부분의 헤어스타일이 잘 어울리는 축복받은 얼굴형입니다.',
    '볼륨이나 길이에 제한 없이 다양한 시도가 가능합니다.',
    '트렌디한 스타일도 클래식한 스타일도 모두 소화 가능합니다.'
  ],
  round: [
    '정수리에 볼륨을 주어 세로 길이감을 더해주세요.',
    '옆머리는 볼륨을 줄이고 가볍게 연출하는 것이 좋습니다.',
    '이마를 살짝 드러내는 스타일이 얼굴을 갸름하게 보이게 합니다.'
  ],
  square: [
    '부드러운 레이어드나 웨이브로 각진 느낌을 완화해주세요.',
    '옆머리로 턱선을 살짝 가려주면 부드러운 인상이 됩니다.',
    '너무 짧은 스타일보다는 약간의 길이감이 있는 것이 좋습니다.'
  ],
  oblong: [
    '양옆에 볼륨을 더해 가로 폭을 넓혀주세요.',
    '앞머리를 내려 이마를 가리면 세로 길이가 줄어 보입니다.',
    '너무 긴 헤어스타일은 피하고 중간 길이가 적합합니다.'
  ],
  heart: [
    '턱 라인에 볼륨을 주는 스타일로 균형을 맞춰주세요.',
    '사이드 파팅 앞머리로 넓은 이마를 커버할 수 있습니다.',
    '턱 아래까지 오는 길이의 스타일이 균형감을 줍니다.'
  ],
  diamond: [
    '이마 쪽에 볼륨이나 앞머리로 폭을 더해주세요.',
    '광대 라인은 가볍게, 턱 라인은 볼륨있게 연출하세요.',
    '사이드 부분을 너무 타이트하게 정리하지 않는 것이 좋습니다.'
  ],
};

// 스타일 이름 → ID 매핑
const STYLE_ID_MAP: Record<string, string> = {
  "포마드컷": "pomade", "포마드": "pomade",
  "리프컷": "leaf", "댄디컷": "dandy",
  "리젠트컷": "regent", "리젠트": "regent",
  "쉐도우펌": "shadow", "아이비리그컷": "ivy", "아이비리그": "ivy",
  "애즈펌": "ez", "슬릭백": "slick",
  "투블럭컷": "twoblock", "투블럭": "twoblock",
  "가르마펌": "comma", "가르마": "comma",
  "레이어드컷": "layered", "레이어드": "layered",
  "크롭컷": "crop", "크롭": "crop",
  "텍스쳐드펌": "textured", "텍스쳐드": "textured",
  "모히칸컷": "mohican", "모히칸": "mohican",
  "언더컷": "undercut", "가일컷": "guile",
  "울프컷": "wolf", "히피펌": "hippie",
  "빌드펌": "build", "스왈로펌": "swallow",
};

// 자동 저장 완료 여부를 sessionStorage에 저장하기 위한 키 생성
const getAutoSaveKey = (resultImage: string) => {
  // resultImage의 해시를 생성하여 고유 키로 사용
  const hash = resultImage.substring(resultImage.length - 50);
  return `hairdirector_autosave_done_${hash}`;
};

export const AnalysisResultView: React.FC<Props> = ({
  analysisResult,
  originalImage,
  resultImage,
  onReset,
  onStyleClick,
  styles,
  userEmail,
  isDemoMode = false,
  onPaymentClick,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const summaryCardRef = useRef<HTMLDivElement>(null);  // 분석 요약 카드 ref

  // sessionStorage에서 자동 저장 완료 여부 확인
  const getInitialAutoSaveState = () => {
    if (!resultImage) return false;
    try {
      return sessionStorage.getItem(getAutoSaveKey(resultImage)) === 'true';
    } catch {
      return false;
    }
  };

  const [autoSaveComplete, setAutoSaveComplete] = useState(getInitialAutoSaveState);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);

  // resultImage가 변경될 때 (새 분석 시) autoSaveComplete 상태 업데이트
  useEffect(() => {
    if (resultImage) {
      try {
        const saved = sessionStorage.getItem(getAutoSaveKey(resultImage)) === 'true';
        setAutoSaveComplete(saved);
      } catch {
        setAutoSaveComplete(false);
      }
    }
  }, [resultImage]);

  // 이메일 전송 상태
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [autoEmailSent, setAutoEmailSent] = useState(false); // 자동 전송 완료 여부
  const [showShareModal, setShowShareModal] = useState(false); // 공유 모달 상태

  const {
    faceShape,
    faceShapeKo,
    skinToneKo,
    upperRatio,
    middleRatio,
    lowerRatio,
    features,
    recommendations,
    stylingTips: aiStylingTips,  // AI 맞춤형 스타일링 팁
    overallImpression,           // 전체 인상 분석
  } = analysisResult;

  const boneStructure = FACE_SHAPE_BONE_STRUCTURE[faceShape];
  // AI 맞춤형 팁이 있으면 사용, 없으면 기본 팁 사용
  const stylingTips = aiStylingTips && aiStylingTips.length > 0
    ? aiStylingTips
    : FACE_SHAPE_STYLING_TIPS[faceShape];
  const STYLES = styles && styles.length === 9 ? styles : recommendations.slice(0, 9).map(r => r.name);

  // 자동 저장 기능 (결과 이미지가 있을 때 실행) - 4단계 순차 저장
  // 데모 모드에서는 자동 저장 비활성화
  useEffect(() => {
    if (resultImage && !autoSaveComplete && !isDemoMode) {
      const autoSaveAll = async () => {
        const timestamp = new Date().toISOString().split('T')[0];

        try {
          // 1. 원본 3x3 그리드 저장 (텍스트 없음)
          const link1 = document.createElement('a');
          link1.href = resultImage;
          link1.download = `헤어디렉터_원본그리드_${timestamp}.png`;
          document.body.appendChild(link1);
          link1.click();
          document.body.removeChild(link1);
          console.log('✅ 1/4 원본 그리드 저장 완료');

          // 2. 스타일명 오버레이 그리드 저장 (html2canvas 사용)
          await new Promise(resolve => setTimeout(resolve, 500));
          if (gridRef.current) {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(gridRef.current, {
              backgroundColor: '#0a0a0f',
              scale: 2,
              useCORS: true,
            });
            const link2 = document.createElement('a');
            link2.href = canvas.toDataURL('image/png');
            link2.download = `헤어디렉터_스타일그리드_${timestamp}.png`;
            document.body.appendChild(link2);
            link2.click();
            document.body.removeChild(link2);
            console.log('✅ 2/4 스타일 그리드 저장 완료');
          }

          // 3. 분석 요약 카드 저장 (인스타그램 스타일)
          await new Promise(resolve => setTimeout(resolve, 500));
          if (summaryCardRef.current) {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(summaryCardRef.current, {
              backgroundColor: '#0a0a0f',
              scale: 2,
              useCORS: true,
            });
            const link3 = document.createElement('a');
            link3.href = canvas.toDataURL('image/png');
            link3.download = `헤어디렉터_분석카드_${timestamp}.png`;
            document.body.appendChild(link3);
            link3.click();
            document.body.removeChild(link3);
            console.log('✅ 3/4 분석 요약 카드 저장 완료');
          }

          // 4. 전체 리포트 캡처 저장
          await new Promise(resolve => setTimeout(resolve, 500));

          // 캡처 전 요약 카드 숨기기 (겹침 방지)
          let originalDisplay = '';
          if (summaryCardRef.current) {
            originalDisplay = summaryCardRef.current.style.display;
            summaryCardRef.current.style.display = 'none';
          }

          if (reportRef.current) {
            // [수정] 캡처를 위해 임시로 스타일 변경 (스크롤 제거 및 전체 높이 확장)
            // 이렇게 해야 '보이는 그대로(WYSIWYG)' 왜곡 없이 전체가 찍힘
            const originalOverflow = reportRef.current.style.overflow;
            const originalHeight = reportRef.current.style.height;

            reportRef.current.style.overflow = 'visible';
            reportRef.current.style.height = 'auto';

            try {
              const html2canvas = (await import('html2canvas')).default;
              const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#0a0a0f',
                scale: 2,
                useCORS: true,
                // height, windowHeight 옵션 제거 -> auto 스타일이 적용되었으므로 자동 감지됨
              });
              const link4 = document.createElement('a');
              link4.href = canvas.toDataURL('image/png');
              link4.download = `헤어디렉터_분석리포트_${timestamp}.png`;
              document.body.appendChild(link4);
              link4.click();
              document.body.removeChild(link4);
              console.log('✅ 4/4 전체 리포트 저장 완료');
            } catch (err) {
              console.error('리포트 캡처 실패:', err);
            } finally {
              // 스타일 복구 (반드시 실행)
              reportRef.current.style.overflow = originalOverflow;
              reportRef.current.style.height = originalHeight;
            }
          }

          // 캡처 후 요약 카드 복구
          if (summaryCardRef.current) {
            summaryCardRef.current.style.display = originalDisplay;
          }

          setAutoSaveComplete(true);
          // sessionStorage에 자동 저장 완료 상태 저장 (탭 전환 시에도 유지)
          try {
            sessionStorage.setItem(getAutoSaveKey(resultImage), 'true');
          } catch (e) {
            console.warn('sessionStorage 저장 실패:', e);
          }
          console.log('🎉 자동 저장 완료 (총 4개 파일)');
        } catch (error) {
          console.error('자동 저장 실패:', error);
        }
      };

      // 1초 후 자동 저장 시작 (렌더링 완료 대기)
      const timer = setTimeout(autoSaveAll, 1000);
      return () => clearTimeout(timer);
    }
  }, [resultImage, autoSaveComplete, isDemoMode]);

  // 결제 시 입력한 이메일이 있으면 자동으로 리포트 전송
  // 데모 모드에서는 이메일 전송 비활성화
  useEffect(() => {
    if (userEmail && resultImage && !autoEmailSent && !emailSent && !isDemoMode) {
      const autoSendEmail = async () => {
        console.log('📧 결제 이메일로 자동 리포트 전송 시작:', userEmail);
        setEmailSending(true);

        try {
          const response = await sendAnalysisReport(
            userEmail,
            analysisResult,
            resultImage
          );

          if (response.success) {
            setEmailSent(true);
            console.log('✅ 이메일 자동 전송 완료');
          } else {
            console.error('❌ 이메일 전송 실패:', response.error);
            setEmailError(response.error || '이메일 전송에 실패했습니다.');
          }
        } catch (error) {
          console.error('❌ 이메일 전송 오류:', error);
        } finally {
          setEmailSending(false);
          setAutoEmailSent(true);
        }
      };

      // 자동 저장 완료 후 이메일 전송 (2초 후)
      const timer = setTimeout(autoSendEmail, 2000);
      return () => clearTimeout(timer);
    }
  }, [userEmail, resultImage, autoEmailSent, emailSent, analysisResult, isDemoMode]);

  // 수동 다운로드 핸들러 (전체 리포트 캡처)
  const handleDownload = async () => {
    if (!reportRef.current) return;
    const timestamp = new Date().toISOString().split('T')[0];

    // 버튼 숨기기 (캡처 전)
    // 하단 버튼 영역을 잠시 숨김 처리하려면 해당 부모 요소를 찾아야 함.
    // 여기서는 간단히 전체 리포트 영역을 캡처하므로 버튼도 포함됨.
    // 만약 버튼을 제외하고 싶다면 별도 처리가 필요하지만, 사용자는 "전체 페이지"를 원했으므로 포함하거나,
    // 필요 시 filter 옵션으로 제외 가능. 일단 사용자 요청("전체 리포트 페이지 전체")에 따라 그대로 둠.

    try {
      const { toPng } = await import('html-to-image');

      // [수정] 캡처를 위해 임시로 스타일 변경 (스크롤 제거 및 전체 높이 확장)
      const originalOverflow = reportRef.current.style.overflow;
      const originalHeight = reportRef.current.style.height;

      // 전체 내용을 다 보여주도록 변경
      reportRef.current.style.overflow = 'visible';
      reportRef.current.style.height = 'auto';

      const dataUrl = await toPng(reportRef.current, {
        quality: 1.0,
        pixelRatio: 2, // 너무 크면 모바일에서 터질 수 있으므로 2배율 정도 권장 (PC에서는 충분히 큼)
        cacheBust: true,
        style: {
          fontSmooth: 'antialiased',
          '-webkit-font-smoothing': 'antialiased',
        }
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `헤어디렉터_분석리포트_전체_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 스타일 복구
      reportRef.current.style.overflow = originalOverflow;
      reportRef.current.style.height = originalHeight;

    } catch (error) {
      console.error('Download failed:', error);
      alert('이미지 저장에 실패했습니다.');
    }
  };

  const handleCopyReport = async () => {
    const reportText = `[헤어디렉터 AI 분석 리포트]
--------------------------------
👤 얼굴형: ${faceShapeKo} (${skinToneKo})
📏 비율: 상 ${upperRatio}% : 중 ${middleRatio}% : 하 ${lowerRatio}%

✨ 추천 스타일 BEST 5:
${STYLES.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n')}

💡 맞춤 팁:
${stylingTips.slice(0, 3).map(t => `- ${t}`).join('\n')}

--------------------------------
나에게 딱 맞는 인생 헤어스타일 찾기
👉 https://hairdirector.site`;

    try {
      await navigator.clipboard.writeText(reportText);
      alert('리포트 내용이 복사되었습니다!\n메시지나 SNS에 붙여넣기 해보세요.');
    } catch (err) {
      console.error('Failed to copy report:', err);
      alert('복사에 실패했습니다.');
    }
  };

  // 공유하기 핸들러 - 모달 열기
  const handleShare = () => {
    setShowShareModal(true);
  };

  // 공유 데이터
  const shareData = {
    title: '헤어디렉터 AI 얼굴형 분석 리포트',
    text: `내 얼굴형 분석 결과: ${faceShapeKo} (${skinToneKo})\n\n추천 스타일 TOP 5:\n${STYLES.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n나에게 딱 맞는 인생 헤어스타일 찾기`,
    url: 'https://hairdirector.site',
  };

  // 이메일 전송 핸들러
  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
      setEmailError('이메일 주소를 입력해주세요.');
      return;
    }

    if (!isValidEmail(emailInput.trim())) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setEmailSending(true);
    setEmailError(null);

    try {
      const response = await sendAnalysisReport(
        emailInput.trim(),
        analysisResult,
        resultImage
      );

      if (response.success) {
        setEmailSent(true);
        setEmailInput('');
      } else {
        setEmailError(response.error || '이메일 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Email send failed:', error);
      setEmailError('이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* 데모 모드 상단 배너 */}
      {isDemoMode && (
        <div className="sticky top-0 z-10 w-full px-4 py-3 bg-yellow-500/20 border-b border-yellow-500/30">
          <div className="flex items-center justify-center gap-2">
            <i className="fas fa-flask text-yellow-400"></i>
            <span className="text-yellow-300 text-sm font-bold">
              무료 체험 버전 - 실제 분석 결과가 아닙니다
            </span>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <span className="text-white font-bold">
          {isDemoMode ? '무료 체험 리포트' : 'AI 얼굴형 분석 리포트'}
        </span>
        <div className="w-8"></div>
      </header>

      <div ref={reportRef} className="flex-1 w-full overflow-y-auto bg-[#0a0a0f]">
        {/* 분석 결과 헤더 */}
        <div className="px-5 py-6 bg-gradient-to-b from-cyan-500/10 to-transparent">
          <div className="flex items-center gap-4">
            {/* 사진 */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-lg flex-shrink-0">
              <img
                src={originalImage}
                alt="분석 사진"
                className="w-full h-full object-cover"
              />
            </div>
            {/* 얼굴형 정보 */}
            <div className="flex-1">
              <div className="text-gray-400 text-sm mb-1">분석된 얼굴형</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <i className={`fas ${FACE_SHAPE_ICONS[faceShape]} text-white text-xl`}></i>
                </div>
                <div>
                  <span className="text-white font-bold text-2xl">{faceShapeKo}</span>
                  <div className="text-cyan-400 text-sm">{skinToneKo}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-6">
          {/* 전체 인상 분석 (AI 맞춤형) */}
          {overallImpression && (
            <section>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <i className="fas fa-user-circle text-cyan-400"></i>
                전체 인상 분석
              </h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <p className="text-gray-200 text-sm leading-relaxed">{overallImpression}</p>
              </div>
            </section>
          )}

          {/* 얼굴 비율 분석 */}
          <section>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-ruler-combined text-cyan-400"></i>
              얼굴 비율 분석
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <RatioCard
                label="상안부"
                subLabel="이마~눈썹"
                value={upperRatio}
                ideal={33}
                color="violet"
              />
              <RatioCard
                label="중안부"
                subLabel="눈썹~코끝"
                value={middleRatio}
                ideal={33}
                color="cyan"
              />
              <RatioCard
                label="하안부"
                subLabel="코끝~턱"
                value={lowerRatio}
                ideal={33}
                color="pink"
              />
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              * 이상적 비율: 각 영역 33% (1:1:1)
            </p>
          </section>

          {/* 골격 특징 상세 분석 */}
          <section>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-bone text-cyan-400"></i>
              골격 특징 상세 분석
            </h3>
            <div className="space-y-3">
              <BoneFeatureCard
                icon="fa-head-side"
                title="이마 (Forehead)"
                description={boneStructure.forehead}
              />
              <BoneFeatureCard
                icon="fa-face-smile"
                title="광대뼈 (Cheekbone)"
                description={boneStructure.cheekbone}
              />
              <BoneFeatureCard
                icon="fa-teeth"
                title="턱선 (Jawline)"
                description={boneStructure.jaw}
              />
              <BoneFeatureCard
                icon="fa-expand"
                title="전체 비율 (Overall)"
                description={boneStructure.overall}
                highlight
              />
            </div>
          </section>

          {/* 얼굴 특징 태그 */}
          <section>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-tags text-cyan-400"></i>
              감지된 특징
            </h3>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <FeatureTag key={index} feature={feature} />
              ))}
            </div>
          </section>

          {/* AI 맞춤형 스타일링 팁 */}
          <section>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-magic text-yellow-400"></i>
              AI 맞춤 스타일링 팁
              {aiStylingTips && aiStylingTips.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded-full">PERSONALIZED</span>
              )}
            </h3>
            <div className="space-y-2">
              {stylingTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <span className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-400 text-xs font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-300 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 추천 스타일 미리보기 */}
          <section>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-scissors text-violet-400"></i>
              AI 추천 스타일 ({STYLES.length}개)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((styleName, index) => {
                const rec = recommendations.find(r => r.name === styleName);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedStyle(index);
                      onStyleClick?.(STYLE_ID_MAP[styleName] || 'default', index, styleName, resultImage);
                    }}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 min-h-[100px] ${selectedStyle === index
                      ? 'bg-violet-600/30 border-violet-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                  >
                    <span className="text-violet-400 font-bold text-lg leading-none">{index + 1}</span>
                    <span className="text-gray-300 text-xs font-medium mt-0.5 break-keep text-center leading-snug">
                      {styleName}
                    </span>
                    {rec && <span className="text-cyan-400 text-[10px] leading-none">{rec.score}점</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3x3 그리드 시뮬레이션 결과 */}
          {resultImage && (
            <section>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <i className="fas fa-images text-violet-400"></i>
                AI 헤어스타일 시뮬레이션
              </h3>
              <div ref={gridRef} className="relative rounded-3xl overflow-hidden border-2 border-violet-500/30 shadow-2xl shadow-violet-500/20">
                <img
                  src={resultImage}
                  alt="AI 추천 헤어스타일 3x3 그리드"
                  className="w-full h-auto block"
                />
                {/* 3x3 텍스트 오버레이 그리드 */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {STYLES.map((style, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedStyle(index);
                        onStyleClick?.(STYLE_ID_MAP[style] || 'default', index, style, resultImage);
                      }}
                      className="relative flex items-end justify-center hover:bg-white/10 transition-all"
                    >
                      {/* 하단 그라데이션 레이어 */}
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                      {/* 텍스트 (박스 없음) */}
                      <span
                        className="mb-2 text-sm font-bold text-white tracking-wide"
                        style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,1)'
                        }}
                      >
                        {index + 1}. {style}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 자동 저장 완료 알림 - 데모 모드에서는 숨김 */}
              {autoSaveComplete && !isDemoMode && (
                <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-400"></i>
                  <span className="text-green-300 text-sm">4개 이미지 자동 저장 완료!</span>
                </div>
              )}
            </section>
          )}

          {/* 인스타그램 스타일 분석 요약 카드 (캡처용) */}
          {resultImage && (
            <div
              ref={summaryCardRef}
              className="w-full max-w-sm mx-auto p-6 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <i className="fas fa-robot text-white text-sm"></i>
                  </div>
                  <span className="text-white font-bold">헤어디렉터 AI</span>
                </div>
                <span className="text-gray-500 text-xs">AI 얼굴 분석 리포트</span>
              </div>

              {/* 프로필 섹션 */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
                  <img src={originalImage} alt="프로필" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <i className={`fas ${FACE_SHAPE_ICONS[faceShape]} text-white`}></i>
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">{faceShapeKo}</div>
                      <div className="text-cyan-400 text-sm">{skinToneKo}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 비율 바 */}
              <div className="mb-5 p-3 rounded-xl bg-white/5">
                <div className="text-gray-400 text-xs mb-2">얼굴 비율</div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  <div className="bg-violet-500" style={{ width: `${upperRatio}%` }}></div>
                  <div className="bg-cyan-500" style={{ width: `${middleRatio}%` }}></div>
                  <div className="bg-pink-500" style={{ width: `${lowerRatio}%` }}></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                  <span>상안부 {upperRatio}%</span>
                  <span>중안부 {middleRatio}%</span>
                  <span>하안부 {lowerRatio}%</span>
                </div>
              </div>

              {/* 특징 태그 */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {features.slice(0, 4).map((f, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium ${f.impact === 'positive' ? 'bg-green-500/20 text-green-400' :
                      f.impact === 'consideration' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}
                  >
                    {f.nameKo}
                  </span>
                ))}
              </div>

              {/* AI 맞춤 스타일링 팁 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-magic text-yellow-400 text-sm"></i>
                  <span className="text-white font-bold text-sm">AI 맞춤 스타일링 팁</span>
                </div>
                {stylingTips.slice(0, 3).map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/5">
                    <span className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-400 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <p className="text-gray-300 text-xs leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>

              {/* 푸터 */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-gray-500 text-[10px]">Powered by Gemini AI</span>
                <span className="text-violet-400 text-[10px] font-bold">Hair Director</span>
              </div>
            </div>
          )}

          {/* 데모 모드 CTA 섹션 */}
          {isDemoMode && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30">
              <h3 className="text-white font-bold text-lg mb-2 text-center">
                나만의 맞춤 분석받기
              </h3>
              <p className="text-gray-400 text-sm text-center mb-4">
                실제 AI 분석으로 나에게 딱 맞는 헤어스타일을 찾아보세요
              </p>
              <button
                onClick={onPaymentClick}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-violet-500/30"
              >
                <i className="fas fa-magic"></i>
                나만의 맞춤 분석받기
              </button>
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="pt-4 space-y-3">
            {/* [추가] 텍스트 복사 버튼 - 데모 모드에서는 숨김 */}
            {!isDemoMode && (
              <button
                onClick={handleCopyReport}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all border border-white/10"
              >
                <i className="fas fa-copy"></i>
                리포트 텍스트 복사 (공유용)
              </button>
            )}

            {resultImage && !isDemoMode && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShare}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <i className="fas fa-share-alt"></i>
                  공유하기
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-violet-500/30"
                >
                  <i className="fas fa-download"></i>
                  다운로드
                </button>
              </div>
            )}
            <button
              onClick={onReset}
              className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <i className="fas fa-camera"></i>
              새로운 사진으로 다시하기
            </button>

            {/* 팁 카드 - 데모 모드에서는 숨김 */}
            {resultImage && !isDemoMode && (
              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-lightbulb text-violet-400"></i>
                  </div>
                  <div>
                    <h4 className="text-violet-300 font-bold text-sm mb-1">Tip</h4>
                    <p className="text-violet-200/70 text-xs leading-relaxed">
                      미용실에서 원하는 스타일 번호를 디자이너에게 보여주세요. 더 정확한 시술이 가능합니다!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공유 모달 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={shareData.title}
        text={shareData.text}
        url={shareData.url}
        imageUrl={originalImage}
      />
    </div>
  );
};

// 비율 카드 컴포넌트
const RatioCard: React.FC<{
  label: string;
  subLabel: string;
  value: number;
  ideal: number;
  color: 'violet' | 'cyan' | 'pink';
}> = ({ label, subLabel, value, ideal, color }) => {
  const diff = value - ideal;
  const diffText = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '이상적';
  const colorMap = {
    violet: 'from-violet-500 to-purple-500 border-violet-500/30',
    cyan: 'from-cyan-500 to-blue-500 border-cyan-500/30',
    pink: 'from-pink-500 to-rose-500 border-pink-500/30',
  };

  return (
    <div className={`p-4 rounded-2xl bg-white/5 border ${colorMap[color].split(' ')[2]} text-center`}>
      <div className={`text-3xl font-black bg-gradient-to-r ${colorMap[color].split(' ').slice(0, 2).join(' ')} bg-clip-text text-transparent`}>
        {value}%
      </div>
      <div className="text-white font-bold text-sm mt-1">{label}</div>
      <div className="text-gray-500 text-xs">{subLabel}</div>
      <div className={`text-xs mt-2 ${Math.abs(diff) <= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
        {diffText}
      </div>
    </div>
  );
};

// 골격 특징 카드 컴포넌트
const BoneFeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  highlight?: boolean;
}> = ({ icon, title, description, highlight }) => (
  <div className={`p-4 rounded-xl ${highlight ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-white/5 border border-white/10'}`}>
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl ${highlight ? 'bg-cyan-500/20' : 'bg-white/10'} flex items-center justify-center flex-shrink-0`}>
        <i className={`fas ${icon} ${highlight ? 'text-cyan-400' : 'text-gray-400'}`}></i>
      </div>
      <div>
        <h4 className={`font-bold text-sm mb-1 ${highlight ? 'text-cyan-300' : 'text-white'}`}>{title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// 특징 태그 컴포넌트
const FeatureTag: React.FC<{ feature: { nameKo: string; impact: string } }> = ({ feature }) => {
  const colorMap = {
    positive: 'bg-green-500/20 border-green-500/30 text-green-400',
    neutral: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
    consideration: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  };
  const iconMap = {
    positive: 'fa-check',
    neutral: 'fa-minus',
    consideration: 'fa-lightbulb',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${colorMap[feature.impact as keyof typeof colorMap] || colorMap.neutral
        }`}
    >
      <i className={`fas ${iconMap[feature.impact as keyof typeof iconMap] || iconMap.neutral} text-xs`}></i>
      {feature.nameKo}
    </span>
  );
};
