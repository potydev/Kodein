import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CodeEditor from '@/components/CodeEditor';
import Quiz from '@/components/Quiz';
import { addXP, hasCompletedLesson } from '@/lib/xp';
import { devLog, devError, devWarn } from '@/lib/logger';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Play,
  BookOpen,
  Zap
} from 'lucide-react';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  code_template: string | null;
  lesson_order: number;
  xp_reward: number;
}

interface QuizData {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ level: number; xp_points: number } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchLesson();
      fetchQuizzes();
      checkProgress();
      fetchProfile();
    }
  }, [id, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('level, xp_points')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const fetchLesson = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setLesson(data);
      // Fetch all lessons in same course
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', data.course_id)
        .order('lesson_order', { ascending: true });
      if (lessons) setAllLessons(lessons);
    }
    setLoading(false);
  };

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', id);
    
    if (data) {
      setQuizzes(data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      })));
    }
  };

  const checkProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('lesson_id', id)
      .maybeSingle();
    
    if (data) setIsCompleted(data.completed);
  };

  const handleComplete = async () => {
    try {
      devLog('=== handleComplete CALLED ===', { 
        hasUser: !!user, 
        hasLesson: !!lesson,
        timestamp: new Date().toISOString()
      });

      if (!user || !lesson) {
        devError('Cannot complete lesson: missing user or lesson', { user: !!user, lesson: !!lesson });
        toast({
          title: 'Error',
          description: 'User atau lesson tidak ditemukan',
          variant: 'destructive',
        });
        return;
      }

      devLog('Starting lesson completion:', { 
        xpReward: lesson.xp_reward,
        lessonTitle: lesson.title
      });

    // STEP 1: Check if already completed to prevent duplicate XP
    const alreadyCompleted = await hasCompletedLesson(user.id, lesson.id);
    devLog('STEP 1: Check completion status:', { alreadyCompleted });
    
    if (alreadyCompleted) {
      // Check if XP was already given for this specific lesson
      // We can't check lesson-specific XP, so we'll check if user has any XP at all
      // If they don't have XP, we should give it
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('xp_points, level')
        .eq('id', user.id)
        .single();
      
      const currentXP = currentProfile?.xp_points || 0;
      const expectedMinXP = lesson.xp_reward; // At least should have this lesson's XP
      
      devLog('Lesson already completed. Profile XP check:', { 
        currentXP, 
        lessonXP: lesson.xp_reward,
        expectedMinXP,
        hasXP: currentXP > 0,
        shouldHaveXP: currentXP >= expectedMinXP
      });
      
      setIsCompleted(true);
      
      // If user has no XP or less XP than expected, give XP now (fix for missing XP bug)
      if (currentXP < expectedMinXP) {
        devWarn('XP missing for completed lesson!', { currentXP, expectedMinXP });
        devLog('Will add XP now to fix missing XP bug...');
        toast({
          title: 'Memperbaiki XP',
          description: `Progress sudah tersimpan, tapi XP belum diberikan. Menambahkan ${lesson.xp_reward} XP sekarang...`,
          variant: 'default',
        });
        // Continue to add XP (don't return)
      } else {
        // XP already given, skip
        toast({
          title: 'Lesson Sudah Diselesaikan',
          description: 'Kamu sudah menyelesaikan lesson ini sebelumnya. XP sudah diberikan.',
        });
        return;
      }
    }

    // STEP 2: Save progress first (mark as completed)
    devLog('STEP 2: Saving progress...');
    
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        course_id: lesson.course_id,
        lesson_id: lesson.id,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' })
      .select();

    if (progressError) {
      devError('Error saving progress:', {
        message: progressError.message,
        code: progressError.code,
        details: progressError.details,
        hint: progressError.hint
      });
      toast({
        title: 'Error',
        description: 'Gagal menyimpan progress: ' + progressError.message,
        variant: 'destructive',
      });
      return;
    }

    devLog('Progress saved successfully');

    // STEP 3: Add XP immediately after saving progress
    // No need for double-check here because we just saved the progress ourselves
    // The double-check was causing false race condition detection
    devLog('STEP 3: Adding XP...', { xpAmount: lesson.xp_reward });
    const xpResult = await addXP(user.id, lesson.xp_reward);

    devLog('XP result:', { success: xpResult.success, newXP: xpResult.newXP, newLevel: xpResult.newLevel });

    if (xpResult.success) {
      devLog('XP added successfully');
      
      // Verify XP was actually saved by fetching from database
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('xp_points, level')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        devError('Error verifying XP after update:', verifyError);
      } else if (verifyProfile) {
        const actualXP = verifyProfile.xp_points || 0;
        const actualLevel = verifyProfile.level || 1;
        devLog('XP verification:', {
          expected: { xp: xpResult.newXP, level: xpResult.newLevel },
          actual: { xp: actualXP, level: actualLevel }
        });

        if (actualXP !== xpResult.newXP) {
          devError('XP mismatch!', { expected: xpResult.newXP, got: actualXP });
          toast({
            title: 'Peringatan',
            description: `XP mungkin tidak tersimpan dengan benar. Silakan refresh halaman.`,
            variant: 'destructive',
          });
        }
      }

      setIsCompleted(true);
      
      // Get current level before XP was added
      const currentLevel = profile?.level || 1;
      const levelUpMsg = xpResult.newLevel > currentLevel 
        ? ` Level Up! Sekarang Level ${xpResult.newLevel}! 🎉` 
        : '';
      
      toast({
        title: 'Lesson Selesai! 🎉',
        description: `Kamu mendapatkan ${lesson.xp_reward} XP${levelUpMsg}`,
      });
      
      // Update local profile state immediately
      setProfile({
        level: xpResult.newLevel,
        xp_points: xpResult.newXP,
      });
      
      // Refresh from database to confirm
      await fetchProfile();
      
      devLog('Lesson completion successful');
    } else {
      devError('Failed to add XP:', { error: xpResult.error });
      
      // Progress was saved, but XP failed - notify user with detailed error
      setIsCompleted(true); // Mark as completed since progress is saved
      toast({
        title: 'Progress Disimpan',
        description: `Progress berhasil disimpan, tapi gagal menambahkan XP. Error: ${xpResult.error || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
    } catch (error) {
      devError('UNEXPECTED ERROR in handleComplete:', error);
      toast({
        title: 'Error Tidak Terduga',
        description: 'Terjadi kesalahan: ' + (error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    }
  };

  const handleQuizComplete = async (score: number) => {
    const percentage = Math.round((score / quizzes.length) * 100);
    devLog('Quiz completed:', { score, totalQuizzes: quizzes.length, percentage });
    setQuizCompleted(true);
    
    // Allow completion if score is at least 70% (or all correct)
    const minScore = Math.ceil(quizzes.length * 0.7); // At least 70% correct
    
    if (score >= minScore || score === quizzes.length) {
      devLog('Quiz passed, calling handleComplete...', { score, minScore, percentage });
      await handleComplete();
    } else {
      devLog('Quiz not passed, not completing lesson', { score, minScore, percentage });
      toast({
        title: 'Quiz Belum Sempurna',
        description: `Kamu menjawab ${score} dari ${quizzes.length} pertanyaan dengan benar (${percentage}%). Minimal ${minScore} benar untuk menyelesaikan lesson.`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson Tidak Ditemukan</h2>
          <Link to="/courses">
            <Button variant="hero">Kembali ke Kursus</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <Link 
            to={`/courses/${lesson.course_id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Kursus
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            <span className="font-medium">+{lesson.xp_reward} XP</span>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <BookOpen className="h-4 w-4" />
              Lesson {currentIndex + 1} of {allLessons.length}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{lesson.title}</h1>
            {isCompleted && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 text-success text-sm">
                <Check className="h-4 w-4" />
                Selesai
              </div>
            )}
          </div>

          {/* Content */}
          {lesson.content && (
            <div 
              className="prose prose-invert max-w-none mb-8 p-6 rounded-2xl glass animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          {/* Code Editor */}
          {lesson.code_template && (
            <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold mb-4">Coba Kode</h2>
              <CodeEditor initialCode={lesson.code_template} />
            </div>
          )}

          {/* Quiz */}
          {quizzes.length > 0 && (
            <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-xl font-bold mb-4">Quiz</h2>
              <Quiz quizzes={quizzes} onComplete={handleQuizComplete} />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-border/50 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {prevLesson ? (
              <Link to={`/lesson/${prevLesson.id}`}>
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Sebelumnya
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {!isCompleted && quizzes.length === 0 && (
              <Button 
                variant="hero" 
                onClick={async () => {
                  devLog('Button clicked - calling handleComplete');
                  try {
                    await handleComplete();
                  } catch (error) {
                    devError('Error in handleComplete from button:', error);
                    toast({
                      title: 'Error',
                      description: 'Terjadi kesalahan saat menyelesaikan lesson',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Tandai Selesai
              </Button>
            )}

            {nextLesson ? (
              <Link to={`/lesson/${nextLesson.id}`}>
                <Button variant="hero">
                  Selanjutnya
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link to={`/courses/${lesson.course_id}`}>
                <Button variant="hero">
                  Kembali ke Kursus
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
