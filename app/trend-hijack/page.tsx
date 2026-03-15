'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/firebase-provider';
import { GoogleGenAI, Type } from '@google/genai';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, TrendingUp, Crown, Hash } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORIES = ['Tech', 'Business', 'Startups', 'Internet Culture', 'AI', 'Marketing'];

export default function TrendHijack() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ topic: string, tweet: string, hashtags: string[] }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  const isPro = userData?.subscriptionTier === 'pro';

  if (!isPro) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Pro Feature</h2>
          <p className="text-white/60 mb-8 max-w-md">
            TrendHijack AI is exclusively available on the Pro plan. Upgrade to detect trending conversations and generate tweets that join those discussions intelligently.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white neon-border px-8 py-6 text-lg rounded-full">
            Upgrade to Pro - ₹299/mo
          </Button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    setResults([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert Twitter growth hacker.
      Analyze current trends in the "${category}" category and generate 3 highly engaging tweets that "hijack" or join these trending conversations intelligently.
      
      Rules:
      1. Identify a plausible current trending topic in this category.
      2. Write a tweet that adds a unique, contrarian, or highly insightful perspective to this trend.
      3. Must be strictly under 280 characters.
      4. Include 2-3 highly relevant hashtags.
      
      Return the output as a JSON array of objects, each containing 'topic' (string: the trending topic), 'tweet' (string: the generated tweet), and 'hashtags' (array of strings).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: "The trending topic" },
                tweet: { type: Type.STRING, description: "The generated tweet text" },
                hashtags: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Array of hashtags" 
                }
              },
              required: ["topic", "tweet", "hashtags"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("Empty response from AI");
      
      const generatedTrends = JSON.parse(jsonStr);
      setResults(generatedTrends);

      // Save to Firestore
      await addDoc(collection(db, 'tweets'), {
        userId: user.uid,
        topic: `TrendHijack: ${category}`,
        content: JSON.stringify(generatedTrends),
        type: 'trend',
        isPublic: false,
        createdAt: new Date().toISOString()
      });

      // Update user usage
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tweetsGenerated: increment(1)
      });
      await refreshUserData();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate trends. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, hashtags: string[], index: number) => {
    const fullText = `${text}\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="text-primary" /> TrendHijack AI
        </h1>
        <p className="text-white/60">Detect trending conversations and generate tweets to join them.</p>
      </div>

      <Card className="bg-white/5 border-white/10 mb-8">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Select Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors border ${
                    category === c 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="w-full bg-primary hover:bg-primary/90 text-white neon-border"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Trends...</>
            ) : (
              <><TrendingUp className="mr-2 h-4 w-4" /> Discover & Hijack Trends</>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold text-white/90 mb-4">Trending Opportunities</h3>
          
          {results.map((res, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {res.topic}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(res.tweet, res.hashtags, idx)}
                      className="text-white/60 hover:text-white hover:bg-white/10 h-8"
                    >
                      {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-2">{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-lg mb-4">{res.tweet}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {res.hashtags.map((tag, i) => (
                      <span key={i} className="text-sm text-primary/80">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
