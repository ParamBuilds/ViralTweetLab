'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/firebase-provider';
import { GoogleGenAI, Type } from '@google/genai';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check, Sparkles, Zap, TrendingUp, Download } from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';

const TONES = ['Founder', 'Educational', 'Controversial', 'Funny', 'Storytelling', 'Minimalist'];

export default function Generator() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [goal, setGoal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<{ tweet: string, score: number, docId?: string }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const tweetRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  const isPro = userData?.subscriptionTier === 'pro';
  const tweetsLeft = isPro ? Infinity : Math.max(0, 5 - (userData?.tweetsGenerated || 0));

  const handleGenerate = async () => {
    if (!topic) {
      setError('Please enter a topic.');
      return;
    }
    if (!isPro && tweetsLeft <= 0) {
      setError('You have reached your free limit. Please upgrade to Pro.');
      return;
    }

    setError('');
    setGenerating(true);
    setResults([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert Twitter ghostwriter who writes viral tweets.
      Generate 5 highly engaging viral tweets based on the following:
      Topic: ${topic}
      Tone: ${tone}
      Goal: ${goal || 'Maximum engagement and virality'}
      
      Rules for each tweet:
      1. Must be strictly under 280 characters.
      2. Must contain a strong, scroll-stopping hook (e.g., "Most people think...", "Unpopular opinion:", "Here's a harsh truth:").
      3. Must be optimized for engagement and shareability.
      4. Provide a virality score (0-100) based on hook strength, curiosity gap, and emotional trigger.
      5. Include 1-2 highly relevant, trending hashtags at the end of each tweet.
      
      Return the output as a JSON array of objects, each containing 'tweet' (string) and 'score' (number).`;

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
                score: { type: Type.NUMBER, description: "Virality score from 0 to 100" }
              },
              required: ["tweet", "score"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error("Empty response from AI");
      
      const generatedTweets = JSON.parse(jsonStr);
      setResults(generatedTweets);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'tweets'), {
        userId: user.uid,
        topic,
        content: JSON.stringify(generatedTweets),
        type: 'tweet',
        isPublic: false,
        viralityScore: Math.max(...generatedTweets.map((t: any) => t.score)),
        createdAt: new Date().toISOString()
      });

      // Update user usage
      if (!isPro) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          tweetsGenerated: increment(1)
        });
        await refreshUserData();
      }

      // Add doc id to results for making public
      setResults(generatedTweets.map((t: any) => ({ ...t, docId: docRef.id })));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate tweets. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    const watermark = !isPro ? '\n\nWritten with ViralTweetLab' : '';
    navigator.clipboard.writeText(text + watermark);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const makePublic = async (docId: string, index: number) => {
    try {
      const tweetRef = doc(db, 'tweets', docId);
      await updateDoc(tweetRef, { isPublic: true });
      alert('Tweet added to the Leaderboard!');
    } catch (error) {
      console.error("Error making public:", error);
    }
  };

  const exportToPNG = async (index: number) => {
    const element = tweetRefs.current[index];
    if (!element) return;
    
    setDownloadingIndex(index);
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `viral-tweet-${index + 1}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to export to PNG", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 flex items-center gap-2">
          <Zap className="text-primary" /> Viral Tweet Generator
        </h1>
        <p className="text-white/60">Generate 5 high-performing variations of your idea.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
        {/* Input Section */}
        <Card className="bg-white/5 border-white/10 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Tweet Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Topic / Idea <span className="text-red-500">*</span></label>
              <Textarea 
                placeholder="e.g., Lessons from freelancing, AI startup advice..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                      tone === t 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Goal (Optional)</label>
              <Input 
                placeholder="e.g., Get newsletter signups, spark debate..." 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button 
              onClick={handleGenerate} 
              disabled={generating || (!isPro && tweetsLeft <= 0)}
              className="w-full bg-primary hover:bg-primary/90 text-white neon-border"
            >
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Tweets</>
              )}
            </Button>
            
            {!isPro && (
              <p className="text-center text-xs text-white/50 mt-2">
                {tweetsLeft} free generations remaining this month.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {results.length === 0 && !generating && (
            <div className="h-full min-h-[400px] rounded-xl border border-white/10 border-dashed flex flex-col items-center justify-center text-white/40 p-8 text-center">
              <Zap className="w-12 h-12 mb-4 opacity-20" />
              <p>Your viral tweets will appear here.</p>
              <p className="text-sm mt-2">Fill out the parameters and hit generate.</p>
            </div>
          )}

          {generating && (
            <div className="h-full min-h-[400px] rounded-xl border border-white/10 flex flex-col items-center justify-center text-white/60 p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Analyzing viral hooks and crafting tweets...</p>
            </div>
          )}

          {results.map((res, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                ref={(el) => { tweetRefs.current[idx] = el; }}
                className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors relative overflow-hidden group backdrop-blur-md"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                        res.score >= 90 ? 'bg-green-500/20 text-green-400' :
                        res.score >= 75 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        Score: {res.score}
                      </div>
                      <div className={`text-xs ${res.tweet.length > 280 ? 'text-red-400' : 'text-white/40'}`}>
                        {res.tweet.length}/280
                      </div>
                    </div>
                    <div className="flex items-center gap-2" data-html2canvas-ignore>
                      {res.docId && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => makePublic(res.docId!, idx)}
                          className="text-white/60 hover:text-primary hover:bg-primary/10 h-8"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => exportToPNG(idx)}
                        disabled={downloadingIndex === idx}
                        className="text-white/60 hover:text-white hover:bg-white/10 h-8"
                      >
                        {downloadingIndex === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="ml-2">PNG</span>
                      </Button>
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
                  </div>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-lg font-medium">{res.tweet}</p>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 opacity-50">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-xs font-display font-bold tracking-tight">ViralTweetLab</span>
                    </div>
                    {!isPro && (
                      <p className="text-xs text-white/30 italic" data-html2canvas-ignore>
                        * Free plan includes watermark when copied.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
