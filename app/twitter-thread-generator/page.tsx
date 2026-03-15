'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/firebase-provider';
import { GoogleGenAI, Type } from '@google/genai';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check, Layers, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export default function ThreadBuilder() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [thread, setThread] = useState<{ tweet: string, type: string }[]>([]);
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
            The Thread Builder is exclusively available on the Pro plan. Upgrade to turn single ideas into highly engaging Twitter threads.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white neon-border px-8 py-6 text-lg rounded-full">
            Upgrade to Pro - ₹299/mo
          </Button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!topic) {
      setError('Please enter a topic.');
      return;
    }

    setError('');
    setGenerating(true);
    setThread([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert Twitter ghostwriter who writes viral threads.
      Generate a highly engaging Twitter thread based on the following topic:
      Topic: ${topic}
      
      Rules for the thread:
      1. Must contain exactly 5 tweets.
      2. Each tweet must be strictly under 280 characters.
      3. Tweet 1 must be a strong Hook.
      4. Tweets 2, 3, and 4 must provide valuable Insights or storytelling.
      5. Tweet 5 must be a Call to Action (CTA).
      
      Return the output as a JSON array of objects, each containing 'tweet' (string) and 'type' (string: 'Hook', 'Insight', or 'CTA').`;

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
                tweet: { type: Type.STRING, description: "The generated tweet text" },
                type: { type: Type.STRING, description: "Type of tweet: Hook, Insight, or CTA" }
              },
              required: ["tweet", "type"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("Empty response from AI");
      
      const generatedThread = JSON.parse(jsonStr);
      setThread(generatedThread);

      // Save to Firestore
      await addDoc(collection(db, 'tweets'), {
        userId: user.uid,
        topic,
        content: JSON.stringify(generatedThread),
        type: 'thread',
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
      setError(err.message || 'Failed to generate thread. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    const fullText = thread.map(t => t.tweet).join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 flex items-center justify-center gap-2">
          <Layers className="text-primary" /> Thread Builder
        </h1>
        <p className="text-white/60">Turn a single idea into a 5-part engaging Twitter thread.</p>
      </div>

      <Card className="bg-white/5 border-white/10 mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">What&apos;s the thread about? <span className="text-red-500">*</span></label>
            <Textarea 
              placeholder="e.g., 5 lessons I learned from building a SaaS in 30 days..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="w-full bg-primary hover:bg-primary/90 text-white neon-border"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building Thread...</>
            ) : (
              <><Layers className="mr-2 h-4 w-4" /> Generate Thread</>
            )}
          </Button>
        </CardContent>
      </Card>

      {thread.length > 0 && (
        <div className="space-y-6 relative">
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/10 -z-10" />
          
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={copyAll} className="border-white/20 text-white hover:bg-white/10">
              {copiedIndex === -1 ? <Check className="w-4 h-4 text-green-400 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Entire Thread
            </Button>
          </div>

          {thread.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold">
                {idx + 1}
              </div>
              <Card className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60 font-medium">
                        {t.type}
                      </span>
                      <span className={`text-xs ${t.tweet.length > 280 ? 'text-red-400' : 'text-white/40'}`}>
                        {t.tweet.length}/280
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(t.tweet, idx)}
                      className="text-white/60 hover:text-white hover:bg-white/10 h-8"
                    >
                      {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{t.tweet}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
