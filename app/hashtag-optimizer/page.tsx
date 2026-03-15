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
import { Loader2, Copy, Check, Hash, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export default function HashtagOptimizer() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [tweet, setTweet] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ category: string, hashtags: string[] }[]>([]);
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);
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
            Hashtag Optimizer is exclusively available on the Pro plan. Upgrade to get AI-curated hashtags that maximize your tweet&apos;s reach.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white neon-border px-8 py-6 text-lg rounded-full">
            Upgrade to Pro - ₹299/mo
          </Button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!tweet.trim()) {
      setError('Please enter a tweet to optimize.');
      return;
    }

    setError('');
    setGenerating(true);
    setResults([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Analyze the following tweet and suggest highly effective hashtags to maximize reach and engagement.
      
      Tweet: "${tweet}"
      
      Rules:
      1. Provide hashtags in 3 categories: 'Broad Reach', 'Niche Specific', and 'Trending Potential'.
      2. Each category should have 3-5 hashtags.
      3. Do not include the '#' symbol in the returned strings.
      
      Return the output as a JSON array of objects, each containing 'category' (string) and 'hashtags' (array of strings).`;

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
                category: { type: Type.STRING },
                hashtags: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }
                }
              },
              required: ["category", "hashtags"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("Empty response from AI");
      
      const generatedHashtags = JSON.parse(jsonStr);
      setResults(generatedHashtags);

      // Save to Firestore
      await addDoc(collection(db, 'tweets'), {
        userId: user.uid,
        topic: `Hashtag Optimization`,
        content: JSON.stringify(generatedHashtags),
        type: 'hashtag',
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
      setError(err.message || 'Failed to generate hashtags. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (tag: string) => {
    navigator.clipboard.writeText(`#${tag}`);
    setCopiedHashtag(tag);
    setTimeout(() => setCopiedHashtag(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 flex items-center justify-center gap-2">
          <Hash className="text-primary" /> Hashtag Optimizer
        </h1>
        <p className="text-white/60">Get AI-curated hashtags to maximize your tweet&apos;s reach.</p>
      </div>

      <Card className="bg-white/5 border-white/10 mb-8">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Your Tweet</label>
            <Textarea
              placeholder="Paste your tweet here..."
              value={tweet}
              onChange={(e) => setTweet(e.target.value)}
              className="min-h-[120px] bg-white/5 border-white/10 focus:border-primary/50 text-white resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button 
            onClick={handleGenerate} 
            disabled={generating || !tweet.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white neon-border"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Tweet...</>
            ) : (
              <><Hash className="mr-2 h-4 w-4" /> Generate Hashtags</>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {results.map((res, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white/90">{res.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {res.hashtags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => copyToClipboard(tag)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10 hover:border-primary/30 rounded-full text-sm transition-colors group"
                      >
                        {copiedHashtag === tag ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Hash className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        )}
                        {tag}
                      </button>
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
