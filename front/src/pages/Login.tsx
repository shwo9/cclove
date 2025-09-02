import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { statisticsApi } from '../api/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function Login() {
    const [adminKey, setAdminKey] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // admin key 저장
            localStorage.setItem('adminKey', adminKey)

            // statistics API를 사용하여 Admin Key 확인
            await statisticsApi.get()

            // 성공 시 리디렉션
            navigate('/')
        } catch (err) {
            setError('Admin Key가 유효하지 않거나 서버 연결에 실패했습니다')
            localStorage.removeItem('adminKey')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 relative overflow-hidden">
            {/* 장식용 배경 요소 */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-72 h-72 bg-pink-200 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-100 rounded-full filter blur-3xl animate-pulse animation-delay-4000"></div>
            </div>
            
            <Card className="w-full max-w-md relative z-10 shadow-xl border-0 backdrop-blur-sm bg-white/95">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <span className="text-3xl font-bold text-white">C</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">돌아오신 것을 환영합니다</CardTitle>
                    <CardDescription>
                        관리자 패널에 액세스하려면 Admin Key를 입력하세요
                    </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-key">Admin Key</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="admin-key"
                                    type="password"
                                    placeholder="관리자 키를 입력하세요"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !adminKey.trim()}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? '확인 중...' : '로그인'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            
            <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
                <p>Clove - 최선을 다하는 Claude 리버스 프록시!</p>
            </div>
        </div>
    )
}