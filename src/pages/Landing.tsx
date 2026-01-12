import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Zap, 
  Trophy, 
  Users, 
  BookOpen, 
  Terminal,
  ArrowRight,
  CheckCircle,
  Star,
  Github
} from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Kursus Interaktif',
      description: 'Pelajari coding dengan lesson-lesson menarik dan mudah dipahami',
    },
    {
      icon: Terminal,
      title: 'Editor Kode Online',
      description: 'Tulis dan jalankan kode langsung di browser tanpa instalasi',
    },
    {
      icon: Trophy,
      title: 'Quiz & Tantangan',
      description: 'Uji pemahamanmu dengan quiz interaktif dan dapatkan XP',
    },
    {
      icon: Users,
      title: 'Komunitas Aktif',
      description: 'Diskusi dan belajar bersama developer lainnya di forum',
    },
  ];

  const courses = [
    { name: 'Python', color: 'from-yellow-400 to-yellow-600', icon: '🐍' },
    { name: 'JavaScript', color: 'from-yellow-300 to-amber-500', icon: '⚡' },
    { name: 'HTML & CSS', color: 'from-orange-400 to-red-500', icon: '🎨' },
    { name: 'SQL', color: 'from-blue-400 to-blue-600', icon: '🗄️' },
    { name: 'Java', color: 'from-red-500 to-red-700', icon: '☕' },
    { name: 'C++', color: 'from-blue-500 to-purple-600', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
              <Star className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">Platform #1 untuk belajar coding</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Belajar <span className="text-gradient">Coding</span>
              <br />
              Jadi Mudah & Menyenangkan
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Kuasai bahasa pemrograman paling populer dengan metode interaktif, 
              quiz menarik, dan komunitas yang suportif.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="group">
                  Mulai Belajar Gratis
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="glass" size="xl">
                  Lihat Kursus
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div>
                <div className="text-3xl font-bold text-gradient">100+</div>
                <div className="text-sm text-muted-foreground">Lesson</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient">10K+</div>
                <div className="text-sm text-muted-foreground">Pengguna</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient">500+</div>
                <div className="text-sm text-muted-foreground">Quiz</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Kuasai Bahasa <span className="text-gradient">Pemrograman</span> Populer
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {courses.map((course, index) => (
              <Link
                key={course.name}
                to="/courses"
                className="group p-6 rounded-2xl glass card-hover text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {course.icon}
                </div>
                <h3 className="font-semibold">{course.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Kenapa Pilih <span className="text-gradient">Kodein</span>?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Platform pembelajaran coding yang dirancang untuk semua level, dari pemula hingga profesional
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl glass card-hover animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-8 md:p-12 rounded-3xl bg-gradient-card glass border border-border/50 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Memulai Perjalanan Coding?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Bergabung dengan ribuan developer lainnya dan mulai belajar coding hari ini. Gratis selamanya!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth?mode=signup">
                  <Button variant="hero" size="lg">
                    Daftar Sekarang
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  100% Gratis
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Tanpa Kartu Kredit
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-gradient">Kodein</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2026 Kodein. Belajar coding jadi mudah.
              </p>
              <a
                href="https://github.com/potydev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>Dibuat oleh potydev</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
