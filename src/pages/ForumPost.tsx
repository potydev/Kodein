import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare,
  Clock,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ForumPostData {
  id: string;
  user_id: string;
  title: string;
  content: string;
  likes: number;
  created_at: string;
  username?: string | null;
  avatar_url?: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  username?: string | null;
  avatar_url?: string | null;
}

const ForumPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [post, setPost] = useState<ForumPostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      // Fetch profile separately
      const { data: profile } = data.user_id 
        ? await supabase.from('profiles').select('username, avatar_url').eq('id', data.user_id).maybeSingle()
        : { data: null };
      
      setPost({
        ...data,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
      });
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data: commentsData } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    
    if (commentsData) {
      const userIds = [...new Set(commentsData.map(c => c.user_id).filter(Boolean))];
      
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
        : { data: [] };
      
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
      
      const enrichedComments: Comment[] = commentsData.map(comment => ({
        ...comment,
        username: profilesMap.get(comment.user_id!)?.username || null,
        avatar_url: profilesMap.get(comment.user_id!)?.avatar_url || null,
      }));
      
      setComments(enrichedComments);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!post) return;

    const { error } = await supabase
      .from('forum_posts')
      .update({ likes: post.likes + 1 })
      .eq('id', post.id);

    if (!error) {
      setPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Error',
        description: 'Komentar tidak boleh kosong',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content: newComment,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengirim komentar',
        variant: 'destructive',
      });
    } else {
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post Tidak Ditemukan</h2>
          <Link to="/forum">
            <Button variant="hero">Kembali ke Forum</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/forum"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Forum
          </Link>

          {/* Post */}
          <div className="p-6 rounded-2xl glass mb-8 animate-slide-up">
            {/* Author */}
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg">
                  {post.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-lg">
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
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>
            <p className="text-foreground/90 whitespace-pre-wrap mb-6">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-border/50">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Heart className="h-5 w-5" />
                <span>{post.likes}</span>
              </button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                <span>{comments.length} komentar</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6">Komentar ({comments.length})</h2>

            {/* Comment Form */}
            <div className="p-4 rounded-2xl glass mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Textarea
                placeholder={user ? "Tulis komentar..." : "Login untuk berkomentar"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user}
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <Button 
                  variant="hero" 
                  size="sm" 
                  onClick={handleSubmitComment}
                  disabled={!user || submitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Mengirim...' : 'Kirim'}
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="p-4 rounded-xl glass animate-slide-up"
                  style={{ animationDelay: `${0.1 + 0.05 * index}s` }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.avatar_url || ''} />
                      <AvatarFallback className="bg-secondary/20 text-secondary text-sm">
                        {comment.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true,
                            locale: localeId 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada komentar. Jadilah yang pertama!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;
