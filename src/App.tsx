import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Send, 
  RefreshCw,
  Type,
  Layout,
  Zap,
  History,
  Trash2,
  Share2,
  X,
  ChevronRight,
  Info,
  Smartphone,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface SavedNote {
  id: string;
  timestamp: number;
  input: string;
  result: string;
  image?: string;
}

export default function App() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<SavedNote[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rednote_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('rednote_history', JSON.stringify(history));
  }, [history]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePost = async () => {
    if (!input && !image) return;
    setLoading(true);
    setResult('');

    try {
      let prompt = `你是一个资深的小红书博主，精通2026年最新的小红书平台规则和敏感词库。
      请根据以下内容创作一篇小红书风格的笔记：
      内容描述：${input}
      
      【严格合规要求 - 必须执行】：
      1. **禁止极端词**：严禁使用“最”、“第一”、“顶级”、“100%”、“天花板”、“首选”、“最新”、“专属”。请用“敲”、“绝美”、“宝藏”、“心头好”、“thb”、“sx”、“zui新”、“diyi”、“独一份”、“zs”等词代替。
      2. **禁止导流词**：严禁使用“评论”、“推荐”、“滴滴我”、“私信”、“私”、“留言”、“dd我”、“找我”、“咨询”。请用“评仑”、“💬”、“找我”、“sx”、“悄悄话”、“留。言”、“dd”、“滴。滴”、“问问”等词代替。
      3. **禁止金融词**：严禁使用“首付”。请用“sf”、“第一笔💰”等词代替。
      4. **禁止科技词**：严禁使用“智能”。请用“zn”、“黑科技”、“全自动”等词代替。
      5. **禁止医疗词**：严禁使用“减肥”、“瘦身”、“治疗”、“药”、“祛痘”。请用“掉秤”、“塑形”、“调理”、“好物”、“战痘”等词代替。
      6. **禁止营销词**：严禁使用“赚钱”、“发财”、“兼职”、“价格”、“多少钱”、“秒杀”、“特价”、“限时”。请用“搞钱”、“变富”、“副业”、“米”、“几位数”、“手慢无”、“心动价”、“速来”等词代替。
      7. **禁止竞品名**：严禁使用“微信”、“淘宝”、“拼多多”。请用“绿泡泡”、“某宝”、“某多多”等词代替。
      8. **文字变形**：对于可能敏感的词，请使用拼音、谐音或符号隔开（如：zui、diyi、搞💰、sx、thb、sf、zn、zs）。
      
      【创作要求】：
      1. 标题要极其吸睛，使用emoji。
      2. 正文内容要有亲和力，多用“宝子们”、“亲测”、“入股不亏”等正向词汇。
      3. 段落清晰，每段开头带emoji。
      4. 结尾加上相关的热门话题标签（至少5个）。
      5. 语气要活泼、真诚、有质感。
      
      请直接输出笔记内容，不要包含任何多余的解释。`;

      let contents: any;
      if (image) {
        const base64Data = image.split(',')[1];
        contents = {
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        };
      } else {
        contents = prompt;
      }

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: "你是一个2026年小红书合规专家。你的任务是创作爆款文案，同时通过谐音、拼音、符号或同义词完美避开所有平台敏感词。重点替换：找我->戳我/dd，咨询->问问/聊聊，第一->diyi/首位，专属->独一份/zs，首选->必入/sx，最->zui/敲，首付->sf/第一笔💰，最新->zui新/刚出的，智能->zn/黑科技，天花板->thb/顶峰，留言->💬/留。言，评论->评仑/💬，推荐->推存/种草，私信->sx/私我。确保文案100%安全且不被限流。"
        }
      });

      const generatedText = response.text || "生成失败，请重试。";
      setResult(generatedText);

      // Add to history
      const newNote: SavedNote = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        input: input,
        result: generatedText,
        image: image || undefined
      };
      setHistory(prev => [newNote, ...prev].slice(0, 20)); // Keep last 20
    } catch (error) {
      console.error("Generation error:", error);
      setResult("出错了，请检查网络或稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareContent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RedNote Master 生成的文案',
          text: result,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      copyToClipboard(result);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setInput('');
    setImage(null);
    setResult('');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-[#FF2442] selection:text-white pb-20 md:pb-0">
      {/* Navigation Bar - Mobile Bottom / Desktop Side */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:px-12 md:py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF2442] rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="hidden md:block font-black tracking-tighter text-xl uppercase italic">RedNote <span className="text-[#FF2442]">Master</span></span>
        </div>
        
        <div className="flex items-center gap-6 md:gap-8">
          <button 
            onClick={() => setShowHistory(false)}
            className={`flex flex-col items-center gap-1 transition-colors ${!showHistory ? 'text-[#FF2442]' : 'text-black/40 hover:text-black'}`}
          >
            <Layout size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">生成器</span>
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className={`flex flex-col items-center gap-1 transition-colors ${showHistory ? 'text-[#FF2442]' : 'text-black/40 hover:text-black'}`}
          >
            <History size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">历史</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full">
            <Globe size={12} className="opacity-40" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Web App v2.0</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-12 md:pt-32 pb-12">
        <AnimatePresence mode="wait">
          {!showHistory ? (
            <motion.div 
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              {/* Left Column: Input */}
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">创作中心</h2>
                  <button 
                    onClick={clearAll}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} /> 清空全部
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                      <Type size={12} /> 核心关键词 / 灵感描述
                    </label>
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="例如：今天去了一家超美的咖啡店，装修是复古风，拿铁很好喝..."
                        className="w-full h-48 p-6 bg-white border border-black/5 rounded-3xl shadow-sm focus:ring-4 focus:ring-[#FF2442]/5 focus:border-[#FF2442] outline-none transition-all resize-none text-lg leading-relaxed"
                      />
                      {input && (
                        <button 
                          onClick={() => setInput('')}
                          className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                      <ImageIcon size={12} /> 参考图片 (可选)
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative h-56 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
                        ${image ? 'border-[#FF2442]' : 'border-black/10 hover:border-black/20 hover:bg-black/[0.01]'}`}
                    >
                      {image ? (
                        <>
                          <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                              <p className="text-white text-[10px] font-bold uppercase tracking-widest">更换图片</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6 opacity-30" />
                          </div>
                          <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">点击或拖拽上传</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <button
                    onClick={generatePost}
                    disabled={loading || (!input && !image)}
                    className={`w-full py-6 rounded-3xl font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-3 transition-all
                      ${loading || (!input && !image) 
                        ? 'bg-black/5 text-black/20 cursor-not-allowed' 
                        : 'bg-[#FF2442] text-white hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-[#FF2442]/30'}`}
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={24} className="fill-current" />
                        生成爆款文案
                      </>
                    )}
                  </button>
                </div>

                <div className="p-6 bg-black/[0.02] rounded-3xl border border-black/5 flex items-start gap-4">
                  <div className="bg-[#FF2442]/10 p-2 rounded-xl">
                    <Info className="text-[#FF2442] w-5 h-5 shrink-0" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">2026 合规引擎已开启</p>
                    <p className="text-[10px] leading-relaxed opacity-40">系统将自动识别并替换“最”、“第一”、“首付”、“智能”等敏感词，确保笔记权重不受损。</p>
                  </div>
                </div>
              </section>

              {/* Right Column: Result */}
              <section className="relative">
                <div className="sticky top-32 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">生成结果</h2>
                    {result && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={shareContent}
                          className="p-3 bg-white border border-black/5 rounded-2xl shadow-sm hover:bg-black/5 transition-colors"
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(result)}
                          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? '已复制' : '复制全文'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="min-h-[500px] bg-white border border-black/5 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {!result && !loading ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center opacity-10"
                        >
                          <Sparkles size={64} className="mb-6" />
                          <p className="text-lg font-black uppercase tracking-[0.3em]">等待灵感降临</p>
                        </motion.div>
                      ) : loading ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-6"
                        >
                          <div className="h-12 bg-black/5 rounded-2xl w-3/4 animate-pulse" />
                          <div className="space-y-3">
                            <div className="h-4 bg-black/5 rounded-full w-full animate-pulse" />
                            <div className="h-4 bg-black/5 rounded-full w-full animate-pulse" />
                            <div className="h-4 bg-black/5 rounded-full w-5/6 animate-pulse" />
                            <div className="h-4 bg-black/5 rounded-full w-full animate-pulse" />
                            <div className="h-4 bg-black/5 rounded-full w-2/3 animate-pulse" />
                          </div>
                          <div className="h-32 bg-black/5 rounded-3xl w-full animate-pulse" />
                        </motion.div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="prose prose-sm max-w-none prose-headings:text-[#FF2442] prose-p:leading-relaxed"
                        >
                          <div className="markdown-body whitespace-pre-wrap">
                            <Markdown>{result}</Markdown>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase italic">创作历史</h2>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-30 mt-2">最近生成的 20 条记录</p>
                </div>
                <button 
                  onClick={() => {
                    if(confirm('确定要清空所有历史记录吗？')) setHistory([]);
                  }}
                  className="p-4 bg-black/5 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="py-32 text-center opacity-20">
                  <History size={64} className="mx-auto mb-6" />
                  <p className="text-xl font-black uppercase tracking-widest">暂无历史记录</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      className="bg-white border border-black/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-shadow group"
                    >
                      {item.image && (
                        <div className="w-full md:w-32 h-32 shrink-0 rounded-2xl overflow-hidden border border-black/5">
                          <img src={item.image} alt="History" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="flex-1 space-y-4 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setInput(item.input);
                                setImage(item.image || null);
                                setResult(item.result);
                                setShowHistory(false);
                              }}
                              className="p-2 bg-black/5 rounded-lg hover:bg-[#FF2442] hover:text-white transition-colors"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button 
                              onClick={() => deleteHistoryItem(item.id)}
                              className="p-2 bg-black/5 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold truncate opacity-60 italic">“{item.input || '图片创作'}”</p>
                        <div className="p-6 bg-black/[0.01] rounded-2xl border border-black/5">
                          <p className="text-xs line-clamp-3 opacity-80 leading-relaxed">{item.result}</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(item.result)}
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#FF2442] hover:opacity-70 transition-opacity"
                        >
                          <Copy size={12} /> 复制此文案
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer - Only on Desktop */}
      <footer className="hidden md:block max-w-6xl mx-auto px-12 py-12 text-center border-t border-black/5 mt-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 opacity-30">
              <Smartphone size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Mobile Optimized</span>
            </div>
            <div className="flex items-center gap-2 opacity-30">
              <Globe size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Sync Ready</span>
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20">
            RedNote Master © 2026 Professional Edition
          </p>
        </div>
      </footer>

      {/* Toast Notification for Copy */}
      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-black text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <Check className="text-green-400" size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">已成功复制到剪贴板</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
