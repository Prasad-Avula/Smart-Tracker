import { useState } from 'react'
import { useAuth } from '@features/auth'
import { useTheme } from '@app/providers/ThemeProvider'
import type { UserSettings } from '@shared/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { Label } from '@shared/components/ui/Label'
import { Switch } from '@shared/components/ui/Switch'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@shared/components/ui/AlertDialog'
import { User, Bell, Shield, Trash2, Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Input } from '@shared/components/ui/Input'

export function SettingsPage() {
  const { user, updateUserSettings, logout, deleteAccount, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState(user?.settings)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSettingChange = (section: string, key: string, value: boolean) => {
    const computeNewSettings = (prevSettings: UserSettings | undefined): UserSettings => {
      if (!prevSettings) {
        const defaultSettings: UserSettings = {
          theme: 'system',
          notifications: {
            enabled: true,
            dailyReminder: true,
            taskReminders: true,
            goalReminders: true,
            weeklySummary: false,
            monthlySummary: false,
          },
          dailyReminderTime: undefined,
          weeklyReminderEnabled: false,
          monthlyReminderEnabled: false,
        }
        if (section === 'notifications') {
          return { ...defaultSettings, notifications: { ...defaultSettings.notifications, [key]: value } }
        } else if (section === 'theme') {
          return { ...defaultSettings, [key]: value }
        }
        return defaultSettings
      }
      if (section === 'notifications') {
        return { ...prevSettings, notifications: { ...prevSettings.notifications, [key]: value } }
      } else if (section === 'theme') {
        return { ...prevSettings, [key]: value }
      }
      return prevSettings
    }

    setSettings(prevSettings => {
      const newSettings = computeNewSettings(prevSettings)
      updateUserSettings(newSettings)
      return newSettings
    })
  }

  if (!user) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Please log in to manage your settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl min-h-[calc(100vh-8rem)]">
      {/* Profile Section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={user.displayName} disabled className="bg-surface/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled className="bg-surface/50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { 
                  if (settings) {
                    handleSettingChange('theme', 'theme', true);
                  }
                  setTheme(t);
                }}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                  theme === t ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface'
                )}
              >
                {t === 'light' && <Sun className="h-6 w-6" />}
                {t === 'dark' && <Moon className="h-6 w-6" />}
                {t === 'system' && <Monitor className="h-6 w-6" />}
                <span className="text-sm font-medium capitalize">{t}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
{/* Notifications Section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure when you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'enabled', label: 'Enable Notifications', description: 'Master switch for all notifications' },
              { key: 'dailyReminder', label: 'Daily Reminder', description: 'Remind me to plan my day' },
              { key: 'taskReminders', label: 'Task Reminders', description: 'Get reminded about upcoming tasks' },
              { key: 'goalReminders', label: 'Goal Reminders', description: 'Get reminded about active goals' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{label}</p>
                  <p className="text-sm text-text-muted">{description}</p>
                </div>
                <Switch
                  checked={settings?.notifications[key as keyof typeof settings.notifications] ?? false}
                  onCheckedChange={(checked) => handleSettingChange('notifications', key, checked)}
                  disabled={key !== 'enabled' && !settings?.notifications.enabled}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="secondary" onClick={logout} disabled={authLoading}>
            Log Out
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card variant="outlined" className="border-danger/50 bg-danger/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>This action cannot be undone</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            trigger={
              <Button
                variant="danger"
                className="w-full"
                disabled={authLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            }
            content={
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you absolutely sure? This action cannot be undone. This will permanently delete your account, all tasks, goals, history, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex justify-between">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setShowDeleteConfirm(false); deleteAccount(); }} disabled={authLoading}>
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}