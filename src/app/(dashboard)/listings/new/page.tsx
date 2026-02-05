import ListingWizard from '@/components/listings/listing-form';

export default function NewListingPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900">Yeni Portföy Ekle</h1>
                <p className="text-gray-500">Mülk bilgilerini adım adım doldurarak yeni bir kayıt oluşturun.</p>
            </div>

            <ListingWizard />
        </div>
    );
}
