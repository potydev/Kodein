import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Flame, 
  Trophy, 
  BookOpen, 
  ArrowRight,
  Target,
  Clock,
  Star
} from 'lucide-react';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  xp_points: number;
  streak_days: number;
  level: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  total_lessons: number;
}

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCourses();
      fetchProgress();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setCourses(data);
  };

  const fetchProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_progress')
      .select('course_id, completed')
      .eq('user_id', user.id)
      .eq('completed', true);
    
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((p) => {
        if (p.course_id) {
          map[p.course_id] = (map[p.course_id] || 0) + 1;
        }
      });
      setProgressMap(map);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Learner';
  const xp = profile?.xp_points || 0;
  const streak = profile?.streak_days || 0;
  const level = profile?.level || 1;
  const xpToNextLevel = level * 100;
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel * 100;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Welcome Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Selamat Datang, <span className="text-gradient">{displayName}</span>!
          </h1>
          <p className="text-muted-foreground">Lanjutkan perjalanan coding Anda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl glass animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold">{xp}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </div>

          <div className="p-4 rounded-2xl glass animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/20">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <span className="text-2xl font-bold">{streak}</span>
            </div>
            <p className="text-sm text-muted-foreground">Hari Streak</p>
          </div>

          <div className="p-4 rounded-2xl glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Trophy className="h-5 w-5 text-secondary" />
              </div>
              <span className="text-2xl font-bold">{level}</span>
            </div>
            <p className="text-sm text-muted-foreground">Level</p>
          </div>

          <div className="p-4 rounded-2xl glass animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/20">
                <Target className="h-5 w-5 text-success" />
              </div>
              <span className="text-2xl font-bold">{Object.values(progressMap).reduce((a, b) => a + b, 0)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Lesson Selesai</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="p-6 rounded-2xl glass mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="font-medium">Level {level}</span>
            </div>
            <span className="text-sm text-muted-foreground">{xp % xpToNextLevel}/{xpToNextLevel} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {xpToNextLevel - (xp % xpToNextLevel)} XP lagi untuk mencapai Level {level + 1}
          </p>
        </div>

        {/* Courses Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Kursus Anda</h2>
            <Link to="/courses">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 6).map((course, index) => {
                const completed = progressMap[course.id] || 0;
                const total = course.total_lessons || 1;
                const progress = (completed / total) * 100;

                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="p-6 rounded-2xl glass card-hover animate-slide-up"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: course.color ? `${course.color}20` : 'hsl(var(--primary) / 0.2)' }}
                      >
                        {course.icon || '📚'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{completed}/{total} lesson</span>
                        <span className="text-primary font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-2xl glass text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum Ada Kursus</h3>
              <p className="text-muted-foreground mb-4">Mulai belajar dengan memilih kursus pertama Anda</p>
              <Link to="/courses">
                <Button variant="hero">
                  Jelajahi Kursus
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/courses" className="p-6 rounded-2xl glass card-hover animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Jelajahi Kursus</h3>
                <p className="text-sm text-muted-foreground">Temukan kursus baru untuk dipelajari</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </div>
          </Link>

          <Link to="/forum" className="p-6 rounded-2xl glass card-hover animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-primary">
                <Clock className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Forum Diskusi</h3>
                <p className="text-sm text-muted-foreground">Tanya jawab dengan komunitas</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
