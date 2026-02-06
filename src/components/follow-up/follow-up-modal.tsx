
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Phone, MessageSquare, Users, Mail, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const followUpSchema = z.object({
    follow_up_type: z.enum(['call', 'message', 'meeting', 'email']),
    scheduled_at: z.date({
        required_error: "Tarih seçilmelidir.",
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Geçerli bir saat giriniz."),
    notes: z.string().optional(),
    remind_15_min: z.boolean().default(false),
    remind_1_hour: z.boolean().default(false),
    remind_1_day: z.boolean().default(false),
});

interface FollowUpModalProps {
    clientId: string;
    clientName: string;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export default function FollowUpModal({ clientId, clientName, trigger, onSuccess }: FollowUpModalProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const form = useForm<z.infer<typeof followUpSchema>>({
        resolver: zodResolver(followUpSchema),
        defaultValues: {
            follow_up_type: 'call',
            remind_15_min: true,
            remind_1_hour: true,
            remind_1_day: false,
            time: '10:00',
        },
    });

    async function onSubmit(values: z.infer<typeof followUpSchema>) {
        try {
            // Combine date and time
            const scheduledDate = new Date(values.scheduled_at);
            const [hours, minutes] = values.time.split(':');
            scheduledDate.setHours(parseInt(hours), parseInt(minutes));

            const response = await fetch('/api/follow-ups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    scheduled_at: scheduledDate.toISOString(),
                    follow_up_type: values.follow_up_type,
                    notes: values.notes,
                    remind_15_min: values.remind_15_min,
                    remind_1_hour: values.remind_1_hour,
                    remind_1_day: values.remind_1_day,
                }),
            });

            if (!response.ok) throw new Error('Failed to create follow-up');

            toast({
                title: "Başarılı",
                description: "Takip planlandı.",
            });

            setOpen(false);
            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Takip oluşturulurken bir hata oluştu.",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm"><Clock className="mr-2 h-4 w-4" /> Takip Planla</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Takip Planla - {clientName}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="follow_up_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Takip Türü</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tür seçin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="call"><div className="flex items-center"><Phone className="mr-2 h-4 w-4" /> Telefon Araması</div></SelectItem>
                                            <SelectItem value="message"><div className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> Mesaj (WP/SMS)</div></SelectItem>
                                            <SelectItem value="meeting"><div className="flex items-center"><Users className="mr-2 h-4 w-4" /> Yüz Yüze Toplantı</div></SelectItem>
                                            <SelectItem value="email"><div className="flex items-center"><Mail className="mr-2 h-4 w-4" /> E-posta</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="scheduled_at"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Tarih</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: tr })
                                                        ) : (
                                                            <span>Tarih seçin</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Saat</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notlar</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ne konuşulacak?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hatırlatmalar</h4>
                            <div className="flex flex-col gap-2">
                                <FormField
                                    control={form.control}
                                    name="remind_15_min"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="font-normal">
                                                    15 dakika önce
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="remind_1_hour"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="font-normal">
                                                    1 saat önce
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="remind_1_day"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="font-normal">
                                                    1 gün önce
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full">Planla</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
