import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/avatar';
import { Button } from '@components/UserInterface/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/UserInterface/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ProfileMenu() {
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
                <Button variant="ghost" className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-2 min-[992px]:h-12 min-[992px]:px-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col text-start min-[992px]:flex">
                        <span className="text-sm font-medium">{user?.name}</span>
                        <span className="text-muted-foreground text-xs">{user?.email}</span>
                    </div>
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
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
                        <Link href={route('profile')}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{translate('Profile')}</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{translate('Log out')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
