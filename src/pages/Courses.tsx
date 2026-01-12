import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Clock, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Course {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  difficulty: string | null;
  total_lessons: number;
}

const Courses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (user) fetchProgress();
  }, [user]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setCourses(data);
    setLoading(false);
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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/20 text-success';
      case 'intermediate': return 'bg-warning/20 text-warning';
      case 'advanced': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return 'Semua Level';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Jelajahi <span className="text-gradient">Kursus</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Pilih kursus dan mulai belajar coding dengan materi interaktif
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kursus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 rounded-2xl glass animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-muted mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const completed = progressMap[course.id] || 0;
              const total = course.total_lessons || 1;
              const progress = (completed / total) * 100;

              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group p-6 rounded-2xl glass card-hover animate-slide-up"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110"
                      style={{ 
                        background: course.color 
                          ? `linear-gradient(135deg, ${course.color}, ${course.color}80)`
                          : 'var(--gradient-primary)'
                      }}
                    >
                      {course.icon || '📚'}
                    </div>
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {getDifficultyLabel(course.difficulty)}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {course.description || 'Pelajari dasar-dasar dan konsep lanjutan'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {total} lesson
                    </div>
                  </div>

                  {user && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <span className="text-sm font-medium text-primary">
                      {progress > 0 ? 'Lanjutkan' : 'Mulai Belajar'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 animate-slide-up">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'Kursus Tidak Ditemukan' : 'Belum Ada Kursus'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Coba gunakan kata kunci yang berbeda' 
                : 'Kursus akan segera tersedia'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
