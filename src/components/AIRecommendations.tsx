import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";

interface Recommendation {
  title: string;
  artist: string;
  reason: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function AIRecommendations() {
  const { currentSong } = usePlayerStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!currentSong) return;
    setLoading(true);
    try {
      const prompt = `Given the current song "${currentSong.title}" by ${currentSong.artist}, suggest 3 similar songs or genres that would fit the vibe. Return the response as a JSON array of objects with 'title', 'artist', and 'reason' fields.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        setRecommendations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentSong && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [currentSong]);

  if (!currentSong) return null;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-x-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-white">AI Recommendations</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRecommendations}
          disabled={loading}
          className="text-zinc-400 hover:text-white"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800/50 rounded-xl animate-pulse" />
          ))
        ) : recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <div key={i} className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50 hover:border-orange-500/30 transition-colors">
              <h4 className="font-bold text-white text-sm truncate">{rec.title}</h4>
              <p className="text-zinc-500 text-xs mb-2">{rec.artist}</p>
              <p className="text-zinc-400 text-[10px] leading-relaxed line-clamp-2 italic">
                "{rec.reason}"
              </p>
            </div>
          ))
        ) : (
          <p className="text-zinc-500 text-sm col-span-full text-center py-4">
            Play a song to get AI-powered recommendations.
          </p>
        )}
      </div>
    </div>
  );
}
