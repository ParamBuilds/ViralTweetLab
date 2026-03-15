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
import { Loader2, Copy, Check, PenTool, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export default function TweetImprover() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [originalTweet, setOriginalTweet] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ tweet: string, improvement: string }[]>([]);
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
            The Tweet Improver is exclusively available on the Pro plan. Upgrade to optimize your existing tweets for maximum engagement.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white neon-border px-8 py-6 text-lg rounded-full">
            Upgrade to Pro - ₹299/mo
          </Button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!originalTweet) {
      setError('Please paste an original tweet.');
      return;
    }

    setError('');
    setGenerating(true);
    setResults([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert Twitter ghostwriter who optimizes tweets for virality.
      Improve the following tweet to make it more engaging, shareable, and likely to go viral.
      Original Tweet: "${originalTweet}"
      
      Rules:
      1. Generate 3 improved variations.
      2. Each variation must be strictly under 280 characters.
      3. Focus on stronger hooks, better formatting, and emotional triggers.
      
      Return the output as a JSON array of objects, each containing 'tweet' (string) and 'improvement' (string: short explanation of why it's better).`;

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
                tweet: { type: Type.STRING, description: "The improved tweet text" },
                improvement: { type: Type.STRING, description: "Explanation of the improvement" }
              },
              required: ["tweet", "improvement"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("Empty response from AI");
      
      const generatedImprovements = JSON.parse(jsonStr);
      setResults(generatedImprovements);

      // Save to Firestore
      await addDoc(collection(db, 'tweets'), {
        userId: user.uid,
        topic: originalTweet,
        content: JSON.stringify(generatedImprovements),
        type: 'improved',
        isPublic: false,
        createdAt: new Date().toISOString()
      });

      // Update user usage
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        tweetsGenerated: increment(1)
      });
      await refreshUserData();

      // Update public profile total tweets
      const publicProfileRef = doc(db, 'public_profiles', user.uid);
      await updateDoc(publicProfileRef, {
        totalTweets: increment(1),
        lastActive: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to improve tweet. Please try again.');
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
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 flex items-center justify-center gap-2">
          <PenTool className="text-primary" /> Tweet Improver
        </h1>
        <p className="text-white/60">Paste your draft and let AI optimize it for maximum engagement.</p>
      </div>

      <Card className="bg-white/5 border-white/10 mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Original Tweet <span className="text-red-500">*</span></label>
            <Textarea 
              placeholder="Paste your draft tweet here..." 
              value={originalTweet}
              onChange={(e) => setOriginalTweet(e.target.value)}
              className="resize-none min-h-[120px]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="w-full bg-primary hover:bg-primary/90 text-white neon-border"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimizing...</>
            ) : (
              <><PenTool className="mr-2 h-4 w-4" /> Improve Tweet</>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold text-white/90 mb-4">Optimized Variations</h3>
          
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
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                        Variation {idx + 1}
                      </span>
                      <span className={`text-xs ${res.tweet.length > 280 ? 'text-red-400' : 'text-white/40'}`}>
                        {res.tweet.length}/280
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(res.tweet, idx)}
                      className="text-white/60 hover:text-white hover:bg-white/10 h-8"
                    >
                      {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-2">{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed mb-4">{res.tweet}</p>
                  
                  <div className="bg-black/30 rounded p-3 border border-white/5">
                    <p className="text-xs text-white/50 font-medium mb-1">Why it&apos;s better:</p>
                    <p className="text-sm text-white/70">{res.improvement}</p>
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
