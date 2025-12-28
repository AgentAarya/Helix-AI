
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const url = await generateImage(prompt);
      if (url) {
        setImageUrl(url);
        setHistory(prev => [url, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('Failed to generate image. Please try a different prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `helix-ai-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 h-full flex flex-col overflow-y-auto pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Image Studio</h2>
        <p className="text-slate-400">Turn your imagination into visuals with Helix AI.</p>
      </div>

      <div className="glass rounded-3xl p-6 border border-slate-700/50 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with purple neon lights and hovering cars..."
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-100 placeholder-slate-500"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              prompt.trim() && !isGenerating
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <><i className="fa-solid fa-sparkles animate-pulse"></i> Generating...</>
            ) : (
              <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass aspect-square rounded-3xl border border-slate-700 overflow-hidden relative flex items-center justify-center group">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="Generated result" className="w-full h-full object-cover animate-fadeIn" />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleDownload}
                  className="bg-indigo-600/90 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 text-sm font-bold border border-white/10"
                >
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-600">
                <i className="fa-regular fa-image text-3xl"></i>
              </div>
              <p className="text-slate-500">Your generated image will appear here</p>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20">
               <div className="text-center">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-indigo-400 font-medium animate-pulse">Crafting your vision...</p>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fa-solid fa-history text-slate-500"></i> Recent Generations
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {history.length > 0 ? history.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden glass border border-slate-800 cursor-pointer hover:border-indigo-500 transition-all group relative" onClick={() => setImageUrl(url)}>
                <img src={url} alt={`History ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <i className="fa-solid fa-expand text-white"></i>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 text-center glass rounded-2xl border-dashed border-2 border-slate-800 text-slate-600">
                No history yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
