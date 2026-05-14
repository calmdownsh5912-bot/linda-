/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from './services/firebaseService';
import { AppTab } from './types';
import MistakeRecognition from './components/MistakeRecognition';
import MistakeBank from './components/MistakeBank';
import { BookOpen, Camera, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.RECOGNITION);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F0] p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 font-sans tracking-tight">错题举一反三打印机</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              全科通用，支持拍照识别错题，智能解析知识点并生成 3 道变式题。让学习更高效，让错题不再重演。
            </p>
            <button
              id="login-button"
              onClick={login}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              <LogIn className="w-5 h-5" />
              使用 Google 账号登录
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-bottom border-gray-100 px-4 py-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">错题打印机</h1>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">欢迎回来</p>
              <p className="text-sm font-medium">{user.displayName}</p>
            </div>
            <img src={user.photoURL || ''} alt="avatar" className="w-10 h-10 rounded-full border-2 border-orange-100" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {activeTab === AppTab.RECOGNITION ? (
            <motion.div
              key="recognition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <MistakeRecognition />
            </motion.div>
          ) : (
            <motion.div
              key="bank"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MistakeBank />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white px-2 py-2 rounded-3xl shadow-xl border border-gray-100 flex gap-2">
        <button
          id="tab-recognition"
          onClick={() => setActiveTab(AppTab.RECOGNITION)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-200 font-medium",
            activeTab === AppTab.RECOGNITION 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-100" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <Camera className="w-5 h-5" />
          <span>错题识别</span>
        </button>
        <button
          id="tab-bank"
          onClick={() => setActiveTab(AppTab.BANK)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-200 font-medium",
            activeTab === AppTab.BANK 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-100" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <BookOpen className="w-5 h-5" />
          <span>错题本</span>
        </button>
      </nav>
    </div>
  );
}
