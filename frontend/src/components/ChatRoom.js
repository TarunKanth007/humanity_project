import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Image as ImageIcon, Phone, X, Star, LogOut, Microscope, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true
});

export const ChatRoom = ({ user, logout }) => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [room, setRoom] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadRoom();
    loadMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadRoom = async () => {
    try {
      const rooms = await api.get('/chat-rooms');
      const currentRoom = rooms.data.find(r => r.id === roomId);
      if (currentRoom) {
        setRoom(currentRoom);
      } else {
        toast.error('Chat room not found');
        navigate('/notifications');
      }
    } catch (error) {
      console.error('Failed to load room:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.get(`/chat-rooms/${roomId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/chat-rooms/${roomId}/messages`, {
        message_type: 'text',
        content: newMessage
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send message');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await api.post(`/chat-rooms/${roomId}/messages`, {
          message_type: 'image',
          content: reader.result
        });
        loadMessages();
        toast.success('Image sent');
      } catch (error) {
        console.error('Send image error:', error);
        toast.error(error.response?.data?.detail || 'Failed to send image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCall = () => {
    // Open external call service (can be replaced with actual WebRTC implementation)
    const jitsiDomain = process.env.REACT_APP_JITSI_DOMAIN || 'meet.jit.si';
    const callUrl = `https://${jitsiDomain}/safecure-${roomId}`;
    window.open(callUrl, '_blank');
    toast.info('Opening video call in new window');
  };

  const closeSession = async () => {
    try {
      await api.post(`/chat-rooms/${roomId}/close`);
      toast.success('Session closed');
      
      // Show review dialog if patient
      if (user.roles?.includes('patient') && room?.appointment) {
        setShowCloseDialog(false);
        setShowReviewDialog(true);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to close session');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        appointment_id: room.appointment.id,
        rating: review.rating,
        comment: review.comment
      });
      toast.success('Review submitted!');
      setShowReviewDialog(false);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    }
  };

  if (!room) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  const isPatient = user.roles?.includes('patient');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Microscope className="brand-icon" />
          <span>CuraLink</span>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/notifications')}>
            <ArrowLeft className="icon-sm mr-1" />
            Back
          </Button>
          <div className="nav-user">
            <img src={user.picture} alt={user.name} className="user-avatar" />
            <span>{user.name}</span>
            <Button data-testid="logout-btn" variant="ghost" size="sm" onClick={logout}>
              <LogOut className="icon-sm" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="chat-container">
        <div className="chat-header">
          <div className="flex items-center gap-3">
            <img 
              src={room.other_user?.picture || 'https://via.placeholder.com/40'} 
              alt={room.other_user?.name} 
              className="chat-avatar"
            />
            <div>
              <h2 className="font-semibold">{room.other_user?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {room.appointment?.condition}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCall}>
              <Phone className="icon-sm mr-1" />
              Video Call
            </Button>
            <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <X className="icon-sm mr-1" />
                  End Session
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="close-dialog-description">
                <DialogHeader>
                  <DialogTitle>End Session?</DialogTitle>
                  <DialogDescription id="close-dialog-description">
                    This will close the chat and permanently delete all messages. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowCloseDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={closeSession} className="flex-1">
                    Yes, End Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.sender_id === user.id ? 'message-sent' : 'message-received'}`}
            >
              <div className="message-bubble">
                <div className="message-sender">{msg.sender_name}</div>
                {msg.message_type === 'text' ? (
                  <p className="message-content">{msg.content}</p>
                ) : (
                  <img src={msg.content} alt="Shared" className="message-image" />
                )}
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-form">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button type="button" variant="outline" size="icon" asChild>
              <span><ImageIcon className="icon-sm" /></span>
            </Button>
          </label>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="icon-sm" />
          </Button>
        </form>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              Help others by sharing your experience with this researcher
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReview({ ...review, rating: star })}
                    className="star-button"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                placeholder="Share your experience..."
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Skip
              </Button>
              <Button type="submit" className="flex-1">
                Submit Review
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
