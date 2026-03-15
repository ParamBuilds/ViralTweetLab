'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/firebase-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Layers, TrendingUp, Zap, Crown, Loader2, Hash } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  const isPro = userData?.subscriptionTier === 'pro';
  const tweetsLeft = isPro ? 'Unlimited' : Math.max(0, 5 - (userData?.tweetsGenerated || 0));

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Welcome back!</h1>
          <p className="text-white/60">Ready to write some viral tweets today?</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-white/60">Plan:</span>
            <span className={`font-bold ${isPro ? 'text-primary' : 'text-white'}`}>
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-white/60">Tweets Left:</span>
            <span className="font-bold text-white">{tweetsLeft}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/viral-tweet-generator" className="block h-full">
          <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Tweet Generator</CardTitle>
              <CardDescription className="text-white/60">
                Generate 5 viral tweet variations from a single topic.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={isPro ? "/twitter-thread-generator" : "#"} className="block h-full">
          <Card className={`h-full bg-white/5 border-white/10 transition-colors ${isPro ? 'hover:bg-white/10 cursor-pointer group' : 'opacity-70 cursor-not-allowed relative'}`}>
            {!isPro && (
              <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                PRO
              </div>
            )}
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Thread Builder</CardTitle>
              <CardDescription className="text-white/60">
                Turn a single idea into a highly engaging Twitter thread.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={isPro ? "/tweet-optimizer" : "#"} className="block h-full">
          <Card className={`h-full bg-white/5 border-white/10 transition-colors ${isPro ? 'hover:bg-white/10 cursor-pointer group' : 'opacity-70 cursor-not-allowed relative'}`}>
            {!isPro && (
              <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                PRO
              </div>
            )}
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PenTool className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Tweet Improver</CardTitle>
              <CardDescription className="text-white/60">
                Paste an existing tweet and let AI optimize it for virality.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={isPro ? "/trend-hijack" : "#"} className="block h-full">
          <Card className={`h-full bg-white/5 border-white/10 transition-colors ${isPro ? 'hover:bg-white/10 cursor-pointer group' : 'opacity-70 cursor-not-allowed relative'}`}>
            {!isPro && (
              <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                PRO
              </div>
            )}
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>TrendHijack AI</CardTitle>
              <CardDescription className="text-white/60">
                Detect trending conversations and generate tweets to join them.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={isPro ? "/hashtag-optimizer" : "#"} className="block h-full">
          <Card className={`h-full bg-white/5 border-white/10 transition-colors ${isPro ? 'hover:bg-white/10 cursor-pointer group' : 'opacity-70 cursor-not-allowed relative'}`}>
            {!isPro && (
              <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                PRO
              </div>
            )}
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Hash className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Hashtag Optimizer</CardTitle>
              <CardDescription className="text-white/60">
                Get AI-curated hashtags to maximize your tweet's reach.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
