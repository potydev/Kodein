import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Code2, Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp, user, clearSession, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    setIsSignUp(mode === 'signup');
  }, [mode]);

  const validateForm = () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid');
      return false;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }
    if (isSignUp && !username) {
      setError('Username wajib diisi');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Email sudah terdaftar. Silakan masuk.');
          } else {
            setError(error.message);
          }
        } else {
          toast({
            title: 'Pendaftaran Berhasil!',
            description: 'Selamat datang di Kodein!',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            setError('Email atau password salah');
          } else {
            setError(error.message);
          }
        } else {
          toast({
            title: 'Selamat Datang!',
            description: 'Berhasil masuk ke akun Anda',
          });
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        {/* Card */}
        <div className="p-8 rounded-2xl glass border border-border/50 animate-slide-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Code2 className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-gradient">Kodein</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">
            {isSignUp ? 'Buat Akun Baru' : 'Masuk ke Akun'}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {isSignUp ? 'Mulai perjalanan coding Anda' : 'Lanjutkan belajar coding'}
          </p>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-6">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Memproses...' : isSignUp ? 'Daftar' : 'Masuk'}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
            </span>{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Masuk' : 'Daftar'}
            </button>
          </div>

          {/* Clear Session Button - Show if stuck loading */}
          {authLoading && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={async () => {
                  await clearSession();
                  toast({
                    title: 'Session Dihapus',
                    description: 'Silakan coba login lagi',
                  });
                  window.location.reload();
                }}
              >
                Clear Session (Jika Terjebak Loading)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
