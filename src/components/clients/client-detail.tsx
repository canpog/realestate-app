'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Phone, Mail, Wallet, ArrowLeft, Plus, MessageSquare, Target, Sparkles, Trash2, Edit2, Calendar, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FollowUpList from '@/components/follow-ups/follow-up-list';
import FollowUpModal from '@/components/follow-ups/follow-up-modal';
import { summarizeNotesAction, getSmartSuggestionsAction, analyzeSentimentAction } from '@/app/actions/ai';
import { type SentimentAnalysis } from '@/lib/ai/sentiment-analysis';

interface Client {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    status: string;
    budget_min?: number;
    budget_max?: number;
    currency: string;
    wanted_types?: string[];
    wanted_city?: string;
    wanted_districts?: string[];
    wanted_purpose?: string;
    last_contact_at?: string;
}

interface Note {
    id: string;
    note: string;
    created_at: string;
}

interface MatchResult {
    listing_id: string;
    score: number;
    reason: string;
    pros: string[];
    cons: string[];
    listing_details?: any; // To store fetched listing data
}

export default function ClientDetailClient({ client: initialClient, clientId }: { client: Client; clientId: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [client, setClient] = useState<Client>(initialClient);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'notes' | 'matches' | 'followups'>('notes');
    const [deleting, setDeleting] = useState(false);

    // Follow-up States
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [refreshFollowUps, setRefreshFollowUps] = useState(0);

    // AI Matching States
    const [matching, setMatching] = useState(false);
    const [matches, setMatches] = useState<MatchResult[] | null>(null);
    const [matchSummary, setMatchSummary] = useState<string | null>(null);

    // AI Summarize States
    const [summarizing, setSummarizing] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    // Sentiment State
    const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);

    // Load notes on mount
    useEffect(() => {
        loadNotes();
        loadSentiment();
    }, [clientId]);

    const loadSentiment = async () => {
        try {
            const result = await analyzeSentimentAction(clientId);
            setSentiment(result);
        } catch (e) {
            console.error(e);
        }
    };

    const loadNotes = async () => {
        const { data } = await supabase
            .from('client_notes')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        if (data) setNotes(data);
    };

    const addNote = async () => {
        if (!newNote.trim()) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('auth_user_id', user?.id)
                .single();

            if (!agent) throw new Error('Agent not found');

            const { error } = await supabase
                .from('client_notes')
                .insert({
                    client_id: clientId,
                    agent_id: agent.id,
                    note: newNote.trim()
                });

            if (error) throw error;

            // Update last_contact_at
            await supabase
                .from('clients')
                .update({ last_contact_at: new Date().toISOString() })
                .eq('id', clientId);

            setNewNote('');
            loadNotes();
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (noteId: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('client_notes')
            .delete()
            .eq('id', noteId);

        if (!error) {
            setNotes(notes.filter(n => n.id !== noteId));
        }
    };

    const deleteClient = async () => {
        if (!confirm('Bu müşteriyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        setDeleting(true);

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (error) throw error;

            router.push('/clients');
            router.refresh();
        } catch (err: any) {
            alert('Hata: ' + err.message);
            setDeleting(false);
        }
    };

    const runMatching = async () => {
        setMatching(true);
        setMatches(null);
        setMatchSummary(null);

        try {
            const matches = await getSmartSuggestionsAction(clientId);

            // Enrich matches with listing details
            if (matches && matches.length > 0) {
                const listingIds = matches.map((m: any) => m.listing_id);
                const { data: listings } = await supabase
                    .from('listings')
                    .select('*, listing_media(storage_path, is_cover)')
                    .in('id', listingIds);

                const enrichedMatches = matches.map((match: any) => ({
                    ...match,
                    listing_details: listings?.find(l => l.id === match.listing_id)
                }));

                setMatches(enrichedMatches);
                setMatchSummary(`AI, ${matches.length} adet uygun portföy buldu.`);
            } else {
                setMatches([]);
                setMatchSummary('Uygun eşleşme bulunamadı.');
            }

        } catch (error: any) {
            alert('AI Eşleştirme hatası: ' + error.message);
        } finally {
            setMatching(false);
        }
    };

    const runSummarize = async () => {
        setSummarizing(true);
        setSummary(null);

        try {
            const summaryText = await summarizeNotesAction(clientId);
            setSummary(summaryText);
        } catch (error: any) {
            alert('AI Özetleme hatası: ' + error.message);
        } finally {
            setSummarizing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <Link
                    href="/clients"
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Müşteri Listesine Dön
                </Link>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFollowModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Takip Planla
                    </button>
                    <Link
                        href={`/clients/${clientId}/edit`}
                        className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 bg-white"
                    >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Düzenle
                    </Link>
                    <button
                        onClick={deleteClient}
                        disabled={deleting}
                        className="flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 bg-white"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? 'Siliniyor...' : 'Sil'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl mx-auto mb-4">
                            {client.full_name.charAt(0)}
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{client.full_name}</h1>
                        <span className={`mt-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                            {getStatusLabel(client.status)}
                        </span>

                        {sentiment && (
                            <div className={`mt-4 p-3 rounded-lg border text-sm ${sentiment.sentiment === 'positive' ? 'bg-green-50 border-green-200 text-green-800' :
                                    sentiment.sentiment === 'negative' ? 'bg-red-50 border-red-200 text-red-800' :
                                        'bg-gray-50 border-gray-200 text-gray-800'
                                }`}>
                                <div className="font-bold flex items-center justify-center gap-2">
                                    {sentiment.sentiment === 'positive' ? '😊 Olumlu' : sentiment.sentiment === 'negative' ? '😟 Olumsuz' : '😐 Nötr'}
                                    <span className="text-xs opacity-75">
                                        (Skor: {Math.round(sentiment.score * 100)})
                                    </span>
                                </div>
                                <p className="text-xs mt-1 opacity-90">{sentiment.description}</p>
                            </div>
                        )}

                        <div className="mt-6 space-y-4 text-left">
                            <ContactItem icon={<Phone className="h-4 w-4" />} value={client.phone || 'Telefon yok'} />
                            <ContactItem icon={<Mail className="h-4 w-4" />} value={client.email || 'E-posta yok'} />
                            <ContactItem icon={<Wallet className="h-4 w-4" />} value={`Bütçe: ${client.budget_max?.toLocaleString('tr-TR') || '0'} ${client.currency}`} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-blue-600" />
                            Arama Kriterleri
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Tercih Edilen Tipler</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {client.wanted_types?.length ? client.wanted_types.map((t: string) => (
                                        <span key={t} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">{getTypeLabel(t)}</span>
                                    )) : <span className="text-sm text-gray-400">Belirtilmemiş</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Lokasyon</p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {client.wanted_city || 'Belirtilmemiş'} {client.wanted_districts?.join(', ')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Amaç</p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {client.wanted_purpose === 'sale' ? 'Satın Alma' : client.wanted_purpose === 'rent' ? 'Kiralama' : 'Belirtilmemiş'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-sm">
                        <div className="flex border-b border-gray-100">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'notes' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Notlar ({notes.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('followups')}
                                className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'followups' ? 'text-green-600 border-green-600 bg-green-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Takipler
                            </button>
                            <button
                                onClick={() => setActiveTab('matches')}
                                className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'matches' ? 'text-purple-600 border-purple-600 bg-purple-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                AI Eşleştirme
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'notes' && (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-gray-900">Müşteri Notları</h3>
                                        <button
                                            onClick={runSummarize}
                                            disabled={summarizing || notes.length === 0}
                                            className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 text-sm font-medium transition-colors"
                                        >
                                            {summarizing ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 mr-2" />
                                            )}
                                            {summarizing ? 'Özetleniyor...' : 'AI ile Özetle'}
                                        </button>
                                    </div>

                                    {summary && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-indigo-900 flex items-center">
                                                    <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
                                                    Müşteri Profil Özeti
                                                </h4>
                                                <button onClick={() => setSummary(null)} className="text-indigo-400 hover:text-indigo-600">
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="text-indigo-900 text-sm whitespace-pre-wrap leading-relaxed">
                                                {summary.replace(/\*\*(.*?)\*\*/g, '$1')}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex space-x-3 mb-8">
                                        <input
                                            type="text"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addNote()}
                                            placeholder="Yeni not ekle..."
                                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={addNote}
                                            disabled={loading || !newNote.trim()}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {notes.length === 0 ? (
                                            <p className="text-center text-gray-400 italic py-8">Henüz not eklenmemiş.</p>
                                        ) : (
                                            notes.map((note) => (
                                                <div key={note.id} className="bg-gray-50 rounded-xl p-4 group relative">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-gray-700">{note.note}</p>
                                                            <p className="text-xs text-gray-400 mt-2 flex items-center">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {new Date(note.created_at).toLocaleDateString('tr-TR', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteNote(note.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}

                            {activeTab === 'matches' && (
                                <div className="space-y-6">
                                    {!matches && !matching && (
                                        <div className="text-center py-12">
                                            <div className="bg-purple-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                                <Sparkles className="h-10 w-10 text-purple-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Akıllı Portföy Eşleştirme</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                                Yapay zeka, müşterinizin kriterlerini ve notlarını analiz ederek en uygun portföyleri önerir.
                                            </p>
                                            <button
                                                onClick={runMatching}
                                                className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 active:scale-95"
                                            >
                                                Şimdi Analiz Et
                                            </button>
                                        </div>
                                    )}

                                    {matching && (
                                        <div className="text-center py-20">
                                            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900">Analiz Yapılıyor...</h3>
                                            <p className="text-gray-500">Müşteri notları ve portföyler taranıyor.</p>
                                        </div>
                                    )}

                                    {matches && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {matchSummary && (
                                                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                                    <h4 className="font-bold text-purple-900 mb-2 flex items-center">
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        AI Özeti
                                                    </h4>
                                                    <p className="text-purple-800 leading-relaxed text-sm">{matchSummary}</p>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {matches.map((match) => (
                                                    <div key={match.listing_id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-200 transition-colors">
                                                        <div className="flex flex-col md:flex-row gap-6">
                                                            {/* Listing Image */}
                                                            <div className="w-full md:w-48 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                                {match.listing_details?.listing_media?.[0] ? (
                                                                    <img
                                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${match.listing_details.listing_media[0].storage_path}`}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">Resim Yok</div>
                                                                )}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <Link href={`/listings/${match.listing_id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline">
                                                                            {match.listing_details?.title || 'Portföy #' + match.listing_id}
                                                                        </Link>
                                                                        <div className="text-purple-600 font-bold mt-1">
                                                                            Uyum Skoru: %{match.score}
                                                                        </div>
                                                                    </div>
                                                                    <Link href={`/listings/${match.listing_id}`} className="text-gray-400 hover:text-gray-600">
                                                                        <ArrowRight className="h-5 w-5" />
                                                                    </Link>
                                                                </div>

                                                                <p className="text-gray-600 text-sm mt-3 mb-4 font-medium bg-gray-50 p-2 rounded-lg">
                                                                    "{match.reason}"
                                                                </p>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="font-bold text-green-700 block mb-2 flex items-center">
                                                                            <CheckCircle2 className="h-4 w-4 mr-1" /> Artılar
                                                                        </span>
                                                                        <ul className="space-y-1">
                                                                            {match.pros.map((pro, i) => (
                                                                                <li key={i} className="text-gray-600 flex items-start">
                                                                                    <span className="mr-2">•</span> {pro}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-red-700 block mb-2 flex items-center">
                                                                            <XCircle className="h-4 w-4 mr-1" /> Eksiler / Riskler
                                                                        </span>
                                                                        <ul className="space-y-1">
                                                                            {match.cons.map((con, i) => (
                                                                                <li key={i} className="text-gray-600 flex items-start">
                                                                                    <span className="mr-2">•</span> {con}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {matches.length === 0 && (
                                                    <div className="text-center py-10 text-gray-500">
                                                        Uygun eşleşme bulunamadı.
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={runMatching}
                                                className="w-full py-4 text-center text-purple-600 font-bold hover:bg-purple-50 rounded-xl transition-colors"
                                            >
                                                Yeniden Analiz Et
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'followups' && (
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">Planlanmış Takipler</h3>
                                        <button
                                            onClick={() => setShowFollowModal(true)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            + Yeni Ekle
                                        </button>
                                    </div>
                                    <FollowUpList clientId={clientId} refreshTrigger={refreshFollowUps} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            <FollowUpModal
                isOpen={showFollowModal}
                onClose={() => setShowFollowModal(false)}
                clientId={clientId}
                clientName={client.full_name}
                onSuccess={() => {
                    setRefreshFollowUps(p => p + 1);
                    // Also refresh notes if needed, or update last contact
                }}
            />
        </div >
    );
}

function ContactItem({ icon, value }: { icon: React.ReactNode; value: string }) {
    return (
        <div className="flex items-center text-gray-600">
            <div className="mr-3 text-blue-600">{icon}</div>
            <span className="text-sm truncate">{value}</span>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'hot': return 'bg-red-100 text-red-800';
        case 'following': return 'bg-amber-100 text-amber-800';
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'cold': return 'bg-gray-100 text-gray-800';
        case 'closed': return 'bg-emerald-100 text-emerald-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'hot': return 'Sıcak';
        case 'following': return 'Takipte';
        case 'new': return 'Yeni';
        case 'cold': return 'Soğuk';
        case 'closed': return 'Kapandı';
        default: return status;
    }
}

function getTypeLabel(type: string) {
    const types: Record<string, string> = {
        apartment: 'Daire',
        villa: 'Villa',
        land: 'Arsa',
        commercial: 'Ticari',
        office: 'Ofis',
        shop: 'Dükkan'
    };
    return types[type] || type;
}
