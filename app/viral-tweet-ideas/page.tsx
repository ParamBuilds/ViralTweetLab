'use client';

import { useState } from 'react';
import { useAuth } from '@/components/firebase-provider';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lightbulb, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export default function ViralIdeaGenerator() {
  const { user } = useAuth();
  const [niche, setNiche] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const generateIdeas = async () => {
    if (!niche.trim()) {
      setError('Please enter a niche.');
      return;
    }

    setGenerating(true);
    setError('');
    setIdeas([]);

    try {
      const prompt = `You are an expert Twitter ghostwriter and content strategist.
      Generate 10 highly engaging, viral tweet ideas for the following niche: "${niche}".
      
      Rules:
      1. Focus on curiosity gaps, contrarian statements, storytelling, short insights, and psychological triggers.
      2. Keep ideas concise and actionable.
      3. Return ONLY a JSON array of strings, where each string is a distinct tweet idea.
      4. Do not include any other text, markdown formatting, or explanations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '[]';
      const parsed = JSON.parse(text);
      setIdeas(parsed);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate ideas. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
          Viral Idea Generator
        </h1>
        <p className="text-white/60 text-lg">
          Stuck on what to tweet? Enter your niche and get 10 viral tweet ideas instantly.
        </p>
      </div>

      <Card className="bg-white/5 border-white/10 mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Your Niche <span className="text-red-500">*</span></label>
            <Input 
              placeholder="e.g., Startups, Freelancing, Marketing, AI..." 
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-black/50 border-white/10 focus:border-primary/50 text-white"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={generateIdeas} 
            disabled={generating || !niche.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white neon-border py-6 text-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Brainstorming Ideas...
              </>
            ) : (
              'Generate 10 Viral Ideas'
            )}
          </Button>
        </CardContent>
      </Card>

      {ideas.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-display font-bold">Your Viral Ideas</h2>
          <div className="grid gap-4">
            {ideas.map((idea, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-4 flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-xl font-display font-bold text-white/20 mt-1">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <p className="text-white/90 leading-relaxed">{idea}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(idea, idx)}
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 shrink-0"
                  >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
