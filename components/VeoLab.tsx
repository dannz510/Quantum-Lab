import React, { useState, useRef } from 'react';
import { Video, Upload, Play, Loader2, AlertCircle, Film } from 'lucide-react';
import { generatePhysicsVideo } from '../services/gemini';
import { VideoGenerationState } from '../types';

export const VeoLab: React.FC = () => {
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<VideoGenerationState>({ status: 'idle' });
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (hasKey) {
        setApiKeyVerified(true);
      } else {
        await window.aistudio.openSelectKey();
        // Assume success after dialog interaction per guidelines
        setApiKeyVerified(true);
      }
    } catch (e) {
      console.error("API Key selection failed", e);
      // Even if check fails, we might try to proceed or show specific error, 
      // but guidelines say reset/prompt again if 404. 
      // For now, we assume user interaction works.
      setApiKeyVerified(true); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for API
        const base64Data = base64String.split(',')[1];
        setSelectedImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!apiKeyVerified) {
      await checkApiKey();
    }
    
    if (!selectedImage || !prompt) return;

    setVideoState({ status: 'generating', progressMessage: 'Initializing quantum simulation...' });

    try {
      // Create a fresh instance to ensure key is picked up
      const uri = await generatePhysicsVideo(prompt, selectedImage, aspectRatio);
      
      // Append key for fetching
      const authedUri = `${uri}&key=${process.env.API_KEY}`;
      
      setVideoState({ 
        status: 'completed', 
        videoUri: authedUri 
      });
    } catch (error) {
      setVideoState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown simulation error' 
      });
    }
  };

  // Messages to show while polling (simulated progress)
  const loadingMessages = [
    "Analyzing visual data...",
    "Calculating physics vectors...",
    "Rendering light and shadow...",
    "Applying motion laws...",
    "Finalizing simulation..."
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  React.useEffect(() => {
    let interval: any;
    if (videoState.status === 'generating') {
      interval = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % loadingMessages.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [videoState.status]);

  if (!apiKeyVerified) {
     return (
       <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
         <div className="p-4 bg-lab-card rounded-full ring-4 ring-lab-accent/20">
            <Film size={48} className="text-lab-accent" />
         </div>
         <h2 className="text-2xl font-bold text-white">Veo Physics Simulator</h2>
         <p className="text-slate-400 max-w-md">
           To generate high-quality physics simulations using Veo, you need to select a paid API key from a Google Cloud Project.
         </p>
         <button 
           onClick={checkApiKey}
           className="px-6 py-3 bg-lab-accent hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
         >
           Select API Key to Begin
         </button>
         <a 
           href="https://ai.google.dev/gemini-api/docs/billing" 
           target="_blank" 
           rel="noreferrer"
           className="text-sm text-slate-500 hover:text-slate-300 underline"
         >
           View Billing Documentation
         </a>
       </div>
     )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto p-2">
      <div className="space-y-6">
        <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-lab-accent" />
            Input Setup
          </h2>
          
          <div className="space-y-4">
            {/* Image Upload */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-lab-accent hover:bg-slate-800/50 transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              {selectedImage ? (
                <div className="relative h-48 w-full">
                  <img 
                    src={`data:image/png;base64,${selectedImage}`} 
                    alt="Preview" 
                    className="h-full w-full object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium">Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-white">
                  <Upload size={32} />
                  <span>Click to upload experiment setup photo</span>
                </div>
              )}
            </div>

            {/* Config */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-lab-accent outline-none"
                  >
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                  </select>
               </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Simulation Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the physics phenomenon to simulate... (e.g., 'A ball rolling down a ramp colliding with a block')"
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-lab-accent outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedImage || !prompt || videoState.status === 'generating'}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-bold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {videoState.status === 'generating' ? (
                <><Loader2 className="animate-spin" /> Simulating...</>
              ) : (
                <><Video className="w-5 h-5" /> Generate Simulation</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 h-full min-h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-400" />
            Simulation Output
          </h2>
          
          <div className="flex-1 bg-black/40 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
            {videoState.status === 'idle' && (
              <div className="text-slate-500 flex flex-col items-center gap-3">
                <Video size={48} className="opacity-20" />
                <p>Ready to simulate</p>
              </div>
            )}

            {videoState.status === 'generating' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-6 text-center">
                <Loader2 size={48} className="text-lab-accent animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Generating Video</h3>
                <p className="text-slate-300 animate-pulse">{loadingMessages[msgIndex]}</p>
                <p className="text-xs text-slate-500 mt-4 max-w-xs">This process may take a minute. Veo is creating frames...</p>
              </div>
            )}

            {videoState.status === 'error' && (
              <div className="text-red-400 flex flex-col items-center gap-3 p-6 text-center">
                <AlertCircle size={48} />
                <p>{videoState.error}</p>
              </div>
            )}

            {videoState.status === 'completed' && videoState.videoUri && (
              <video 
                src={videoState.videoUri} 
                controls 
                autoPlay 
                loop
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};