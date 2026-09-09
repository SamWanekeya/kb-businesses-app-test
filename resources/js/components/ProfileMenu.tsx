import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/UserInterface/DropdownMenu';
import { Link, router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfileMenu() {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const user = auth?.user;

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const initials = user?.name
        ? user.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
        : 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="link">
                    <span className="hidden text-sm font-medium md:inline-block">{user?.name}</span>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm leading-none font-medium">{user?.name}</p>
                        <p className="text-muted-foreground text-xs leading-none">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href={route('my-hafinen-account.success')}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{translate('My Hafinen account')}</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{translate('Sign out')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
