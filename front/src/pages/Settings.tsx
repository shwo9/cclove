import { useEffect, useState, useCallback } from 'react'
import { Key, RefreshCw, Sliders, Globe, Shield, Check, AlertCircle, Loader2, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import type { SettingsRead, SettingsUpdate } from '../api/types'
import { settingsApi } from '../api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

export function Settings() {
    const [settings, setSettings] = useState<SettingsRead | null>(null)
    const [originalSettings, setOriginalSettings] = useState<SettingsRead | null>(null)
    const [loading, setLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [newApiKey, setNewApiKey] = useState('')
    const [newAdminKey, setNewAdminKey] = useState('')
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
    const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set())
    const isMobile = useIsMobile()

    const loadSettings = async () => {
        try {
            const response = await settingsApi.get()
            setSettings(response.data)
            setOriginalSettings(response.data)
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    // 즉시 저장 함수
    const saveChanges = useCallback(
        async (changes: SettingsUpdate) => {
            if (Object.keys(changes).length === 0) return

            setSaveStatus('saving')
            try {
                await settingsApi.update(changes)
                setSaveStatus('saved')

                // 저장된 변경 사항을 반영하기 위해 원본 설정 업데이트
                if (originalSettings && settings) {
                    setOriginalSettings({ ...originalSettings, ...changes })
                }

                // 3초 후 상태 재설정
                setTimeout(() => setSaveStatus('idle'), 3000)
            } catch (error) {
                console.error('Failed to save settings:', error)
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 5000)
            }
        },
        [originalSettings],
    )

    // 저장하지 않고 설정 업데이트
    const updateSettings = useCallback((newSettings: SettingsRead) => {
        setSettings(newSettings)
    }, [])

    // 필드 변경 처리 및 즉시 저장
    const handleFieldChange = useCallback(
        async (newSettings: SettingsRead) => {
            setSettings(newSettings)

            if (!originalSettings) return

            // 변경된 필드 비교 및 가져오기
            const changes: SettingsUpdate = {}

            // 각 필드의 변경 사항 확인
            Object.keys(newSettings).forEach(key => {
                const typedKey = key as keyof SettingsRead
                if (JSON.stringify(newSettings[typedKey]) !== JSON.stringify(originalSettings[typedKey])) {
                    ;(changes as any)[key] = newSettings[typedKey]
                }
            })

            // 변경 사항이 있으면 즉시 저장
            if (Object.keys(changes).length > 0) {
                await saveChanges(changes)
            }
        },
        [originalSettings, saveChanges],
    )

    const handleAddApiKey = async () => {
        if (!settings || !newApiKey || settings.api_keys.includes(newApiKey)) return
        const newSettings = {
            ...settings,
            api_keys: [...settings.api_keys, newApiKey],
        }
        await handleFieldChange(newSettings)
        setNewApiKey('')
    }

    const handleRemoveApiKey = async (key: string) => {
        if (!settings) return
        const newSettings = {
            ...settings,
            api_keys: settings.api_keys.filter(k => k !== key),
        }
        await handleFieldChange(newSettings)
    }

    const handleAddAdminKey = async () => {
        if (!settings || !newAdminKey || settings.admin_api_keys.includes(newAdminKey)) return
        const newSettings = {
            ...settings,
            admin_api_keys: [...settings.admin_api_keys, newAdminKey],
        }
        await handleFieldChange(newSettings)
        setNewAdminKey('')
    }

    const handleRemoveAdminKey = async (key: string) => {
        if (!settings) return
        const newSettings = {
            ...settings,
            admin_api_keys: settings.admin_api_keys.filter(k => k !== key),
        }
        await handleFieldChange(newSettings)
    }

    const generateNewKey = (type: 'api' | 'admin') => {
        const key =
            'sk-' +
            Array.from({ length: 48 }, () =>
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 62)),
            ).join('')

        if (type === 'api') {
            setNewApiKey(key)
        } else {
            setNewAdminKey(key)
        }
    }

    const toggleKeyVisibility = (key: string) => {
        setVisibleKeys(prev => {
            const newSet = new Set(prev)
            if (newSet.has(key)) {
                newSet.delete(key)
            } else {
                newSet.add(key)
            }
            return newSet
        })
    }

    const copyKey = async (key: string) => {
        try {
            await navigator.clipboard.writeText(key)
            toast.success('키가 클립보드에 복사되었습니다')

            setCopiedKeys(prev => new Set(prev).add(key))
            setTimeout(() => {
                setCopiedKeys(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(key)
                    return newSet
                })
            }, 2000)
        } catch (error) {
            toast.error('복사에 실패했습니다. 수동으로 복사해주세요')
        }
    }

    if (loading || !settings) {
        return (
            <div className='space-y-6'>
                <div className='space-y-2'>
                    <Skeleton className='h-8 w-48' />
                    <Skeleton className='h-4 w-96' />
                </div>

                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className='h-6 w-32' />
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <Skeleton className='h-10 w-full' />
                            <Skeleton className='h-10 w-full' />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight pb-1'>애플리케이션 설정</h1>
                    <p className='text-muted-foreground'>애플리케이션 구성 및 키를 관리합니다</p>
                </div>
                <div className='flex items-center gap-2'>
                    {saveStatus === 'saving' && (
                        <Badge variant='secondary' className='gap-1'>
                            <Loader2 className='h-3 w-3 animate-spin' />
                            저장 중...
                        </Badge>
                    )}
                    {saveStatus === 'saved' && (
                        <Badge variant='default' className='gap-1 bg-green-500'>
                            <Check className='h-3 w-3' />
                            저장됨
                        </Badge>
                    )}
                    {saveStatus === 'error' && (
                        <Badge variant='destructive' className='gap-1'>
                            <AlertCircle className='h-3 w-3' />
                            저장 실패
                        </Badge>
                    )}
                </div>
            </div>

            {/* API Keys */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Key className='h-5 w-5' />
                        API 키
                    </CardTitle>
                    <CardDescription>API 액세스 키를 관리합니다</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {settings.api_keys.length === 0 ? (
                        <Alert>
                            <AlertDescription>API 키가 없습니다. 첫 번째 키를 추가해주세요.</AlertDescription>
                        </Alert>
                    ) : (
                        <div className='space-y-2'>
                            {settings.api_keys.map((key, index) => (
                                <div
                                    key={index}
                                    className='flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors'
                                >
                                    <code className='flex-1 text-sm font-mono select-none break-all'>
                                        {visibleKeys.has(key) ? key : isMobile ? '*'.repeat(20) : '*'.repeat(32)}
                                    </code>
                                    <div className='flex items-center gap-1 flex-shrink-0'>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => toggleKeyVisibility(key)}
                                            className='h-8 w-8 p-0'
                                            title={visibleKeys.has(key) ? '키 숨기기' : '키 표시'}
                                        >
                                            {visibleKeys.has(key) ? (
                                                <EyeOff className='h-4 w-4' />
                                            ) : (
                                                <Eye className='h-4 w-4' />
                                            )}
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => copyKey(key)}
                                            className='h-8 w-8 p-0'
                                            title='키 복사'
                                        >
                                            {copiedKeys.has(key) ? (
                                                <Check className='h-4 w-4 text-green-500' />
                                            ) : (
                                                <Copy className='h-4 w-4' />
                                            )}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>이 키를 삭제하시겠습니까?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        이 작업은 되돌릴 수 없습니다. 삭제 후 이 키를 사용하는 애플리케이션은 API에 액세스할 수 없습니다.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemoveApiKey(key)}>
                                                        삭제
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Separator />

                    <div className='space-y-2'>
                        <Label htmlFor='new-api-key'>새 API 키 추가</Label>
                        <div className='flex flex-wrap gap-2'>
                            <Input
                                id='new-api-key'
                                value={newApiKey}
                                onChange={e => setNewApiKey(e.target.value)}
                                placeholder='새 키를 입력하거나 생성하세요'
                                className='font-mono flex-1 min-w-0'
                            />
                            <div className='flex gap-2'>
                                <Button variant='outline' size='icon' onClick={() => generateNewKey('api')} title='새 키 생성'>
                                    <RefreshCw className='h-4 w-4' />
                                </Button>
                                <Button onClick={handleAddApiKey} disabled={!newApiKey}>
                                    추가
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Admin Keys */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Shield className='h-5 w-5' />
                        관리자 키
                    </CardTitle>
                    <CardDescription>관리자 액세스 키를 관리합니다</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {settings.admin_api_keys.length === 0 ? (
                        <Alert>
                            <AlertDescription>관리자 키가 없습니다. 첫 번째 키를 추가해주세요.</AlertDescription>
                        </Alert>
                    ) : (
                        <div className='space-y-2'>
                            {settings.admin_api_keys.map((key, index) => (
                                <div
                                    key={index}
                                    className='flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors'
                                >
                                    <code className='flex-1 text-sm font-mono select-none break-all'>
                                        {visibleKeys.has(key) ? key : isMobile ? '*'.repeat(20) : '*'.repeat(32)}
                                    </code>
                                    <div className='flex items-center gap-1 flex-shrink-0'>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => toggleKeyVisibility(key)}
                                            className='h-8 w-8 p-0'
                                            title={visibleKeys.has(key) ? '키 숨기기' : '키 표시'}
                                        >
                                            {visibleKeys.has(key) ? (
                                                <EyeOff className='h-4 w-4' />
                                            ) : (
                                                <Eye className='h-4 w-4' />
                                            )}
                                        </Button>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => copyKey(key)}
                                            className='h-8 w-8 p-0'
                                            title='키 복사'
                                        >
                                            {copiedKeys.has(key) ? (
                                                <Check className='h-4 w-4 text-green-500' />
                                            ) : (
                                                <Copy className='h-4 w-4' />
                                            )}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>이 키를 삭제하시겠습니까?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        이 작업은 되돌릴 수 없습니다. 삭제 후 이 키로 관리 패널에 액세스할 수 없습니다.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemoveAdminKey(key)}>
                                                        삭제
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Separator />

                    <div className='space-y-2'>
                        <Label htmlFor='new-admin-key'>새 관리자 키 추가</Label>
                        <div className='flex flex-wrap gap-2'>
                            <Input
                                id='new-admin-key'
                                value={newAdminKey}
                                onChange={e => setNewAdminKey(e.target.value)}
                                placeholder='새 키를 입력하거나 생성하세요'
                                className='font-mono flex-1 min-w-0'
                            />
                            <div className='flex gap-2'>
                                <Button
                                    variant='outline'
                                    size='icon'
                                    onClick={() => generateNewKey('admin')}
                                    title='새 키 생성'
                                >
                                    <RefreshCw className='h-4 w-4' />
                                </Button>
                                <Button onClick={handleAddAdminKey} disabled={!newAdminKey}>
                                    추가
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Claude Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Globe className='h-5 w-5' />
                        Claude 설정
                    </CardTitle>
                    <CardDescription>Claude AI 관련 설정을 구성합니다</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div className='space-y-2'>
                            <Label htmlFor='claude-ai-url'>Claude AI URL</Label>
                            <Input
                                id='claude-ai-url'
                                value={settings.claude_ai_url}
                                onChange={e => updateSettings({ ...settings, claude_ai_url: e.target.value })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='claude-api-baseurl'>Claude API Base URL</Label>
                            <Input
                                id='claude-api-baseurl'
                                value={settings.claude_api_baseurl}
                                onChange={e => updateSettings({ ...settings, claude_api_baseurl: e.target.value })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='space-y-2 md:col-span-2'>
                            <Label htmlFor='proxy-url'>프록시 URL (선택 사항)</Label>
                            <Input
                                id='proxy-url'
                                value={settings.proxy_url || ''}
                                onChange={e => updateSettings({ ...settings, proxy_url: e.target.value || null })}
                                onBlur={() => handleFieldChange(settings)}
                                placeholder='비워두면 프록시를 사용하지 않습니다'
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chat Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Sliders className='h-5 w-5' />
                        포맷 설정
                    </CardTitle>
                    <CardDescription>컨텍스트 포맷을 사용자 정의합니다</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='custom-prompt'>사용자 정의 프롬프트 (선택 사항)</Label>
                        <Textarea
                            id='custom-prompt'
                            value={settings.custom_prompt || ''}
                            onChange={e => updateSettings({ ...settings, custom_prompt: e.target.value || null })}
                            onBlur={() => handleFieldChange(settings)}
                            placeholder='사용자 정의 시스템 프롬프트를 입력하세요...'
                            className='min-h-[100px]'
                        />
                    </div>

                    <Separator />

                    <div className='grid gap-4 md:grid-cols-3'>
                        <div className='space-y-2'>
                            <Label htmlFor='human-name'>사용자 이름</Label>
                            <Input
                                id='human-name'
                                value={settings.human_name}
                                onChange={e => updateSettings({ ...settings, human_name: e.target.value })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='assistant-name'>어시스턴트 이름</Label>
                            <Input
                                id='assistant-name'
                                value={settings.assistant_name}
                                onChange={e => updateSettings({ ...settings, assistant_name: e.target.value })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='padtxt-length'>패딩 길이</Label>
                            <Input
                                id='padtxt-length'
                                type='number'
                                value={settings.padtxt_length}
                                onChange={e => updateSettings({ ...settings, padtxt_length: parseInt(e.target.value) || 0 })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <div className='space-y-0.5'>
                                <Label htmlFor='use-real-roles'>실제 역할 사용</Label>
                                <p className='text-sm text-muted-foreground'>활성화하면 실제 역할 접두사를 사용합니다</p>
                            </div>
                            <Switch
                                id='use-real-roles'
                                checked={settings.use_real_roles}
                                onCheckedChange={checked => handleFieldChange({ ...settings, use_real_roles: checked })}
                            />
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='space-y-0.5'>
                                <Label htmlFor='allow-external-images'>외부 이미지 허용</Label>
                                <p className='text-sm text-muted-foreground'>리버스 프록시를 통해 외부 이미지 로드를 허용합니다</p>
                            </div>
                            <Switch
                                id='allow-external-images'
                                checked={settings.allow_external_images}
                                onCheckedChange={checked => handleFieldChange({ ...settings, allow_external_images: checked })}
                            />
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='space-y-0.5'>
                                <Label htmlFor='preserve-chats'>채팅 기록 보관</Label>
                                <p className='text-sm text-muted-foreground'>나중에 볼 수 있도록 채팅 기록을 보관합니다</p>
                            </div>
                            <Switch
                                id='preserve-chats'
                                checked={settings.preserve_chats}
                                onCheckedChange={checked => handleFieldChange({ ...settings, preserve_chats: checked })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}