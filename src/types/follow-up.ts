export type FollowUpType = 'call' | 'message' | 'meeting' | 'email';
export type FollowUpStatus = 'pending' | 'completed' | 'missed' | 'rescheduled';

export interface FollowUp {
    id: string;
    agent_id: string;
    client_id: string;
    scheduled_at: string;
    follow_up_type: FollowUpType;
    notes?: string;
    status: FollowUpStatus;
    completed_at?: string;
    remind_15_min: boolean;
    remind_1_hour: boolean;
    remind_1_day: boolean;
    created_at: string;
    updated_at: string;

    // Joined fields
    clients?: {
        id: string;
        full_name: string;
        phone: string;
        email: string;
    };
}
