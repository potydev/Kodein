import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  Award, 
  Zap, 
  Flame,
  Crown,
  Star
} from 'lucide-react';
import { devLog, devError } from '@/lib/logger';

interface LeaderboardUser {
  id: string;
  username: string | null;
  full_name: string | null;
  xp_points: number | null;
  level: number | null;
  streak_days: number | null;
  avatar_url: string | null;
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 10 seconds to show updated rankings
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, xp_points, level, streak_days, avatar_url')
        .order('xp_points', { ascending: false })
        .limit(100); // Top 100 users

      if (error) {
        devError('Error fetching leaderboard:', error);
        return;
      }

      if (data) {
        // Filter out users with null xp_points and ensure they have at least 0 XP
        const validUsers = data
          .filter(u => u.xp_points !== null && u.xp_points >= 0)
          .map(u => ({
            ...u,
            xp_points: u.xp_points || 0,
            level: u.level || 1,
            streak_days: u.streak_days || 0,
          }));
        
        setUsers(validUsers);
        devLog('Leaderboard fetched:', { count: validUsers.length });
      }
    } catch (error) {
      devError('Exception fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user: LeaderboardUser) => {
    return user.full_name || user.username || 'Anonymous';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-amber-400 to-amber-600';
    return 'from-primary/20 to-primary/40';
  };

  const currentUserRank = user 
    ? users.findIndex(u => u.id === user.id) + 1 
    : null;

  const topThree = users.slice(0, 3);
  const restUsers = users.slice(3);

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-muted-foreground">Memuat leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-accent" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Lihat siapa yang memiliki XP tertinggi di Kodein
          </p>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRankColor(2)} flex items-center justify-center mb-3 shadow-lg`}>
                  <Medal className="h-10 w-10 text-white" />
                </div>
                <Avatar className="h-16 w-16 mb-2 border-2 border-gray-300">
                  <AvatarImage src={topThree[1].avatar_url || undefined} />
                  <AvatarFallback className="bg-gray-300 text-gray-700">
                    {getDisplayName(topThree[1]).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-sm mb-1 truncate w-full text-center">
                  {getDisplayName(topThree[1])}
                </h3>
                <div className="flex items-center gap-1 text-primary mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-bold">{topThree[1].xp_points}</span>
                </div>
                <div className="text-xs text-muted-foreground">Level {topThree[1].level}</div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRankColor(1)} flex items-center justify-center mb-3 shadow-xl`}>
                  <Crown className="h-12 w-12 text-white" />
                </div>
                <Avatar className="h-20 w-20 mb-2 border-4 border-yellow-400 shadow-lg">
                  <AvatarImage src={topThree[0].avatar_url || undefined} />
                  <AvatarFallback className="bg-yellow-400 text-yellow-900 font-bold">
                    {getDisplayName(topThree[0]).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-base mb-1 truncate w-full text-center">
                  {getDisplayName(topThree[0])}
                </h3>
                <div className="flex items-center gap-1 text-primary mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-base font-bold">{topThree[0].xp_points}</span>
                </div>
                <div className="text-sm text-muted-foreground">Level {topThree[0].level}</div>
                {topThree[0].streak_days && topThree[0].streak_days > 0 && (
                  <div className="flex items-center gap-1 text-accent mt-1">
                    <Flame className="h-3 w-3" />
                    <span className="text-xs">{topThree[0].streak_days} hari</span>
                  </div>
                )}
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.25s' }}>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRankColor(3)} flex items-center justify-center mb-3 shadow-lg`}>
                  <Award className="h-10 w-10 text-white" />
                </div>
                <Avatar className="h-16 w-16 mb-2 border-2 border-amber-600">
                  <AvatarImage src={topThree[2].avatar_url || undefined} />
                  <AvatarFallback className="bg-amber-600 text-white">
                    {getDisplayName(topThree[2]).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-sm mb-1 truncate w-full text-center">
                  {getDisplayName(topThree[2])}
                </h3>
                <div className="flex items-center gap-1 text-primary mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-bold">{topThree[2].xp_points}</span>
                </div>
                <div className="text-xs text-muted-foreground">Level {topThree[2].level}</div>
              </div>
            )}
          </div>
        )}

        {/* Current User Rank Card */}
        {currentUserRank && currentUserRank > 3 && user && (
          <div className="mb-6 p-4 rounded-2xl glass border-2 border-primary animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-primary">#{currentUserRank}</div>
                <div>
                  <div className="font-semibold">Posisi Anda</div>
                  <div className="text-sm text-muted-foreground">
                    {users.find(u => u.id === user.id)?.xp_points || 0} XP • Level {users.find(u => u.id === user.id)?.level || 1}
                  </div>
                </div>
              </div>
              <Star className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {restUsers.map((userData, index) => {
            const rank = index + 4;
            const isCurrentUser = user && userData.id === user.id;
            
            return (
              <div
                key={userData.id}
                className={`p-4 rounded-xl glass card-hover flex items-center gap-4 ${
                  isCurrentUser ? 'border-2 border-primary bg-primary/5' : ''
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userData.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getDisplayName(userData).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {getDisplayName(userData)}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary">(Anda)</span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{userData.xp_points} XP</span>
                    </div>
                    <span>Level {userData.level}</span>
                    {userData.streak_days && userData.streak_days > 0 && (
                      <div className="flex items-center gap-1 text-accent">
                        <Flame className="h-3 w-3" />
                        <span>{userData.streak_days} hari</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="p-12 rounded-2xl glass text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
            <p className="text-muted-foreground">
              Mulai belajar untuk muncul di leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

