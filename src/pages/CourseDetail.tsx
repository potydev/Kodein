import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BookOpen, 
  Check, 
  Lock, 
  Play,
  Trophy,
  Zap
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  difficulty: string | null;
  total_lessons: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  lesson_order: number;
  xp_reward: number;
}

interface UserProgress {
  lesson_id: string;
  completed: boolean;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchLessons();
      if (user) fetchProgress();
    }
  }, [id, user]);

  const fetchCourse = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setCourse(data);
    setLoading(false);
  };

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', id)
      .order('lesson_order', { ascending: true });
    if (data) setLessons(data);
  };

  const fetchProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_progress')
      .select('lesson_id, completed')
      .eq('user_id', user.id)
      .eq('course_id', id);
    
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach((p) => {
        map[p.lesson_id] = p.completed;
      });
      setProgress(map);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Kursus Tidak Ditemukan</h2>
          <Link to="/courses">
            <Button variant="hero">Kembali ke Kursus</Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const totalXP = lessons.reduce((sum, l) => sum + (progress[l.id] ? l.xp_reward : 0), 0);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link 
          to="/courses" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Kursus
        </Link>

        {/* Course Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 animate-slide-up">
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                style={{ 
                  background: course.color 
                    ? `linear-gradient(135deg, ${course.color}, ${course.color}80)`
                    : 'var(--gradient-primary)'
                }}
              >
                {course.icon || '📚'}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{course.title}</h1>
                <p className="text-muted-foreground text-lg">{course.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Badge className="bg-primary/20 text-primary">
                {course.difficulty === 'beginner' ? 'Pemula' : 
                 course.difficulty === 'intermediate' ? 'Menengah' : 'Lanjutan'}
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                {lessons.length} lesson
              </div>
              <div className="flex items-center gap-2 text-accent">
                <Zap className="h-4 w-4" />
                {lessons.reduce((sum, l) => sum + l.xp_reward, 0)} XP total
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="p-6 rounded-2xl glass animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-semibold mb-4">Progress Anda</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{completedCount}/{lessons.length} selesai</span>
                <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                <span className="text-sm">XP Diperoleh</span>
              </div>
              <span className="font-bold text-accent">{totalXP}</span>
            </div>
            {lessons.length > 0 && (
              <Link to={user ? `/lesson/${lessons[0].id}` : '/auth'}>
                <Button variant="hero" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  {progressPercent > 0 ? 'Lanjutkan' : 'Mulai Belajar'}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Lessons List */}
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Daftar Materi</h2>
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const isCompleted = progress[lesson.id];
              const isLocked = !user && index > 0;

              return (
                <Link
                  key={lesson.id}
                  to={user ? `/lesson/${lesson.id}` : '/auth'}
                  className={`flex items-center gap-4 p-4 rounded-xl glass transition-all hover:scale-[1.01] animate-slide-up ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ animationDelay: `${0.05 * index}s` }}
                  onClick={(e) => isLocked && e.preventDefault()}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    isCompleted 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" />
                      +{lesson.xp_reward} XP
                    </div>
                  </div>
                  {isLocked ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : isCompleted ? (
                    <Badge className="bg-success/20 text-success">Selesai</Badge>
                  ) : (
                    <Play className="h-5 w-5 text-primary" />
                  )}
                </Link>
              );
            })}
          </div>

          {lessons.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Materi akan segera tersedia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
