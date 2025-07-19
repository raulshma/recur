import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/admin';
import type { AdminStats, AdminUser, Invite, InviteRequest, CreateInviteRequest } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { toast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Mail, Crown, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteRequests, setInviteRequests] = useState<InviteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [showUsedInvites, setShowUsedInvites] = useState(false);
  const [selectedInviteRequestStatus, setSelectedInviteRequestStatus] = useState<string>('pending');

  // Form states
  const [inviteForm, setInviteForm] = useState<CreateInviteRequest>({
    email: '',
    role: 'User',
    expirationDays: 7
  });

  // Check if user is admin
  useEffect(() => {
    if (!user?.roles?.includes('Admin')) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [showUsedInvites, selectedInviteRequestStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, invitesData, inviteRequestsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({ limit: 50 }),
        adminApi.getInvites({ includeUsed: showUsedInvites }),
        adminApi.getInviteRequests({ status: selectedInviteRequestStatus === 'all' ? undefined : selectedInviteRequestStatus })
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setInvites(invitesData);
      setInviteRequests(inviteRequestsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await adminApi.createInvite(inviteForm);
      
      toast({
        title: 'Success',
        description: 'Invitation sent successfully'
      });
      
      setInviteForm({ email: '', role: 'User', expirationDays: 7 });
      setIsInviteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole({ userId, role: newRole });
      
      toast({
        title: 'Success',
        description: 'User role updated successfully'
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId);
      
      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInvite = async (inviteId: number) => {
    try {
      await adminApi.deleteInvite(inviteId);
      
      toast({
        title: 'Success',
        description: 'Invitation deleted successfully'
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invitation',
        variant: 'destructive'
      });
    }
  };

  const handleResendInvite = async (inviteId: number) => {
    try {
      const newInvite = await adminApi.resendInvite(inviteId);
      
      toast({
        title: 'Success',
        description: 'Invitation resent successfully'
      });
      
      // Copy new invitation link to clipboard
      const inviteUrl = `${window.location.origin}/register?token=${newInvite.token}&email=${encodeURIComponent(newInvite.email)}`;
      navigator.clipboard.writeText(inviteUrl);
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive'
      });
    }
  };

  const copyInviteLink = (invite: Invite) => {
    const inviteUrl = `${window.location.origin}/register?token=${invite.token}&email=${encodeURIComponent(invite.email)}`;
    navigator.clipboard.writeText(inviteUrl);
    
    toast({
      title: 'Copied',
      description: 'Invitation link copied to clipboard'
    });
  };

  const handleReviewInviteRequest = async (requestId: number, approve: boolean) => {
    try {
      await adminApi.reviewInviteRequest(requestId, {
        approve,
        role: 'User',
        expirationDays: 7,
        reviewNotes: approve ? 'Approved from admin panel' : 'Rejected from admin panel'
      });
      
      toast({
        title: 'Success',
        description: `Invitation request ${approve ? 'approved' : 'rejected'} successfully`
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${approve ? 'approve' : 'reject'} invitation request`,
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin': return 'destructive';
      case 'User': return 'default';
      default: return 'secondary';
    }
  };

  if (!user?.roles?.includes('Admin')) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage users and invitations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                  <p className="text-2xl font-bold">{stats.pendingInvites}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold">{stats.pendingInviteRequests}</p>
                </div>
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.totalSubscriptions}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invites">Invitations</TabsTrigger>
          <TabsTrigger value="requests">Invite Requests</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <p className="text-sm text-muted-foreground">Manage user accounts and roles</p>
              </div>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Invitation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvite} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteForm.role} onValueChange={(role) => setInviteForm({ ...inviteForm, role })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expirationDays">Expires in (days)</Label>
                      <Input
                        id="expirationDays"
                        type="number"
                        min="1"
                        max="30"
                        value={inviteForm.expirationDays}
                        onChange={(e) => setInviteForm({ ...inviteForm, expirationDays: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Send Invitation
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{user.fullName || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                          {user.lastLoginAt && ` • Last login ${new Date(user.lastLoginAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)}>
                          {role}
                        </Badge>
                      ))}
                      <div className="text-sm text-muted-foreground">
                        {user.subscriptionCount} subs
                      </div>
                      <Select 
                        value={user.roles[0] || 'User'} 
                        onValueChange={(role) => handleUpdateUserRole(user.id, role)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={user.id === user?.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.fullName || user.email}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invites">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invitations</CardTitle>
                <p className="text-sm text-muted-foreground">Manage pending and sent invitations</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUsedInvites(!showUsedInvites);
                    loadData();
                  }}
                >
                  {showUsedInvites ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showUsedInvites ? 'Hide Used' : 'Show Used'}
                </Button>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      New Invitation
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{invite.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Role: {invite.role} • 
                        Created: {new Date(invite.createdAt).toLocaleDateString()} • 
                        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                      {invite.invitedByName && (
                        <div className="text-xs text-muted-foreground">
                          Invited by {invite.invitedByName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={invite.isUsed ? 'secondary' : new Date(invite.expiresAt) < new Date() ? 'destructive' : 'default'}>
                        {invite.isUsed ? 'Used' : new Date(invite.expiresAt) < new Date() ? 'Expired' : 'Pending'}
                      </Badge>
                      {!invite.isUsed && new Date(invite.expiresAt) > new Date() && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => copyInviteLink(invite)}>
                            Copy Link
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleResendInvite(invite.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the invitation for {invite.email}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteInvite(invite.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invite Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invitation Requests</CardTitle>
                <p className="text-sm text-muted-foreground">Review user invitation requests</p>
              </div>
              <Select value={selectedInviteRequestStatus} onValueChange={setSelectedInviteRequestStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All Requests</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inviteRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-medium">{request.firstName} {request.lastName}</h3>
                          <Badge variant={request.status === 'Pending' ? 'default' : request.status === 'Approved' ? 'secondary' : 'destructive'}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-2 italic">"{request.message}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.reviewedAt && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed by {request.reviewedByName || 'Unknown'} on {new Date(request.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {request.status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewInviteRequest(request.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReviewInviteRequest(request.id, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {inviteRequests.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No invitation requests found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage; 