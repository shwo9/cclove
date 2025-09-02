import { useState } from 'react'
import { ExternalLink, Info, Loader2, AlertCircle } from 'lucide-react'
import { accountsApi } from '../api/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIsMobile } from '@/hooks/use-mobile'
import { isValidUUID, formatUUID } from '@/utils/validators'
import { cn } from '@/lib/utils'

interface OAuthModalProps {
    onClose: () => void
}

// Claude OAuth constants
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
const AUTHORIZE_URL = 'https://claude.ai/oauth/authorize'
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback'

export function OAuthModal({ onClose }: OAuthModalProps) {
    const [organizationUuid, setOrganizationUuid] = useState('')
    const [accountType, setAccountType] = useState<'Pro' | 'Max'>('Pro')
    const [authCode, setAuthCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [uuidError, setUuidError] = useState('')
    const [step, setStep] = useState<'input' | 'code'>('input')
    const [pkceVerifier, setPkceVerifier] = useState('')
    const isMobile = useIsMobile()

    // PKCE generation functions
    const generatePKCE = () => {
        // Generate random verifier
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        const verifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')

        // Generate challenge
        const encoder = new TextEncoder()
        const data = encoder.encode(verifier)
        return crypto.subtle.digest('SHA-256', data).then(buffer => {
            const challenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')
            return { verifier, challenge }
        })
    }

    const handleGenerateUrl = async () => {
        if (!organizationUuid.trim()) {
            setError('Organization UUID를 입력하세요')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { verifier, challenge } = await generatePKCE()
            setPkceVerifier(verifier)

            // Build authorization URL
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: CLIENT_ID,
                organization_uuid: formatUUID(organizationUuid),
                redirect_uri: REDIRECT_URI,
                scope: 'user:profile user:inference',
                state: verifier,
                code_challenge: challenge,
                code_challenge_method: 'S256',
            })

            const authUrl = `${AUTHORIZE_URL}?${params.toString()}`

            // Open in new window
            window.open(authUrl, '_blank', 'width=600,height=700')

            setStep('code')
        } catch (err) {
            setError('인증 URL 생성 실패')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleExchangeToken = async () => {
        if (!authCode.trim()) {
            setError('인증 코드를 입력하세요')
            return
        }

        setLoading(true)
        setError('')

        try {
            // 토큰 교환을 위해 코드를 백엔드로 보냅니다
            const exchangeData = {
                organization_uuid: formatUUID(organizationUuid),
                code: authCode,
                pkce_verifier: pkceVerifier,
                capabilities:
                    accountType === 'Max' ? ['chat', 'claude_max'] : accountType === 'Pro' ? ['chat', 'claude_pro'] : ['chat'],
            }

            await accountsApi.exchangeOAuthCode(exchangeData)
            onClose()
        } catch (err) {
            console.error('OAuth exchange error:', err)
            setError('인증에 실패했습니다. 다시 시도해주세요')
        } finally {
            setLoading(false)
        }
    }

    const formContent = (
        <>
            <Alert className={cn(isMobile && 'mb-4')}>
                <Info className='h-4 w-4' />
                <AlertDescription>
                    쿠키를 사용하여 계정을 추가하는 것을 권장합니다. Clove는 자동으로 인증을 완료할 수 있습니다. OAuth 로그인은 대안으로만 사용됩니다.
                </AlertDescription>
            </Alert>

            {step === 'input' ? (
                <div className='grid gap-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='organization_uuid'>
                            Organization UUID <span className='text-destructive'>*</span>
                        </Label>
                        <Input
                            id='organization_uuid'
                            placeholder='Organization UUID를 입력하세요'
                            value={organizationUuid}
                            onChange={e => {
                                const value = e.target.value
                                setOrganizationUuid(value)
                                // UUID 형식 확인
                                const formatted = formatUUID(value)
                                if (formatted && !isValidUUID(formatted)) {
                                    setUuidError('유효한 UUID 형식을 입력하세요')
                                } else {
                                    setUuidError('')
                                }
                            }}
                            className={`font-mono ${uuidError && organizationUuid ? 'border-destructive' : ''}`}
                        />
                        {uuidError && organizationUuid ? (
                            <div className='flex items-center gap-1 text-sm text-destructive'>
                                <AlertCircle className='h-3 w-3' />
                                <span>{uuidError}</span>
                            </div>
                        ) : (
                            <p className='text-sm text-muted-foreground'>Claude.ai 쿠키의 lastActiveOrg 필드에서 찾을 수 있습니다</p>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='accountType'>계정 유형</Label>
                        <Select value={accountType} onValueChange={value => setAccountType(value as any)}>
                            <SelectTrigger className='w-full' id='accountType'>
                                <SelectValue placeholder='계정 유형 선택' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='Pro'>Pro</SelectItem>
                                <SelectItem value='Max'>Max</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <Alert variant='destructive'>
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
            ) : (
                <div className='grid gap-4'>
                    <Alert>
                        <Info className='h-4 w-4' />
                        <AlertDescription>
                            새 창에서 인증 페이지가 열렸습니다. 인증을 완료한 후 인증 코드를 복사하여 아래 입력란에 붙여넣으세요.
                        </AlertDescription>
                    </Alert>

                    <div className='space-y-2'>
                        <Label htmlFor='auth_code'>
                            인증 코드 <span className='text-destructive'>*</span>
                        </Label>
                        <Input
                            id='auth_code'
                            placeholder='인증 코드를 붙여넣으세요'
                            value={authCode}
                            onChange={e => setAuthCode(e.target.value)}
                            className='font-mono'
                        />
                    </div>

                    {error && (
                        <Alert variant='destructive'>
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </>
    )

    const footerContent = (
        <>
            <Button type='button' variant='outline' onClick={onClose}>
                취소
            </Button>
            {step === 'input' ? (
                <Button
                    onClick={handleGenerateUrl}
                    disabled={loading || !organizationUuid.trim() || !isValidUUID(formatUUID(organizationUuid))}
                >
                    {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    {loading ? (
                        '생성 중...'
                    ) : (
                        <>
                            <ExternalLink className='mr-2 h-4 w-4' />
                            인증 시작
                        </>
                    )}
                </Button>
            ) : (
                <Button onClick={handleExchangeToken} disabled={loading || !authCode.trim()}>
                    {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    {loading ? '확인 중...' : '인증 완료'}
                </Button>
            )}
        </>
    )

    if (isMobile === undefined) {
        return null
    }

    if (!isMobile) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className='sm:max-w-[600px]'>
                    <DialogHeader>
                        <DialogTitle>OAuth 로그인</DialogTitle>
                        <DialogDescription>OAuth 방식으로 Claude 계정 추가</DialogDescription>
                    </DialogHeader>
                    {formContent}
                    <DialogFooter>{footerContent}</DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={true} onOpenChange={onClose}>
            <DrawerContent>
                <div className='max-h-[90vh] overflow-auto'>
                    <DrawerHeader>
                        <DrawerTitle>OAuth 로그인</DrawerTitle>
                        <DrawerDescription>OAuth 방식으로 Claude 계정 추가</DrawerDescription>
                    </DrawerHeader>
                    <div className='px-4'>{formContent}</div>
                    <DrawerFooter className='flex-row justify-end space-x-2'>{footerContent}</DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}