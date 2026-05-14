import React, { useState, useEffect, useRef } from 'react';
import { getMistakes, deleteMistake } from '../services/firebaseService';
import { Mistake } from '../types';
import { 
  Loader2, 
  Search, 
  Trash2, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Printer, 
  CheckSquare, 
  Square,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import MistakePrintTemplate from './MistakePrintTemplate';

export default function MistakeBank() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  
  const contentToPrintRef = useRef<HTMLDivElement>(null);

  const fetchMistakes = async () => {
    setLoading(true);
    const data = await getMistakes();
    setMistakes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMistakes.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMistakes.map(m => m.id!)));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条错题记录吗？')) return;
    await deleteMistake(id);
    setMistakes(mistakes.filter(m => m.id !== id));
    if (selectedIds.has(id)) {
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
    }
  };

  const filteredMistakes = mistakes.filter(m => 
    m.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.knowledgePoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMistakes = mistakes.filter(m => selectedIds.has(m.id!));

  const handlePrint = useReactToPrint({
    contentRef: contentToPrintRef,
    documentTitle: '错题打印 - ' + new Date().toLocaleDateString(),
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-gray-500">正在获取错题记录...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索错题或知识点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-orange-200 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={selectAll}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {selectedIds.size === filteredMistakes.length && filteredMistakes.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-orange-500" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            {selectedIds.size === filteredMistakes.length && filteredMistakes.length > 0 ? '反选全部' : '全选'}
          </button>
          
          <button
            id="print-button"
            onClick={() => handlePrint()}
            disabled={selectedIds.size === 0}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-100"
          >
            <Printer className="w-4 h-4" />
            打印选中 ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* List Body */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-orange-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500">暂无错题记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20">
          {filteredMistakes.map((mistake) => (
            <div
              key={mistake.id}
              onClick={() => setViewingId(mistake.id!)}
              className={cn(
                "group bg-white rounded-3xl p-5 border transition-all cursor-pointer relative",
                selectedIds.has(mistake.id!) 
                  ? "border-orange-500 shadow-lg shadow-orange-50 shadow-sm" 
                  : "border-gray-100 hover:border-orange-200 shadow-sm"
              )}
            >
              <div className="flex gap-4">
                {/* Selection Overlay for small icon */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(mistake.id!);
                  }}
                  className="mt-1"
                >
                  {selectedIds.has(mistake.id!) ? (
                    <CheckSquare className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300 group-hover:text-orange-300" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg truncate max-w-[200px]">
                        {mistake.knowledgePoint}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        {formatDate(mistake.createdAt?.toDate?.() || new Date())}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(mistake.id!, e)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-gray-900 font-medium line-clamp-2 text-sm leading-relaxed">
                    {mistake.originalText}
                  </p>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-400">包含 {mistake.analogousQuestions.length} 条举一反三题目</span>
                    <ArrowRight className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#F9F9F7] w-full max-w-2xl h-[90vh] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">错题详情</h3>
                  <p className="text-xs text-gray-500">
                    知识点：{mistakes.find(m => m.id === viewingId)?.knowledgePoint}
                  </p>
                </div>
                <button
                  onClick={() => setViewingId(null)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {/* Original Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="w-1 h-3 bg-gray-300 rounded-full" />
                    原始错题
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    {mistakes.find(m => m.id === viewingId)?.originalImageUrl && (
                      <img 
                        src={mistakes.find(m => m.id === viewingId)?.originalImageUrl} 
                        className="w-full h-auto mb-4 rounded-xl border border-gray-50"
                        alt="Mistake" 
                      />
                    )}
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {mistakes.find(m => m.id === viewingId)?.originalText}
                    </p>
                    {mistakes.find(m => m.id === viewingId)?.correctAnswer && (
                      <div className="mt-4 p-4 bg-green-50 rounded-2xl flex gap-2">
                        <span className="text-sm font-bold text-green-700">正确答案:</span>
                        <span className="text-sm text-green-700">{mistakes.find(m => m.id === viewingId)?.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analogous Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
                    <div className="w-1 h-3 bg-orange-300 rounded-full" />
                    举一反三题目
                  </div>
                  <div className="space-y-4">
                    {mistakes.find(m => m.id === viewingId)?.analogousQuestions.map((q, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-4 right-4 text-[40px] font-black text-orange-50/50 leading-none select-none">
                          0{i + 1}
                        </div>
                        <p className="text-gray-800 font-medium mb-6 mt-2 leading-relaxed">
                          {q.question}
                        </p>
                        <div className="pt-4 border-t border-dashed border-gray-100 space-y-3">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">答案</span>
                            <span className="text-sm text-green-600 font-bold">{q.answer}</span>
                          </div>
                          <div className="bg-orange-50/70 p-4 rounded-2xl">
                            <div className="flex items-center gap-1 mb-1">
                              <Sparkles className="w-3 h-3 text-orange-500" />
                              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">解析与常见易错点</span>
                            </div>
                            <p className="text-sm text-orange-800 leading-relaxed">
                              {q.analysis}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Print Template */}
      <div className="hidden">
        <MistakePrintTemplate ref={contentToPrintRef} mistakes={selectedMistakes} />
      </div>
    </div>
  );
}
