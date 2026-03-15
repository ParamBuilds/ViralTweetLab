'use client';

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export function InteractiveDemo() {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ tweet: string; score: number; hashtags: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateDemoTweet = async () => {
    if (!topic.trim()) return;
    
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert Twitter ghostwriter.
      Generate 1 highly engaging viral tweet about: "${topic}".
      
      Rules:
      1. Under 280 characters.
      2. Strong hook.
      3. Return a JSON object with: 'tweet' (string), 'score' (number 0-100), and 'hashtags' (array of 2 strings).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      setResult(parsed);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.tweet}\n\n${result.hashtags.join(' ')}\n\nGenerated with ViralTweetLab`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-16 relative z-10">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md shadow-2xl">
        <div className="bg-black/40 rounded-xl p-6 border border-white/5">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Input 
              placeholder="Enter a topic (e.g., AI replacing jobs, Freelancing tips)..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-white/5 border-white/10 text-white h-12 text-lg focus:border-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && generateDemoTweet()}
            />
            <Button 
              onClick={generateDemoTweet} 
              disabled={generating || !topic.trim()}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shrink-0"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
              {generating ? 'Generating...' : 'Generate Free'}
            </Button>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/5 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
                      Virality Score: {result.score}/100
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="text-white/60 hover:text-white hover:bg-white/10 h-8"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-2">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-lg mb-4">{result.tweet}</p>
                  <div className="flex gap-2">
                    {result.hashtags.map((tag, i) => (
                      <span key={i} className="text-primary/80 text-sm font-medium">{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
