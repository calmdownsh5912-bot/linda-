import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Sparkles, Save, RotateCcw, CheckCircle2, ChevronRight } from 'lucide-react';
import { recognizeMistake, generateAnalogousQuestions } from '../services/geminiService';
import { saveMistake } from '../services/firebaseService';
import { Mistake, OCRResult, AnalogousQuestion } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function MistakeRecognition() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [analogousQuestions, setAnalogousQuestions] = useState<AnalogousQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setImage(base64);
        processImage(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string, type: string) => {
    setLoading(true);
    setOcrResult(null);
    setAnalogousQuestions([]);
    setSuccess(false);
    
    try {
      const result = await recognizeMistake(base64.split(',')[1], type);
      setOcrResult(result);
    } catch (error) {
      console.error('Recognition error:', error);
      alert('识别失败，请重试或手动输入。');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalogous = async () => {
    if (!ocrResult) return;
    setGenerating(true);
    try {
      const result = await generateAnalogousQuestions(ocrResult.text, ocrResult.knowledgePoint);
      setAnalogousQuestions(result);
    } catch (error) {
      console.error('Generation error:', error);
      alert('生成失败，请重试。');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!ocrResult || analogousQuestions.length === 0) return;
    setSaving(true);
    try {
      await saveMistake({
        originalText: ocrResult.text,
        originalImageUrl: image || undefined,
        options: ocrResult.options,
        userAnswer: ocrResult.userAnswer,
        correctAnswer: ocrResult.correctAnswer,
        knowledgePoint: ocrResult.knowledgePoint,
        analogousQuestions: analogousQuestions,
      });
      setSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fbbf24', '#f59e0b']
      });
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败。');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setOcrResult(null);
    setAnalogousQuestions([]);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-orange-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">已保存到错题本</h2>
        <p className="text-gray-500 mb-8">你可以前往错题本查看详情或导出 PDF。</p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          继续识别下一题
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!image && (
        <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-gray-200 hover:border-orange-200 transition-colors flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">上传错题图片</h3>
          <p className="text-gray-500 mb-8 max-w-xs">支持拍照上传或从相册选择，我们将自动识别题目内容与知识点。</p>
          <button
            id="upload-button"
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-semibold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
          >
            <Upload className="w-5 h-5" />
            选择图片
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}

      {/* Recognition & Generation Flow */}
      {image && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              识别原始错题
            </h4>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 overflow-hidden shadow-sm h-fit">
              <img src={image} alt="mistake" className="w-full rounded-2xl object-contain max-h-[400px]" />
            </div>

            {/* OCR Edit Form */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-gray-500 text-sm animate-pulse">正在利用 AI 深度识别中...</p>
                </div>
              ) : ocrResult ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">题目正文</label>
                    <textarea
                      value={ocrResult.text}
                      onChange={(e) => setOcrResult({ ...ocrResult, text: e.target.value })}
                      className="w-full p-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">核心知识点</label>
                    <input
                      type="text"
                      value={ocrResult.knowledgePoint}
                      onChange={(e) => setOcrResult({ ...ocrResult, knowledgePoint: e.target.value })}
                      className="w-full p-3 bg-orange-50/50 border-0 rounded-xl text-sm font-medium text-orange-700 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <button
                    id="generate-analogous-button"
                    onClick={generateAnalogous}
                    disabled={generating}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-black transition-all"
                  >
                    {generating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-orange-400" />
                    )}
                    生成举一反三变式题
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Analogous Questions Display */}
          <AnimatePresence>
            {analogousQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 py-4">
                  <div className="h-[1px] flex-1 bg-gray-200" />
                  <span className="text-gray-400 text-sm font-medium">AI 生成的 3 道举一反三</span>
                  <div className="h-[1px] flex-1 bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {analogousQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-200 group-hover:bg-orange-500 transition-colors" />
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold px-2 py-1 bg-orange-50 text-orange-600 rounded-lg">变式 {idx + 1}</span>
                      </div>
                      <p className="text-gray-800 font-medium mb-6 leading-relaxed whitespace-pre-wrap">{q.question}</p>
                      <div className="space-y-3 pt-4 border-t border-dashed border-gray-100">
                        <div className="flex gap-2">
                          <span className="text-sm font-bold text-gray-400">【正确答案】</span>
                          <span className="text-sm text-green-600 font-bold">{q.answer}</span>
                        </div>
                        <div className="bg-orange-50/50 p-4 rounded-xl">
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">易错点分析</span>
                          <p className="text-sm text-orange-800 leading-relaxed">{q.analysis}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={generateAnalogous}
                    disabled={generating}
                    className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    重新生成
                  </button>
                  <button
                    id="save-mistake-button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    保存到错题本
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
