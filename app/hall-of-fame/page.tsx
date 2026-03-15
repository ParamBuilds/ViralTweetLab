'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Loader2, User } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  totalTweets: number;
  lastActive: string;
}

export default function HallOfFame() {
  const [leaders, setLeaders] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'public_profiles'),
          orderBy('totalTweets', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as PublicProfile);
        setLeaders(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="text-white/40 font-bold w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Award className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Hall of Fame</h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          The most prolific creators on ViralTweetLab. See who&apos;s generating the most viral content.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <Card className="bg-white/5 border-white/10 text-center py-12">
          <CardContent>
            <p className="text-white/60">No data available yet. Start generating tweets to get on the board!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaders.map((profile, index) => (
            <motion.div
              key={profile.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-white/5 border-white/10 overflow-hidden transition-all hover:bg-white/10 ${index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
                <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                  <div className="flex items-center justify-center w-10">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0 relative flex items-center justify-center">
                    {profile.photoURL ? (
                      <Image 
                        src={profile.photoURL} 
                        alt={profile.displayName} 
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white/50" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{profile.displayName}</h3>
                    <p className="text-sm text-white/40 truncate">
                      Active {new Date(profile.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-primary">
                      {profile.totalTweets}
                    </div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">
                      Tweets
                    </div>
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
