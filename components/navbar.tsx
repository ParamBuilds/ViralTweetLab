'use client';

import Link from 'next/link';
import { useAuth } from './firebase-provider';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export function Navbar() {
  const { user, userData, signInWithGoogle, logout } = useAuth();
  const isAdmin = userData?.role === 'admin' || user?.email === 'real2render@gmail.com';

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-xl tracking-tight neon-text">ViralTweetLab</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/leaderboard" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
            Leaderboard
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="text-white/60 hover:text-white">Admin</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={logout} className="border-white/20 text-white hover:bg-white/10">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={signInWithGoogle} className="bg-primary hover:bg-primary/90 text-white neon-border">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
