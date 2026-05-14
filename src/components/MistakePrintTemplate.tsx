import React from 'react';
import { Mistake } from '../types';
import { formatDate } from '../lib/utils';

interface Props {
  mistakes: Mistake[];
}

const MistakePrintTemplate = React.forwardRef<HTMLDivElement, Props>(({ mistakes }, ref) => {
  return (
    <div ref={ref} className="p-12 text-black bg-white">
      {/* Print Header */}
      <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">错题巩固练习</h1>
          <p className="text-sm opacity-60">生成的共 {mistakes.length} 组错题记录</p>
        </div>
        <div className="text-right text-sm">
          <p>姓名：________________</p>
          <p className="mt-1">时间：{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Mistakes List */}
      <div className="space-y-12">
        {mistakes.map((mistake, index) => (
          <div key={mistake.id} className="break-inside-avoid">
            {/* Original Question */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-black text-white px-2 py-0.5 text-xs font-bold rounded">原题 {index + 1}</span>
                <span className="text-xs font-bold border border-black px-2 py-0.5 rounded italic">
                  知识点：{mistake.knowledgePoint}
                </span>
                <span className="text-[10px] opacity-40 ml-auto">
                  录入时间：{formatDate(mistake.createdAt?.toDate?.() || new Date())}
                </span>
              </div>
              <div className="text-base leading-relaxed pl-2 border-l-2 border-gray-100">
                {mistake.originalImageUrl && (
                  <img src={mistake.originalImageUrl} alt="Mistake" className="max-h-64 mb-4 block" />
                )}
                <p className="whitespace-pre-wrap">{mistake.originalText}</p>
              </div>
            </div>

            {/* Analogous Questions */}
            <div className="space-y-8 pl-6">
              {mistake.analogousQuestions.map((q, qIndex) => (
                <div key={qIndex} className="break-inside-avoid">
                  <div className="flex gap-2 items-start mb-2">
                    <span className="text-sm font-bold min-w-[50px] mt-0.5">【练习 {qIndex + 1}】</span>
                    <p className="text-base leading-relaxed flex-1">{q.question}</p>
                  </div>
                  {/* Space for answer in practice mode? 
                      The user requested "PDF 排版清晰... 答案与解析紧随其后". 
                      So we show it right after. 
                  */}
                  <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-sm"><span className="font-bold">答案：</span>{q.answer}</p>
                    <p className="text-sm mt-1">
                      <span className="font-bold">易错点解析：</span>{q.analysis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Page break line if not last */}
            {index < mistakes.length - 1 && (
              <div className="mt-12 border-t border-dashed border-gray-200" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-20 pt-4 border-t text-center text-[10px] opacity-30 italic">
        Powered by AI 错题举一反三打印机
      </div>
    </div>
  );
});

MistakePrintTemplate.displayName = 'MistakePrintTemplate';

export default MistakePrintTemplate;
