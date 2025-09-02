import { useEffect, useState } from 'react'
import {
    Plus,
    Pencil,
    Trash2,
    Cookie,
    Shield,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreHorizontal,
    Users,
    ChevronRight,
    KeyRound,
    FileText,
} from 'lucide-react'
import type { AccountResponse } from '../api/types'
import { accountsApi } from '../api/client'
import { AccountModal } from '../components/AccountModal'
import { OAuthModal } from '../components/OAuthModal'
import { BatchCookieModal } from '../components/BatchCookieModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useIsMobile } from '@/hooks/use-mobile'

export function Accounts() {
    const [accounts, setAccounts] = useState<AccountResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [oauthModalOpen, setOauthModalOpen] = useState(false)
    const [batchModalOpen, setBatchModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
    const isMobile = useIsMobile()

    const loadAccounts = async () => {
        try {
            const response = await accountsApi.list()
            setAccounts(response.data)
        } catch (error) {
            console.error('Failed to load accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAccounts()
    }, [])

    const handleDelete = async () => {
        if (!accountToDelete) return

        try {
            await accountsApi.delete(accountToDelete)
            await loadAccounts()
            setDeleteDialogOpen(false)
            setAccountToDelete(null)
        } catch (error) {
            console.error('Failed to delete account:', error)
            alert('계정 삭제 실패')
        }
    }

    const handleEdit = (account: AccountResponse) => {
        setEditingAccount(account)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setEditingAccount(null)
        setModalOpen(true)
    }

    const handleModalClose = () => {
        setModalOpen(false)
        setEditingAccount(null)
        loadAccounts()
    }

    const handleOAuthModalClose = () => {
        setOauthModalOpen(false)
        loadAccounts()
    }

    const handleBatchModalClose = () => {
        setBatchModalOpen(false)
        loadAccounts()
    }

    const toggleCardExpansion = (uuid: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev)
            if (next.has(uuid)) {
                next.delete(uuid)
            } else {
                next.add(uuid)
            }
            return next
        })
    }

    const getAuthTypeIcon = (authType: string) => {
        if (authType === 'both') {
            return <Shield className='h-4 w-4' />
        } else if (authType === 'oauth_only') {
            return <KeyRound className='h-4 w-4' />
        } else {
            return <Cookie className='h-4 w-4' />
        }
    }

    const getAuthTypeName = (authType: string) => {
        switch (authType) {
            case 'cookie_only':
                return 'Cookie'
            case 'oauth_only':
                return 'OAuth'
            case 'both':
                return 'Cookie + OAuth'
            default:
                return authType
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid':
                return <CheckCircle className='h-4 w-4 text-green-500' />
            case 'invalid':
                return <XCircle className='h-4 w-4 text-red-500' />
            case 'rate_limited':
                return <AlertCircle className='h-4 w-4 text-yellow-500' />
            default:
                return null
        }
    }

    const getStatusName = (status: string) => {
        switch (status) {
            case 'valid':
                return '정상'
            case 'invalid':
                return '유효하지 않음'
            case 'rate_limited':
                return '속도 제한 중'
            default:
                return status
        }
    }

    const AccountTypeBadge = ({ account }: { account: AccountResponse }) => {
        if (account.is_max) {
            return (
                <Badge variant='default' className='bg-gradient-to-r from-purple-500 to-pink-500'>
                    Max
                </Badge>
            )
        } else if (account.is_pro) {
            return (
                <Badge variant='secondary' className='bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
                    Pro
                </Badge>
            )
        } else {
            return <Badge variant='outline'>Free</Badge>
        }
    }

    const MobileAccountCard = ({ account }: { account: AccountResponse }) => {
        const isExpanded = expandedCards.has(account.organization_uuid)

        return (
            <Card className='mb-4'>
                <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpansion(account.organization_uuid)}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className='cursor-pointer'>
                            <div className='flex items-start justify-between'>
                                <div className='flex-1 space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <AccountTypeBadge account={account} />
                                        <div className='flex items-center gap-1'>
                                            {getStatusIcon(account.status)}
                                            <span className='text-sm'>{getStatusName(account.status)}</span>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                        {getAuthTypeIcon(account.auth_type)}
                                        <span>{getAuthTypeName(account.auth_type)}</span>
                                    </div>
                                    <p className='font-mono text-xs text-muted-foreground truncate'>
                                        {account.organization_uuid}
                                    </p>
                                </div>
                                <ChevronRight
                                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                                        isExpanded ? 'rotate-90' : ''
                                    }`}
                                />
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className='pt-0 space-y-3'>
                            <div className='space-y-2 text-sm'>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>마지막 사용</span>
                                    <span>{new Date(account.last_used).toLocaleString('ko-KR')}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>재설정 시간</span>
                                    <span>{account.resets_at ? new Date(account.resets_at).toLocaleString('ko-KR') : '-'}</span>
                                </div>
                            </div>
                            <div className='flex gap-2 pt-2'>
                                <Button size='sm' variant='outline' className='flex-1' onClick={() => handleEdit(account)}>
                                    <Pencil className='mr-2 h-4 w-4' />
                                    편집
                                </Button>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    className='flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                                    onClick={() => {
                                        setAccountToDelete(account.organization_uuid)
                                        setDeleteDialogOpen(true)
                                    }}
                                >
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    삭제
                                </Button>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        )
    }

    if (isMobile === undefined) {
        return null
    }

    if (loading) {
        return (
            <div className='space-y-6'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div className='space-y-2'>
                        <Skeleton className='h-8 w-32 sm:w-48' />
                        <Skeleton className='h-4 w-64 sm:w-96 max-w-full' />
                    </div>
                    <Skeleton className='h-10 w-full sm:w-32' />
                </div>

                {!isMobile ? (
                    <Card>
                        <CardContent className='p-0'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Skeleton className='h-4 w-32' />
                                        </TableHead>
                                        <TableHead>
                                            <Skeleton className='h-4 w-24' />
                                        </TableHead>
                                        <TableHead>
                                            <Skeleton className='h-4 w-16' />
                                        </TableHead>
                                        <TableHead>
                                            <Skeleton className='h-4 w-24' />
                                        </TableHead>
                                        <TableHead>
                                            <Skeleton className='h-4 w-32' />
                                        </TableHead>
                                        <TableHead>
                                            <Skeleton className='h-4 w-32' />
                                        </TableHead>
                                        <TableHead className='text-right'>
                                            <Skeleton className='h-4 w-16 ml-auto' />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Skeleton className='h-4 w-64' />
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    <Skeleton className='h-4 w-4 rounded' />
                                                    <Skeleton className='h-4 w-16' />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    <Skeleton className='h-4 w-4 rounded-full' />
                                                    <Skeleton className='h-4 w-12' />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className='h-6 w-16 rounded-full' />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className='h-4 w-32' />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className='h-4 w-32' />
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                <Skeleton className='h-8 w-8 rounded ml-auto' />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <div className='space-y-4'>
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className='overflow-hidden'>
                                <CardHeader className='pb-3'>
                                    <div className='flex items-start justify-between'>
                                        <div className='flex-1 space-y-3'>
                                            <div className='flex items-center gap-2'>
                                                <Skeleton className='h-5 w-12 rounded-full' />
                                                <div className='flex items-center gap-1'>
                                                    <Skeleton className='h-4 w-4 rounded-full' />
                                                    <Skeleton className='h-4 w-12' />
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Skeleton className='h-4 w-4 rounded' />
                                                <Skeleton className='h-4 w-24' />
                                            </div>
                                            <Skeleton className='h-3 w-full max-w-[280px]' />
                                        </div>
                                        <Skeleton className='h-5 w-5 rounded' />
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight pb-1'>계정 관리</h1>
                    <p className='text-muted-foreground'>Claude 계정을 관리합니다</p>
                </div>
                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    <Button onClick={() => setOauthModalOpen(true)} variant='outline' className='w-full sm:w-auto'>
                        <KeyRound className='mr-2 h-4 w-4' />
                        OAuth 로그인
                    </Button>
                    <Button onClick={() => setBatchModalOpen(true)} variant='outline' className='w-full sm:w-auto'>
                        <FileText className='mr-2 h-4 w-4' />
                        일괄 추가
                    </Button>
                    <Button onClick={handleAdd} className='w-full sm:w-auto'>
                        <Plus className='mr-2 h-4 w-4' />
                        쿠키 추가
                    </Button>
                </div>
            </div>

            {accounts.length === 0 ? (
                <Card>
                    <CardContent className='flex flex-col items-center justify-center py-12'>
                        <div className='rounded-full bg-muted p-6 mb-4'>
                            <Users className='h-12 w-12 text-muted-foreground' />
                        </div>
                        <h3 className='text-lg font-semibold mb-2'>계정 없음</h3>
                        <p className='text-muted-foreground mb-4 text-center'>"쿠키 추가" 또는 "OAuth 로그인"을 클릭하여 첫 번째 계정을 만드세요</p>
                        <div className='flex flex-col sm:flex-row gap-2'>
                            <Button onClick={() => setOauthModalOpen(true)} variant='outline'>
                                <KeyRound className='mr-2 h-4 w-4' />
                                OAuth 로그인
                            </Button>
                            <Button onClick={() => setBatchModalOpen(true)} variant='outline'>
                                <FileText className='mr-2 h-4 w-4' />
                                일괄 추가
                            </Button>
                            <Button onClick={handleAdd}>
                                <Plus className='mr-2 h-4 w-4' />
                                쿠키 추가
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : !isMobile ? (
                <Card>
                    <CardContent className='p-0 overflow-x-auto'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization UUID</TableHead>
                                    <TableHead>인증 방식</TableHead>
                                    <TableHead>상태</TableHead>
                                    <TableHead>계정 유형</TableHead>
                                    <TableHead>마지막 사용</TableHead>
                                    <TableHead>재설정 시간</TableHead>
                                    <TableHead className='text-right'>작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map(account => (
                                    <TableRow key={account.organization_uuid}>
                                        <TableCell className='font-mono text-sm'>{account.organization_uuid}</TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                {getAuthTypeIcon(account.auth_type)}
                                                <span>{getAuthTypeName(account.auth_type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                {getStatusIcon(account.status)}
                                                <span>{getStatusName(account.status)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <AccountTypeBadge account={account} />
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {new Date(account.last_used).toLocaleString('ko-KR')}
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {account.resets_at ? new Date(account.resets_at).toLocaleString('ko-KR') : '-'}
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                                                        <span className='sr-only'>메뉴 열기</span>
                                                        <MoreHorizontal className='h-4 w-4' />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align='end'>
                                                    <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                        <Pencil className='mr-2 h-4 w-4' />
                                                        편집
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAccountToDelete(account.organization_uuid)
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                        className='text-destructive'
                                                    >
                                                        <Trash2 className='mr-2 h-4 w-4' />
                                                        삭제
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    {accounts.map(account => (
                        <MobileAccountCard key={account.organization_uuid} account={account} />
                    ))}
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>이 계정을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 삭제 후 계정은 Clove에서 제거되지만 Claude.ai의 데이터에는 영향을 미치지 않습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {modalOpen && <AccountModal account={editingAccount} onClose={handleModalClose} />}
            {oauthModalOpen && <OAuthModal onClose={handleOAuthModalClose} />}
            {batchModalOpen && <BatchCookieModal onClose={handleBatchModalClose} />}
        </div>
    )
}