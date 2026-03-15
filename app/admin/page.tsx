'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/firebase-provider';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, MessageSquare, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserData {
  uid: string;
  email: string;
  role: string;
  subscriptionTier: string;
  tweetsGenerated: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      const isAdmin = userData?.role === 'admin' || user?.email === 'real2render@gmail.com';
      if (!user || !isAdmin) {
        router.push('/');
      } else {
        fetchUsers();
      }
    }
  }, [user, userData, loading, router]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push(doc.data() as UserData);
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setFetching(false);
    }
  };

  const toggleProStatus = async (userId: string, currentTier: string) => {
    try {
      const newTier = currentTier === 'pro' ? 'free' : 'pro';
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscriptionTier: newTier
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.uid === userId ? { ...u, subscriptionTier: newTier } : u
      ));
    } catch (error) {
      console.error("Error updating user tier:", error);
      alert("Failed to update user subscription tier.");
    }
  };

  const isAdmin = userData?.role === 'admin' || user?.email === 'real2render@gmail.com';
  if (loading || fetching || !isAdmin) {
    return <div className="flex-1 flex items-center justify-center">Loading Admin Dashboard...</div>;
  }

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.subscriptionTier === 'pro').length;
  const totalTweets = users.reduce((acc, u) => acc + (u.tweetsGenerated || 0), 0);
  const monthlyRevenue = proUsers * 299;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/60">Overview of ViralTweetLab metrics.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Total Users</CardTitle>
            <Users className="w-4 h-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Pro Subscribers</CardTitle>
            <CreditCard className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{proUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Monthly Revenue (₹)</CardTitle>
            <DollarSign className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">₹{monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Total Tweets Generated</CardTitle>
            <MessageSquare className="w-4 h-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTweets}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-display font-bold mb-4">Recent Users</h2>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/60 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Tweets Generated</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((u) => (
                <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.subscriptionTier === 'pro' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                      {u.subscriptionTier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{u.tweetsGenerated || 0}</td>
                  <td className="px-6 py-4 text-white/60">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleProStatus(u.uid, u.subscriptionTier)}
                      className={`border-white/10 ${u.subscriptionTier === 'pro' ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'}`}
                    >
                      {u.subscriptionTier === 'pro' ? (
                        <><XCircle className="w-4 h-4 mr-2" /> Revoke Pro</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Grant Pro</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
