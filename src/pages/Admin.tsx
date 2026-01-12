import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/use-admin';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  difficulty: string | null;
  total_lessons: number | null;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  code_template: string | null;
  lesson_order: number | null;
  xp_reward: number | null;
}

interface Quiz {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

const Admin: React.FC = () => {
  const { user, loading: authLoading, role } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Course form
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    difficulty: 'beginner',
  });
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Lesson form
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    code_template: '',
    lesson_order: 0,
    xp_reward: 10,
  });
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Quiz form
  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
  });
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // If no user, redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Wait for role to be fetched (role might be null or undefined initially)
    if (role === null || role === undefined) {
      devLog('Waiting for role to be fetched...');
      return;
    }
    
    // Check if user is admin
    devLog('Admin check - role:', role, 'isAdmin:', isAdmin);
    
    if (role !== 'admin') {
      devWarn('Access denied - user is not admin. Role:', role);
      navigate('/dashboard');
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki akses ke halaman admin. Role Anda: ' + (role || 'tidak diketahui'),
        variant: 'destructive',
      });
      return;
    }
    
    devLog('Admin access granted!');
  }, [user, role, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedLesson) {
      fetchQuizzes(selectedLesson);
    }
  }, [selectedLesson]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      devError('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat kursus',
        variant: 'destructive',
      });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const fetchLessons = async (courseId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('lesson_order', { ascending: true });
    
    if (error) {
      devError('Error fetching lessons:', error);
    } else {
      setLessons(data || []);
    }
  };

  const fetchQuizzes = async (lessonId: string) => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId);
    
    if (error) {
      devError('Error fetching quizzes:', error);
    } else {
      const formattedQuizzes = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      }));
      setQuizzes(formattedQuizzes);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title) {
      toast({
        title: 'Error',
        description: 'Judul kursus wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('courses')
      .insert([{
        title: courseForm.title,
        description: courseForm.description || null,
        icon: courseForm.icon || null,
        color: courseForm.color,
        difficulty: courseForm.difficulty,
        total_lessons: 0,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat kursus',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Kursus berhasil dibuat',
      });
      setIsCourseDialogOpen(false);
      setCourseForm({ title: '', description: '', icon: '', color: '#3B82F6', difficulty: 'beginner' });
      fetchCourses();
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse || !courseForm.title) {
      return;
    }

    const { error } = await supabase
      .from('courses')
      .update({
        title: courseForm.title,
        description: courseForm.description || null,
        icon: courseForm.icon || null,
        color: courseForm.color,
        difficulty: courseForm.difficulty,
      })
      .eq('id', editingCourse.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupdate kursus',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Kursus berhasil diupdate',
      });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      setCourseForm({ title: '', description: '', icon: '', color: '#3B82F6', difficulty: 'beginner' });
      fetchCourses();
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kursus ini? Semua lesson dan quiz terkait juga akan dihapus.')) {
      return;
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus kursus',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Kursus berhasil dihapus',
      });
      fetchCourses();
      if (selectedCourse === courseId) {
        setSelectedCourse(null);
        setLessons([]);
      }
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedCourse || !lessonForm.title) {
      toast({
        title: 'Error',
        description: 'Pilih kursus dan isi judul lesson',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .insert([{
        course_id: selectedCourse,
        title: lessonForm.title,
        content: lessonForm.content || null,
        code_template: lessonForm.code_template || null,
        lesson_order: lessonForm.lesson_order,
        xp_reward: lessonForm.xp_reward,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat lesson',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Lesson berhasil dibuat',
      });
      setIsLessonDialogOpen(false);
      setLessonForm({ title: '', content: '', code_template: '', lesson_order: 0, xp_reward: 10 });
      fetchLessons(selectedCourse);
      // Update course total_lessons
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', selectedCourse);
      await supabase
        .from('courses')
        .update({ total_lessons: count || 0 })
        .eq('id', selectedCourse);
      fetchCourses();
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !lessonForm.title) {
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .update({
        title: lessonForm.title,
        content: lessonForm.content || null,
        code_template: lessonForm.code_template || null,
        lesson_order: lessonForm.lesson_order,
        xp_reward: lessonForm.xp_reward,
      })
      .eq('id', editingLesson.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupdate lesson',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Lesson berhasil diupdate',
      });
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
      setLessonForm({ title: '', content: '', code_template: '', lesson_order: 0, xp_reward: 10 });
      if (selectedCourse) fetchLessons(selectedCourse);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lesson ini? Semua quiz terkait juga akan dihapus.')) {
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus lesson',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Lesson berhasil dihapus',
      });
      if (selectedCourse) {
        fetchLessons(selectedCourse);
        const { count } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', selectedCourse);
        await supabase
          .from('courses')
          .update({ total_lessons: count || 0 })
          .eq('id', selectedCourse);
        fetchCourses();
      }
      if (selectedLesson === lessonId) {
        setSelectedLesson(null);
        setQuizzes([]);
      }
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedLesson || !quizForm.question || quizForm.options.filter(o => o).length < 2) {
      toast({
        title: 'Error',
        description: 'Pilih lesson, isi pertanyaan, dan minimal 2 opsi',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('quizzes')
      .insert([{
        lesson_id: selectedLesson,
        question: quizForm.question,
        options: quizForm.options.filter(o => o),
        correct_answer: quizForm.correct_answer,
        explanation: quizForm.explanation || null,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat quiz',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Quiz berhasil dibuat',
      });
      setIsQuizDialogOpen(false);
      setQuizForm({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });
      if (selectedLesson) fetchQuizzes(selectedLesson);
    }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !quizForm.question) {
      return;
    }

    const { error } = await supabase
      .from('quizzes')
      .update({
        question: quizForm.question,
        options: quizForm.options.filter(o => o),
        correct_answer: quizForm.correct_answer,
        explanation: quizForm.explanation || null,
      })
      .eq('id', editingQuiz.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupdate quiz',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Quiz berhasil diupdate',
      });
      setIsQuizDialogOpen(false);
      setEditingQuiz(null);
      setQuizForm({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });
      if (selectedLesson) fetchQuizzes(selectedLesson);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus quiz ini?')) {
      return;
    }

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus quiz',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Quiz berhasil dihapus',
      });
      if (selectedLesson) fetchQuizzes(selectedLesson);
    }
  };

  const openCourseDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description || '',
        icon: course.icon || '',
        color: course.color || '#3B82F6',
        difficulty: course.difficulty || 'beginner',
      });
    } else {
      setEditingCourse(null);
      setCourseForm({ title: '', description: '', icon: '', color: '#3B82F6', difficulty: 'beginner' });
    }
    setIsCourseDialogOpen(true);
  };

  const openLessonDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        content: lesson.content || '',
        code_template: lesson.code_template || '',
        lesson_order: lesson.lesson_order || 0,
        xp_reward: lesson.xp_reward || 10,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', content: '', code_template: '', lesson_order: 0, xp_reward: 10 });
    }
    setIsLessonDialogOpen(true);
  };

  const openQuizDialog = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        question: quiz.question,
        options: [...quiz.options, '', '', '', ''].slice(0, 4),
        correct_answer: quiz.correct_answer,
        explanation: quiz.explanation || '',
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });
    }
    setIsQuizDialogOpen(true);
  };

  if (authLoading || loading || role === null || role === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Memuat...</div>
          <div className="text-sm text-muted-foreground">
            {role === null && 'Mengecek akses admin...'}
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground mb-4">
            Anda tidak memiliki akses ke halaman admin
          </p>
          <p className="text-sm text-muted-foreground">
            Role Anda: {role || 'tidak diketahui'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Kelola kursus, lesson, dan quiz</p>
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Kursus
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lesson
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Kursus</h2>
              <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openCourseDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kursus
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCourse ? 'Edit Kursus' : 'Tambah Kursus'}</DialogTitle>
                    <DialogDescription>
                      {editingCourse ? 'Edit informasi kursus' : 'Buat kursus baru'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="course-title">Judul *</Label>
                      <Input
                        id="course-title"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        placeholder="Contoh: Python untuk Pemula"
                      />
                    </div>
                    <div>
                      <Label htmlFor="course-description">Deskripsi</Label>
                      <Textarea
                        id="course-description"
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        placeholder="Deskripsi kursus..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="course-icon">Icon (Emoji)</Label>
                        <Input
                          id="course-icon"
                          value={courseForm.icon}
                          onChange={(e) => setCourseForm({ ...courseForm, icon: e.target.value })}
                          placeholder="🐍"
                        />
                      </div>
                      <div>
                        <Label htmlFor="course-color">Warna</Label>
                        <Input
                          id="course-color"
                          type="color"
                          value={courseForm.color}
                          onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="course-difficulty">Tingkat Kesulitan</Label>
                      <select
                        id="course-difficulty"
                        value={courseForm.difficulty}
                        onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background"
                      >
                        <option value="beginner">Pemula</option>
                        <option value="intermediate">Menengah</option>
                        <option value="advanced">Lanjutan</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                      <Button onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                        <Save className="h-4 w-4 mr-2" />
                        {editingCourse ? 'Update' : 'Simpan'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{course.title}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCourseDialog(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {course.total_lessons || 0} Lesson
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Lesson</h2>
              <div className="flex gap-2">
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value || null);
                    setSelectedLesson(null);
                    setLessons([]);
                    setQuizzes([]);
                  }}
                  className="px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="">Pilih Kursus</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openLessonDialog()} disabled={!selectedCourse}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Lesson
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Tambah Lesson'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="lesson-title">Judul *</Label>
                        <Input
                          id="lesson-title"
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lesson-content">Konten</Label>
                        <Textarea
                          id="lesson-content"
                          value={lessonForm.content}
                          onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                          rows={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lesson-code">Code Template</Label>
                        <Textarea
                          id="lesson-code"
                          value={lessonForm.code_template}
                          onChange={(e) => setLessonForm({ ...lessonForm, code_template: e.target.value })}
                          rows={4}
                          className="font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="lesson-order">Urutan</Label>
                          <Input
                            id="lesson-order"
                            type="number"
                            value={lessonForm.lesson_order}
                            onChange={(e) => setLessonForm({ ...lessonForm, lesson_order: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lesson-xp">XP Reward</Label>
                          <Input
                            id="lesson-xp"
                            type="number"
                            value={lessonForm.xp_reward}
                            onChange={(e) => setLessonForm({ ...lessonForm, xp_reward: parseInt(e.target.value) || 10 })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}>
                          {editingLesson ? 'Update' : 'Simpan'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {selectedCourse && (
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{lesson.title}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openLessonDialog(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Quiz</h2>
              <div className="flex gap-2">
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value || null);
                    setSelectedLesson(null);
                    setLessons([]);
                    setQuizzes([]);
                  }}
                  className="px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="">Pilih Kursus</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLesson || ''}
                  onChange={(e) => {
                    setSelectedLesson(e.target.value || null);
                    setQuizzes([]);
                  }}
                  disabled={!selectedCourse}
                  className="px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="">Pilih Lesson</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
                <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openQuizDialog()} disabled={!selectedLesson}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Tambah Quiz'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="quiz-question">Pertanyaan *</Label>
                        <Textarea
                          id="quiz-question"
                          value={quizForm.question}
                          onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Opsi Jawaban *</Label>
                        {quizForm.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name="correct"
                              checked={quizForm.correct_answer === index}
                              onChange={() => setQuizForm({ ...quizForm, correct_answer: index })}
                              className="w-4 h-4"
                            />
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...quizForm.options];
                                newOptions[index] = e.target.value;
                                setQuizForm({ ...quizForm, options: newOptions });
                              }}
                              placeholder={`Opsi ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label htmlFor="quiz-explanation">Penjelasan</Label>
                        <Textarea
                          id="quiz-explanation"
                          value={quizForm.explanation}
                          onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>
                          Batal
                        </Button>
                        <Button onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}>
                          {editingQuiz ? 'Update' : 'Simpan'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {selectedLesson && (
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{quiz.question}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openQuizDialog(quiz)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {quiz.options.map((option, index) => (
                          <div key={index} className="text-sm">
                            {index === quiz.correct_answer ? (
                              <span className="text-success font-medium">✓ {option}</span>
                            ) : (
                              <span className="text-muted-foreground">{option}</span>
                            )}
                          </div>
                        ))}
                        {quiz.explanation && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Penjelasan:</strong> {quiz.explanation}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
