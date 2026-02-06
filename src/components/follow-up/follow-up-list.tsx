
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Phone, MessageSquare, Users, Mail, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface FollowUp {
    id: string;
    client_id: string;
    clients: { full_name: string };
    scheduled_at: string;
    follow_up_type: 'call' | 'message' | 'meeting' | 'email';
    notes: string;
    status: 'pending' | 'completed' | 'missed' | 'rescheduled';
}

export default function FollowUpList() {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { toast } = useToast();

    const fetchFollowUps = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Get agent id first
            const { data: agent } = await supabase.from('agents').select('id').eq('auth_user_id', user.id).single();

            if (agent) {
                const { data } = await supabase
                    .from('follow_ups')
                    .select('*, clients(full_name)')
                    .eq('agent_id', agent.id)
                    .eq('status', 'pending')
                    .order('scheduled_at', { ascending: true })
                    .limit(10);

                if (data) setFollowUps(data as any);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const markAsCompleted = async (id: string) => {
        try {
            const { error } = await supabase
                .from('follow_ups')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Takip tamamlandı" });
            fetchFollowUps();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "İşlem başarısız oldu."
            });
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="h-4 w-4" />;
            case 'message': return <MessageSquare className="h-4 w-4" />;
            case 'meeting': return <Users className="h-4 w-4" />;
            case 'email': return <Mail className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'call': return 'Arama';
            case 'message': return 'Mesaj';
            case 'meeting': return 'Toplantı';
            case 'email': return 'E-posta';
            default: return 'Takip';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Yaklaşan Takipler</h3>
                </div>
                <Badge variant="secondary" className="bg-white">{followUps.length}</Badge>
            </div>

            <ScrollArea className="flex-1">
                <div className="divide-y divide-gray-100">
                    {followUps.length === 0 && !loading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            Planlanmış takip bulunmuyor.
                        </div>
                    ) : (
                        followUps.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-1 h-5 w-5 rounded-full border border-gray-300 hover:bg-green-50 hover:text-green-600 hover:border-green-600 p-0 shrink-0"
                                    onClick={() => markAsCompleted(item.id)}
                                >
                                    <CheckCircle2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </Button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {item.clients?.full_name || 'Bilinmeyen Müşteri'}
                                        </p>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                                            item.follow_up_type === 'call' ? "bg-blue-50 text-blue-700" :
                                                item.follow_up_type === 'message' ? "bg-green-50 text-green-700" :
                                                    item.follow_up_type === 'meeting' ? "bg-purple-50 text-purple-700" :
                                                        "bg-orange-50 text-orange-700"
                                        )}>
                                            {getTypeIcon(item.follow_up_type)}
                                            {getTypeLabel(item.follow_up_type)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(item.scheduled_at), "d MMMM, HH:mm", { locale: tr })}
                                    </div>

                                    {item.notes && (
                                        <p className="mt-1 text-xs text-gray-600 line-clamp-1 italic">
                                            "{item.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
