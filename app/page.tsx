'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, PenTool, TrendingUp, Layers, CheckCircle2, MessageCircle, Star, HelpCircle } from 'lucide-react';
import { useAuth } from '@/components/firebase-provider';
import { InteractiveDemo } from '@/components/interactive-demo';

export default function Home() {
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full py-24 lg:py-32 flex flex-col items-center text-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
            Write Tweets That <span className="text-primary neon-text">Go Viral.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto">
            Generate high-performing tweets in seconds. Optimized for engagement, hooks, and growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button size="lg" onClick={signInWithGoogle} className="text-lg px-8 py-6 rounded-full w-full sm:w-auto">
                  Start Free
                </Button>
                <Button size="lg" variant="glass" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto">
                  View Examples
                </Button>
              </>
            )}
          </div>
          
          <InteractiveDemo />
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="w-full py-12 border-y border-white/5 bg-black/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-white/40 font-medium uppercase tracking-widest mb-8">Trusted by creators at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            {['Stripe', 'Vercel', 'Linear', 'Notion', 'OpenAI'].map((brand, i) => (
              <div key={i} className="text-xl md:text-2xl font-display font-bold text-white/80">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 bg-black/40 border-y border-white/5 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need to grow</h2>
            <p className="text-white/60 text-lg">Powered by advanced AI trained on thousands of viral tweets.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Viral Tweet Generator', desc: 'Stop the scroll with proven hook frameworks.', icon: Zap },
              { title: 'TrendHijack AI', desc: 'Detect trending conversations and join them intelligently.', icon: TrendingUp },
              { title: 'Thread Builder', desc: 'Turn single ideas into engaging threads.', icon: Layers },
              { title: 'Virality Analyzer', desc: 'Score your tweets before you post them.', icon: Star },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="h-full"
              >
                <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-white/60 text-base">
                      {feature.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="w-full py-24 bg-black/40 border-y border-white/5 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">See the results</h2>
            <p className="text-white/60 text-lg">Real tweets generated by ViralTweetLab.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                tweet: "Most AI startups are just expensive UI wrappers for OpenAI. If you want to survive the next 2 years, stop selling 'AI features' and start solving 'workflow pain.' Your moat isn't the model; it's the proprietary data you own.",
                score: 98,
                hashtags: ['#Startups', '#AI']
              },
              {
                tweet: "Unpopular opinion: You don't need a co-founder. You need a paying customer. Stop looking for someone to share the equity with and start looking for someone to share their wallet with.",
                score: 95,
                hashtags: ['#IndieHackers', '#SaaS']
              },
              {
                tweet: "I spent 3 years building a product nobody wanted. Then I spent 3 days building a product people begged to pay for. The difference? I stopped coding and started listening.",
                score: 92,
                hashtags: ['#BuildInPublic', '#Entrepreneurship']
              }
            ].map((example, i) => (
              <Card key={i} className="bg-white/5 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-500" />
                <CardContent className="p-6">
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary w-fit mb-4">
                    Virality Score: {example.score}/100
                  </div>
                  <p className="text-white/90 leading-relaxed mb-4">{example.tweet}</p>
                  <div className="flex gap-2">
                    {example.hashtags.map((tag, j) => (
                      <span key={j} className="text-white/40 text-sm">{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-white/60 text-lg">Everything you need to know about ViralTweetLab.</p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: "Do I need a Twitter account to use this?",
                a: "No, you can generate tweets without linking your Twitter account. You simply copy and paste the generated tweets into X."
              },
              {
                q: "Are the tweets original?",
                a: "Yes! Our AI engine generates completely original content based on your specific inputs, tone, and goals. It doesn't just use static templates."
              },
              {
                q: "What is the TrendHijack AI?",
                a: "TrendHijack AI is a Pro feature that analyzes current trending topics on X and automatically generates highly engaging tweets that allow you to join those conversations naturally."
              },
              {
                q: "Can I cancel my Pro subscription?",
                a: "Yes, you can cancel your Pro subscription at any time from your dashboard settings."
              }
            ].map((faq, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60 pl-8">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/60 text-lg">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-white/5 border-white/10 relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold mt-4">₹0<span className="text-lg text-white/50 font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {['5 tweets per month', 'Basic tweet generator', 'Standard hooks', 'Community support'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8" variant="glass" onClick={!user ? signInWithGoogle : undefined}>
                  {user ? 'Current Plan' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-primary/10 border-primary/30 relative overflow-hidden neon-border">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Pro</CardTitle>
                <div className="text-4xl font-bold mt-4">₹299<span className="text-lg text-white/50 font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {['Unlimited tweets', 'Thread generator', 'Virality scoring', 'Tweet improver', 'Advanced hook templates'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 bg-primary hover:bg-primary/90 text-white">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
