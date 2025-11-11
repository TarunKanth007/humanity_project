import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Image as ImageIcon, User, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true
});

export const ForumDiscussion = ({ forum, user, onBack }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [membership, setMembership] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);

  useEffect(() => {
    loadPosts();
    checkMembership();
  }, [forum.id]);

  const checkMembership = async () => {
    try {
      const res = await api.get(`/forums/${forum.id}/membership`);
      setMembership(res.data);
    } catch (error) {
      console.error('Failed to check membership:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/forums/${forum.id}/posts`);
      setPosts(res.data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.trim()) {
      toast.error('Please enter a question');
      return;
    }

    try {
      await api.post('/forums/posts', {
        forum_id: forum.id,
        content: newQuestion,
        image_url: imageUrl || null
      });
      
      toast.success('Question posted!');
      setNewQuestion('');
      setImageUrl('');
      setShowImageInput(false);
      loadPosts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to post question');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await api.post('/forums/posts', {
        forum_id: forum.id,
        content: replyText,
        parent_id: replyingTo.id
      });
      
      toast.success('Reply posted!');
      setReplyText('');
      setReplyingTo(null);
      loadPosts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to post reply');
    }
  };

  // Organize posts into threads
  const organizeThreads = () => {
    const topLevel = posts.filter(p => !p.parent_id);
    const replies = posts.filter(p => p.parent_id);
    
    return topLevel.map(post => ({
      ...post,
      replies: replies.filter(r => r.parent_id === post.id)
    }));
  };

  const threads = organizeThreads();
  const isMember = membership?.is_member;

  return (
    <div className="forum-discussion">
      <div className="forum-header">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="icon-sm" />
          Back to Forums
        </Button>
        
        <div className="forum-title-section">
          <h2 className="forum-discussion-title">{forum.name}</h2>
          <p className="forum-discussion-description">{forum.description}</p>
          <Badge>{forum.category}</Badge>
        </div>
      </div>

      {/* Ask Question Section */}
      {isMember && (
        <Card className="ask-question-card">
          <CardHeader>
            <CardTitle className="text-lg">Ask a Question</CardTitle>
            <CardDescription>Share your concerns or experiences with the community</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={4}
              className="mb-3"
            />
            
            {showImageInput && (
              <div className="image-input-section">
                <input
                  type="text"
                  placeholder="Paste image URL (optional)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="image-url-input"
                />
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}>
                  <X className="icon-sm" />
                </Button>
              </div>
            )}
            
            <div className="post-actions">
              {!showImageInput && (
                <Button variant="outline" size="sm" onClick={() => setShowImageInput(true)}>
                  <ImageIcon className="icon-sm" />
                  Add Image
                </Button>
              )}
              
              <Button onClick={handlePostQuestion} style={{
                background: 'var(--accent-gradient)',
                color: 'var(--cream)'
              }}>
                <Send className="icon-sm" />
                Post Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isMember && (
        <Card className="join-prompt-card">
          <CardContent style={{ padding: '24px', textAlign: 'center' }}>
            <MessageSquare className="icon-lg" style={{ margin: '0 auto 16px', color: 'var(--olive)' }} />
            <h3>Join this forum to participate</h3>
            <p style={{ color: 'var(--taupe)', opacity: 0.7, marginTop: '8px' }}>
              You need to join this forum group to ask questions and reply to discussions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discussion Threads */}
      <div className="discussion-threads">
        {loading ? (
          <div className="loading-state">Loading discussions...</div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <MessageSquare className="empty-icon" />
            <h3>No discussions yet</h3>
            <p>Be the first to start a conversation in this forum</p>
          </div>
        ) : (
          threads.map(thread => (
            <Card key={thread.id} className="discussion-thread">
              <CardHeader>
                <div className="post-author">
                  <User className="icon-sm" />
                  <div>
                    <strong>{thread.user_name}</strong>
                    <Badge variant={thread.user_role === 'researcher' ? 'default' : 'secondary'} 
                           style={{ marginLeft: '8px' }}>
                      {thread.user_role}
                    </Badge>
                  </div>
                  <span className="post-time">
                    {new Date(thread.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="post-content">{thread.content}</p>
                
                {thread.image_url && (
                  <div className="post-image">
                    <img src={thread.image_url} alt="Attachment" />
                  </div>
                )}

                {/* Replies */}
                {thread.replies.length > 0 && (
                  <div className="replies-section">
                    {thread.replies.map(reply => (
                      <div key={reply.id} className="reply-item">
                        <div className="reply-header">
                          <User className="icon-sm" />
                          <strong>{reply.user_name}</strong>
                          <Badge variant={reply.user_role === 'researcher' ? 'default' : 'secondary'}>
                            {reply.user_role}
                          </Badge>
                          <span className="reply-time">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="reply-content">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Button */}
                {isMember && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setReplyingTo(thread)}
                        style={{ marginTop: '12px' }}
                      >
                        <MessageSquare className="icon-sm" />
                        Reply
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reply to {thread.user_name}</DialogTitle>
                      </DialogHeader>
                      <div className="reply-form">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                        />
                        <Button 
                          onClick={handleReply}
                          style={{
                            marginTop: '12px',
                            background: 'var(--accent-gradient)',
                            color: 'var(--cream)'
                          }}
                        >
                          <Send className="icon-sm" />
                          Post Reply
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
