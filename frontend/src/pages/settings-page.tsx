import { useState } from 'react';
import { User, Lock, Bell, Trash2, Save, Eye, EyeOff, Shield, AlertTriangle, Key, Plus, Zap, Loader2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { useApiKeys } from '@/hooks/use-api-keys';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'security' | 'api-keys' | 'notifications';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api-keys', label: 'API Keys', icon: Key },
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
              {activeTab === 'api-keys' && <ApiKeySettings />}
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

          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
        </div>
      </div>
    </div>
  );
}

function ApiKeySettings() {
  const {
    keys,
    credits,
    isLoadingKeys,
    isLoadingCredits,
    addKey,
    updateKey,
    deleteKey,
    isAddingKey,
    isDeletingKey,
  } = useApiKeys();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const handleAddKey = () => {
    if (!newApiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    addKey(
      { apiKey: newApiKey.trim(), name: newKeyName.trim() || undefined },
      {
        onSuccess: () => {
          setShowAddDialog(false);
          setNewApiKey('');
          setNewKeyName('');
          setShowKey(false);
        },
      },
    );
  };

  const handleDeleteKey = (keyId: string) => {
    deleteKey(keyId, {
      onSuccess: () => setShowDeleteDialog(null),
    });
  };

  const handleSaveName = (keyId: string) => {
    updateKey(
      { id: keyId, data: { name: editNameValue.trim() || undefined } },
      {
        onSuccess: () => {
          setEditingName(null);
          setEditNameValue('');
        },
      },
    );
  };

  const handleToggleActive = (keyId: string, currentlyActive: boolean) => {
    updateKey({ id: keyId, data: { isActive: !currentlyActive } });
  };

  const creditPercentage = credits
    ? Math.round((credits.used / credits.dailyLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Credit Status */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Daily Usage
            </h2>
            <p className="text-sm text-muted-foreground">
              {credits?.hasByok
                ? 'Using your own API key — unlimited queries'
                : `${credits?.remaining ?? '—'} of ${credits?.dailyLimit ?? '—'} queries remaining today`}
            </p>
          </div>
          {credits?.hasByok && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              BYOK Active
            </Badge>
          )}
        </div>

        {!credits?.hasByok && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {credits?.used ?? 0} used
                </span>
                <span className="text-muted-foreground">
                  {credits?.dailyLimit ?? 25} limit
                </span>
              </div>
              <Progress value={creditPercentage} className="h-2" />
            </div>
            {credits?.resetsAt && (
              <p className="text-xs text-muted-foreground">
                Resets at {new Date(credits.resetsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </p>
            )}
          </>
        )}

        {isLoadingCredits && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading usage…
          </div>
        )}
      </div>

      {/* API Keys List */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Key className="h-5 w-5 text-accent" />
              Gemini API Keys
            </h2>
            <p className="text-sm text-muted-foreground">
              Add your own Google Gemini API key for unlimited queries
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Key
          </Button>
        </div>

        <Separator />

        {isLoadingKeys ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading keys…
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No API keys added</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a Gemini API key to bypass the daily query limit
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add your first key
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors',
                  key.isActive
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-border/50 bg-muted/20',
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      key.isActive
                        ? 'bg-accent/10 border border-accent/20'
                        : 'bg-muted/50 border border-border/50',
                    )}
                  >
                    <Key
                      className={cn(
                        'h-4 w-4',
                        key.isActive ? 'text-accent' : 'text-muted-foreground',
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    {editingName === key.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          placeholder="Key name"
                          className="h-7 text-sm bg-muted/50 w-40"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName(key.id);
                            if (e.key === 'Escape') setEditingName(null);
                          }}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleSaveName(key.id)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">
                          {key.name || 'Unnamed key'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingName(key.id);
                            setEditNameValue(key.name || '');
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">
                      {key.maskedKey}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {key.isActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                  <button
                    onClick={() => handleToggleActive(key.id, key.isActive)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={key.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {key.isActive ? (
                      <ToggleRight className="h-5 w-5 text-accent" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(key.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How to get a key */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-4 space-y-2">
          <p className="text-sm font-medium">How to get a Gemini API key</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>
              Go to{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Google AI Studio
              </a>
            </li>
            <li>Click "Create API Key"</li>
            <li>Copy the key and paste it above</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">
            Your key is encrypted at rest and never exposed in API responses.
          </p>
        </div>
      </div>

      {/* Add Key Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-accent" />
              Add Gemini API Key
            </DialogTitle>
            <DialogDescription>
              Your API key will be encrypted and stored securely. It is never returned in API responses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="bg-muted/50 pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-name">Name (optional)</Label>
              <Input
                id="key-name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Key"
                className="bg-muted/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewApiKey('');
                setNewKeyName('');
                setShowKey(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddKey}
              disabled={!newApiKey.trim() || isAddingKey}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isAddingKey ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete API Key
            </DialogTitle>
            <DialogDescription>
              This will permanently remove this API key. If it's your only active key, you'll go back to the daily credit limit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingKey}
              onClick={() => showDeleteDialog && handleDeleteKey(showDeleteDialog)}
            >
              {isDeletingKey ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
