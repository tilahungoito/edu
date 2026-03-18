import { redirect } from 'next/navigation';

export default function SystemRootPage() {
    redirect('/system/settings/config');
}
