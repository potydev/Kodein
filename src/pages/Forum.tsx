import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Heart, 
  Plus, 
  Search,
  Clock,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ForumPost {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  content: string;
  likes: number;
  created_at: string;
  username?: string | null;
  avatar_url?: string | null;
  comment_count?: number;
}

const Forum: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (postsData) {
      // Fetch profiles and comment counts separately
      const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))];
      const postIds = postsData.map(p => p.id);
      
      const [profilesRes, commentsRes] = await Promise.all([
        userIds.length > 0 
          ? supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
          : { data: [] },
        supabase.from('forum_comments').select('post_id').in('post_id', postIds)
      ]);
      
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const commentCounts = new Map<string, number>();
      (commentsRes.data || []).forEach(c => {
        commentCounts.set(c.post_id!, (commentCounts.get(c.post_id!) || 0) + 1);
      });
      
      const enrichedPosts: ForumPost[] = postsData.map(post => ({
        ...post,
        username: profilesMap.get(post.user_id!)?.username || null,
        avatar_url: profilesMap.get(post.user_id!)?.avatar_url || null,
        comment_count: commentCounts.get(post.id) || 0,
      }));
      
      setPosts(enrichedPosts);
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: 'Error',
        description: 'Judul dan konten wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: user.id,
        title: newPost.title,
        content: newPost.content,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat post',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Berhasil!',
        description: 'Post berhasil dibuat',
      });
      setNewPost({ title: '', content: '' });
      setIsDialogOpen(false);
      fetchPosts();
    }
    setSubmitting(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const { error } = await supabase
      .from('forum_posts')
      .update({ likes: post.likes + 1 })
      .eq('id', postId);

    if (!error) {
      setPosts(prev => 
        prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p)
      );
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Forum <span className="text-gradient">Diskusi</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Tanya jawab dan diskusi dengan komunitas developer
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari diskusi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl"
              />
            </div>

            {/* New Post Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Buat Diskusi
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border/50">
                <DialogHeader>
                  <DialogTitle>Buat Diskusi Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Input
                      placeholder="Judul diskusi..."
                      value={newPost.title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Tulis pertanyaan atau diskusimu..."
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      rows={5}
                    />
                  </div>
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    onClick={handleCreatePost}
                    disabled={submitting}
                  >
                    {submitting ? 'Memposting...' : 'Posting'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Posts List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl glass animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="h-4 bg-muted rounded w-24" />
                </div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/forum/${post.id}`}
                className="block p-6 rounded-2xl glass card-hover animate-slide-up"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                {/* Author */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {post.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {post.username || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.created_at), { 
                        addSuffix: true,
                        locale: localeId 
                      })}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{post.content}</p>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleLike(post.id);
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">{post.comment_count || 0} komentar</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 animate-slide-up">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'Diskusi Tidak Ditemukan' : 'Belum Ada Diskusi'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Coba gunakan kata kunci yang berbeda' 
                  : 'Jadilah yang pertama membuat diskusi!'
                }
              </p>
              {!searchQuery && (
                <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Diskusi Pertama
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forum;
