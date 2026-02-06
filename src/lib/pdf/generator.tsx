import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
Font.register({
    family: 'Open Sans',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    ],
});

const theme = {
    colors: {
        primary: '#1E3A8A', // Premium Dark Blue
        secondary: '#1F2937', // Dark Gray
        accent: '#F3F4F6', // Light Gray
        text: '#374151',
        textLight: '#6B7280',
        white: '#FFFFFF',
        border: '#E5E7EB',
        gold: '#D97706' // Gold Accent
    }
};

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Open Sans',
        fontSize: 10,
        color: theme.colors.text,
        backgroundColor: '#FFFFFF',
        paddingBottom: 40 // Space for footer
    },
    headerBackground: {
        height: 100,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        top: 0, left: 0, right: 0
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        height: 100
    },
    logoText: {
        color: theme.colors.white,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 1
    },
    heroContainer: {
        marginTop: 0,
        height: 280, // Bigger hero image
        backgroundColor: theme.colors.accent,
        marginBottom: 25
    },
    heroImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    mainContainer: {
        paddingHorizontal: 40,
        flexDirection: 'row',
        gap: 25
    },
    leftColumn: {
        width: '35%'
    },
    rightColumn: {
        width: '65%'
    },
    infoCard: {
        backgroundColor: theme.colors.accent,
        padding: 15,
        borderRadius: 6,
        marginBottom: 15
    },
    infoLabel: {
        color: theme.colors.textLight,
        fontSize: 8,
        textTransform: 'uppercase',
        fontWeight: 700,
        marginBottom: 4
    },
    infoValue: {
        color: theme.colors.text,
        fontSize: 11,
        fontWeight: 600,
        marginBottom: 8
    },
    priceTag: {
        fontSize: 18,
        fontWeight: 700,
        color: theme.colors.primary,
        marginBottom: 4
    },
    propertyTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: theme.colors.secondary,
        marginBottom: 10,
        lineHeight: 1.3
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: theme.colors.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingBottom: 6,
        marginBottom: 10,
        marginTop: 15,
        textTransform: 'uppercase'
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15
    },
    featureBadge: {
        backgroundColor: '#EFF6FF',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#BFDBFE'
    },
    featureText: {
        color: theme.colors.primary,
        fontSize: 9,
        fontWeight: 600
    },
    descriptionText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: theme.colors.text,
        textAlign: 'justify'
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10
    },
    galleryImage: {
        width: 105, // Fits 3 in a row approx (Right col is ~340pt)
        height: 75,
        borderRadius: 4,
        objectFit: 'cover',
        backgroundColor: theme.colors.accent
    },
    footerBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 30,
        backgroundColor: theme.colors.accent,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40
    },
    footerText: {
        fontSize: 8,
        color: theme.colors.textLight
    },
    agentSection: {
        marginTop: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 6
    }
});

const ListingPDF = ({ listing, agent }: { listing: any, agent: any }) => {
    // helpers
    const formattedPrice = listing.price.toLocaleString('tr-TR') + ' ' + (listing.currency === 'TRY' ? '₺' : listing.currency);
    const sortedMedia = [...(listing.listing_media || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const coverImage = sortedMedia.find(m => m.is_cover) || sortedMedia[0];
    const galleryImages = sortedMedia.filter(m => m.id !== coverImage?.id).slice(0, 6); // Max 6 gallery images

    const getStorageUrl = (path: string) => {
        if (!path) return '';
        const parts = path.split('/');
        const encodedPath = parts.map(p => encodeURIComponent(p)).join('/');
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${encodedPath}`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerBackground} />
                <View style={styles.headerContent}>
                    <Text style={styles.logoText}>TR Danışman</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: 'white', fontSize: 10, opacity: 0.9, fontWeight: 600 }}>PORTFÖY SUNUMU</Text>
                        <Text style={{ color: 'white', fontSize: 9, opacity: 0.7 }}>{new Date().toLocaleDateString('tr-TR')}</Text>
                    </View>
                </View>

                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    {coverImage ? (
                        <Image src={getStorageUrl(coverImage.storage_path)} style={styles.heroImage} />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#9CA3AF' }}>Görsel Yok</Text>
                        </View>
                    )}
                </View>

                {/* Main */}
                <View style={styles.mainContainer}>
                    {/* Left Col */}
                    <View style={styles.leftColumn}>
                        <View style={[styles.infoCard, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
                            <Text style={styles.infoLabel}>SATIŞ FİYATI</Text>
                            <Text style={styles.priceTag}>{formattedPrice}</Text>
                            <Text style={{ fontSize: 9, color: theme.colors.primary, fontWeight: 600 }}>
                                {listing.purpose === 'sale' ? 'SATILIK' : 'KİRALIK'}
                            </Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>MÜLK BİLGİLERİ</Text>
                            <View style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 8, color: theme.colors.textLight }}>Tip</Text>
                                <Text style={styles.infoValue}>{listing.type === 'apartment' ? 'Daire' : listing.type === 'villa' ? 'Villa' : listing.type}</Text>
                            </View>
                            <View style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 8, color: theme.colors.textLight }}>Oda & Salon</Text>
                                <Text style={styles.infoValue}>{listing.rooms || '-'}</Text>
                            </View>
                            <View style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 8, color: theme.colors.textLight }}>Brüt Alan</Text>
                                <Text style={styles.infoValue}>{listing.sqm ? `${listing.sqm} m²` : '-'}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 8, color: theme.colors.textLight }}>Bulunduğu Kat</Text>
                                <Text style={styles.infoValue}>{listing.floor_number ? `${listing.floor_number}. Kat` : '-'}</Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>KONUM</Text>
                            <Text style={styles.infoValue}>{listing.district}, {listing.city}</Text>
                            <Text style={{ fontSize: 9, color: theme.colors.textLight }}>{listing.neighborhood}</Text>
                        </View>

                        <View style={styles.agentSection}>
                            <Text style={styles.infoLabel}>DANIŞMAN</Text>
                            <Text style={{ fontSize: 11, fontWeight: 700, color: theme.colors.text, marginBottom: 2 }}>{agent.full_name}</Text>
                            <Text style={{ fontSize: 9, color: theme.colors.textLight, marginBottom: 6 }}>{agent.company || 'Gayrimenkul Danışmanı'}</Text>
                            <Text style={{ fontSize: 9, color: theme.colors.text }}>{agent.phone}</Text>
                            <Text style={{ fontSize: 9, color: theme.colors.text }}>{agent.email}</Text>
                        </View>
                    </View>

                    {/* Right Col */}
                    <View style={styles.rightColumn}>
                        <Text style={styles.propertyTitle}>{listing.title}</Text>

                        <Text style={styles.sectionTitle}>Açıklama</Text>
                        <Text style={styles.descriptionText}>{listing.description || 'Açıklama bulunmuyor.'}</Text>

                        <Text style={styles.sectionTitle}>Özellikler</Text>
                        <View style={styles.featuresGrid}>
                            {listing.has_elevator && <View style={styles.featureBadge}><Text style={styles.featureText}>Asansör</Text></View>}
                            {listing.has_parking && <View style={styles.featureBadge}><Text style={styles.featureText}>Otopark</Text></View>}
                            {listing.has_balcony && <View style={styles.featureBadge}><Text style={styles.featureText}>Balkon</Text></View>}
                            {listing.has_garden && <View style={styles.featureBadge}><Text style={styles.featureText}>Bahçe</Text></View>}
                            {listing.is_furnished && <View style={styles.featureBadge}><Text style={styles.featureText}>Eşyalı</Text></View>}
                            {/* Add common features if none selected to make it look full */}
                            <View style={styles.featureBadge}><Text style={styles.featureText}>Krediye Uygun</Text></View>
                            <View style={styles.featureBadge}><Text style={styles.featureText}>Tapulu</Text></View>
                        </View>

                        <Text style={styles.sectionTitle}>Galeri</Text>
                        <View style={styles.galleryGrid}>
                            {galleryImages.map((img: any) => (
                                <Image key={img.id} src={getStorageUrl(img.storage_path)} style={styles.galleryImage} />
                            ))}
                            {galleryImages.length === 0 && (
                                <View style={[styles.galleryImage, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ fontSize: 8, color: '#9CA3AF' }}>Ek Fotoğraf Yok</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footerBar}>
                    <Text style={styles.footerText}>TR Danışmanlık Hizmetleri</Text>
                    <Text style={styles.footerText}>www.trdanisman.com</Text>
                </View>
            </Page>
        </Document>
    );
};

export async function generateListingPDFBuffer(listing: any, agent: any) {
    return await renderToBuffer(<ListingPDF listing={listing} agent={agent} />);
}
