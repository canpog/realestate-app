import * as XLSX from 'xlsx';

export interface ParsedCustomer {
    full_name: string;
    phone: string;
    email?: string;
    status: string;
    budget_min?: number;
    budget_max?: number;
    wanted_types?: string[];
    wanted_city?: string;
    notes?: string;
    agent_id: string;
}

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}

export interface ParseResult {
    customers: ParsedCustomer[];
    errors: ValidationError[];
    totalRows: number;
}

// Normalize phone number
function normalizePhone(phone: string): string {
    if (!phone) return '';
    // Remove all non-numeric chars
    let cleaned = phone.toString().replace(/\D/g, '');
    // Ensure starts with 0
    if (cleaned.startsWith('90')) cleaned = '0' + cleaned.slice(2);
    if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
    return cleaned;
}

// Validate email
function isValidEmail(email: string): boolean {
    if (!email) return true; // Optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Parse Excel file to customer data
export async function parseExcelFile(
    file: File,
    agentId: string
): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    const customers: ParsedCustomer[] = [];
    const errors: ValidationError[] = [];

    jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because header + 0-index
        const rowErrors: ValidationError[] = [];

        // Required: Ad Soyad
        const fullName = row['Ad Soyad'] || row['AdSoyad'] || row['İsim'] || row['Adı Soyadı'];
        if (!fullName || fullName.trim() === '') {
            rowErrors.push({ row: rowNumber, field: 'Ad Soyad', message: 'Zorunlu alan' });
        }

        // Required: Telefon
        const phone = normalizePhone(row['Telefon'] || row['Tel'] || row['Cep']);
        if (!phone || phone.length < 10) {
            rowErrors.push({ row: rowNumber, field: 'Telefon', message: 'Geçersiz telefon formatı' });
        }

        // Optional: Email
        const email = row['E-posta'] || row['Email'] || row['Mail'];
        if (email && !isValidEmail(email)) {
            rowErrors.push({ row: rowNumber, field: 'E-posta', message: 'Geçersiz e-posta formatı' });
        }

        // Optional: Status
        const rawStatus = row['Durum'] || row['Status'] || 'new';
        const statusMap: Record<string, string> = {
            'yeni': 'new',
            'takipte': 'following',
            'sıcak': 'hot',
            'soğuk': 'cold',
            'kapalı': 'closed',
            'new': 'new',
            'following': 'following',
            'hot': 'hot',
            'cold': 'cold',
            'closed': 'closed',
        };
        const status = statusMap[rawStatus.toLowerCase()] || 'new';

        // Optional: Budget
        const budgetMin = parseFloat(row['Bütçe Min'] || row['Min Bütçe']) || undefined;
        const budgetMax = parseFloat(row['Bütçe Max'] || row['Max Bütçe']) || undefined;

        // Optional: Wanted types
        const wantedTypesRaw = row['İstenen Tip'] || row['Tip'] || '';
        const wantedTypes = wantedTypesRaw
            ? wantedTypesRaw.split(',').map((t: string) => t.trim())
            : undefined;

        // Optional: City
        const wantedCity = row['İstenen Şehir'] || row['Şehir'] || undefined;

        // Optional: Notes
        const notes = row['Not'] || row['Notlar'] || undefined;

        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
        } else {
            customers.push({
                full_name: fullName.trim(),
                phone,
                email: email || undefined,
                status,
                budget_min: budgetMin,
                budget_max: budgetMax,
                wanted_types: wantedTypes,
                wanted_city: wantedCity,
                notes,
                agent_id: agentId,
            });
        }
    });

    return {
        customers,
        errors,
        totalRows: jsonData.length,
    };
}

// Generate template Excel
export function generateTemplate(): Uint8Array {
    const templateData = [
        {
            'Ad Soyad': 'Ahmet Yılmaz',
            'Telefon': '0532 111 1111',
            'E-posta': 'ahmet@email.com',
            'Durum': 'new',
            'Bütçe Min': 2000000,
            'Bütçe Max': 3500000,
            'İstenen Tip': 'Daire, Villa',
            'İstenen Şehir': 'İstanbul',
            'Not': 'Denize yakın arayor',
        },
        {
            'Ad Soyad': 'Zeynep Hanım',
            'Telefon': '0533 222 2222',
            'E-posta': 'zeynep@mail.com',
            'Durum': 'hot',
            'Bütçe Min': 1500000,
            'Bütçe Max': 2500000,
            'İstenen Tip': 'Daire',
            'İstenen Şehir': 'Ankara',
            'Not': '',
        },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteriler');

    // Add instructions sheet
    const instructions = [
        { Talimat: '1. Ad Soyad: Tam adı yazınız (Zorunlu)' },
        { Talimat: '2. Telefon: 0532 123 4567 formatında (Zorunlu)' },
        { Talimat: '3. E-posta: valid@email.com formatında (Opsiyonel)' },
        { Talimat: '4. Durum: new, following, hot, cold, closed (Varsayılan: new)' },
        { Talimat: '5. Bütçe Min/Max: Sayı olarak, ₺ işareti olmadan' },
        { Talimat: '6. İstenen Tip: Virgülle ayrılmış (Daire, Villa, vb.)' },
        { Talimat: '7. İstenen Şehir: İl adı' },
        { Talimat: '8. Not: Herhangi bir bilgi' },
    ];
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Talimatlar');

    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}
