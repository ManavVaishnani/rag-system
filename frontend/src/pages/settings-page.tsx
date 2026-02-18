import { useState } from 'react';
import { User, Lock, Bell, Trash2, Save, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'security' | 'notifications';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-accent" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account preferences and security settings
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar tabs */}
            <nav className="md:w-48 shrink-0">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activeTab === 'profile' && (
                <ProfileSettings user={user} onDeleteAccount={() => setDeleteDialogOpen(true)} />
              )}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your conversations, documents, and data will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error('Account deletion is not available in this demo');
                setDeleteDialogOpen(false);
              }}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

interface ProfileSettingsProps {
  user: { email: string } | null;
  onDeleteAccount: () => void;
}

function ProfileSettings({ user, onDeleteAccount }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState('');

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Profile Information</h2>
          <p className="text-sm text-muted-foreground">Update your personal details</p>
        </div>

        <Separator />

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium">{user?.email}</p>
            <Badge variant="outline" className="mt-1 text-xs border-accent/20 text-accent">
              Active Account
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted/30 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="bg-muted/50"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Irreversible actions — proceed with caution
          </p>
        </div>
        <Separator className="border-red-500/20" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteAccount}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (password.length < 10) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Change Password</h2>
          <p className="text-sm text-muted-foreground">Keep your account secure with a strong password</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-muted/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-muted/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', strength.color)}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={cn(
                "bg-muted/50",
                confirmPassword && confirmPassword !== newPassword && "border-red-500/50 focus-visible:ring-red-500/30"
              )}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>
        </div>

        <Button
          onClick={handleChangePassword}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Lock className="h-4 w-4 mr-2" />
          Update Password
        </Button>
      </div>

      {/* Session info */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
        </div>
        <Separator />
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Session</p>
              <p className="text-xs text-muted-foreground">Active now · This device</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [processingAlerts, setProcessingAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSave = () => {
    toast.success('Notification preferences saved');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">Choose what you want to be notified about</p>
        </div>

        <Separator />

        <div className="space-y-5">
          {[
            {
              id: 'email',
              label: 'Email Notifications',
              description: 'Receive important updates via email',
              value: emailNotifs,
              onChange: setEmailNotifs,
            },
            {
              id: 'processing',
              label: 'Document Processing Alerts',
              description: 'Get notified when documents finish processing',
              value: processingAlerts,
              onChange: setProcessingAlerts,
            },
            {
              id: 'digest',
              label: 'Weekly Digest',
              description: 'A weekly summary of your document activity',
              value: weeklyDigest,
              onChange: setWeeklyDigest,
            },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                id={item.id}
                checked={item.value}
                onCheckedChange={item.onChange}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
