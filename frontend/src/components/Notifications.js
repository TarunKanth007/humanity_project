import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bell, Check, X, LogOut, Microscope, Calendar } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true
});

export const Notifications = ({ user, logout }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [collabRequests, setCollabRequests] = useState([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const promises = [
        api.get('/notifications'),
        api.get('/appointments')
      ];
      
      // Only load collab requests if user is researcher
      if (user.roles?.includes('researcher')) {
        promises.push(api.get('/collaborations/requests'));
      }
      
      const results = await Promise.all(promises);
      setNotifications(results[0].data);
      setAppointments(results[1].data.filter(a => a.status === 'pending'));
      
      if (results[2]) {
        setCollabRequests(results[2].data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post('/notifications/read', { notification_id: notificationId });
      loadData();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleAccept = async (appointmentId) => {
    try {
      const response = await api.post(`/appointments/${appointmentId}/accept`);
      toast.success('Appointment accepted! Chat room created.');
      navigate(`/chat/${response.data.chat_room_id}`);
    } catch (error) {
      toast.error('Failed to accept appointment');
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/reject`);
      toast.success('Appointment rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to reject appointment');
    }
  };

  const handleAcceptCollab = async (requestId) => {
    try {
      await api.post(`/collaborations/requests/${requestId}/accept`);
      toast.success('Collaboration request accepted!');
      loadData();
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to accept collaboration request');
    }
  };

  const handleRejectCollab = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await api.post(`/collaborations/requests/${selectedRequest.id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Collaboration request rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      toast.error('Failed to reject collaboration request');
    }
  };

  const isResearcher = user.roles?.includes('researcher');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Microscope className="brand-icon" />
          <span>CuraLink</span>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate('/qa-community')}>
            Q&A Community
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

      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1>Notifications</h1>
              <p className="dashboard-subtitle">Stay updated with your activity</p>
            </div>
          </div>

          {isResearcher && appointments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Pending Appointment Requests</h2>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="appointment-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{appointment.patient_name}</CardTitle>
                          <CardDescription>
                            <Calendar className="icon-xs inline mr-1" />
                            {new Date(appointment.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge>Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Condition:</strong> {appointment.condition}</p>
                        <p><strong>Location:</strong> {appointment.location}</p>
                        <p><strong>Duration Suffering:</strong> {appointment.duration_suffering}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleAccept(appointment.id)}
                          className="flex-1"
                        >
                          <Check className="icon-sm mr-1" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleReject(appointment.id)}
                          className="flex-1"
                        >
                          <X className="icon-sm mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">All Notifications</h2>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell className="empty-icon" />
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`notification-card ${!notif.read ? 'unread' : ''}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notif.content}</p>
                        <span className="text-xs text-muted-foreground mt-2 block">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                        
                        {/* Join Chat Button for Accepted Appointments */}
                        {notif.type === 'appointment_accepted' && notif.link && (
                          <Button
                            className="mt-3"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(notif.link);
                            }}
                            data-testid="join-chat-btn"
                          >
                            Join Consultation Chat
                          </Button>
                        )}
                      </div>
                      {!notif.read && (
                        <Badge variant="default" className="ml-2">New</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
