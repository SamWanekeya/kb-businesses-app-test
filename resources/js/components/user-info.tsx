import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/avatar';
import { useInitials } from '@hooks/use-initials';

export function UserInfo({
    user,
    showEmail = false,
    className = '',
    position,
}: {
    user: User;
    showEmail?: boolean;
    className?: string;
    position: 'left' | 'right';
}) {
    const getInitials = useInitials();

    return (
        <div className={`flex w-full items-center gap-2 ${position === 'right' ? 'flex-row-reverse text-right' : ''}`}>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className={`grid flex-1 text-sm leading-tight ${className}`}>
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
            </div>
        </div>
    );
}
