import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts for Turkish character support and modern look
// Register fonts for Turkish character support (Open Sans is reliable)
Font.register({
    family: 'Open Sans',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf', fontWeight: 400 },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    ],
});

const theme = {
    colors: {
        primary: '#2563EB', // Blue 600
        secondary: '#1E40AF', // Blue 800
        accent: '#F3F4F6', // Gray 100
        text: '#1F2937', // Gray 800
        textLight: '#6B7280', // Gray 500
        white: '#FFFFFF',
        border: '#E5E7EB',
    }
};

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Open Sans',
        fontSize: 10,
        color: theme.colors.text,
        backgroundColor: '#FFFFFF'
    },
    // Header Section
    headerBackground: {
        height: 120,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 30,
        height: 120,
    },
    logoText: {
        color: theme.colors.white,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 1,
    },
    // Hero Section
    heroContainer: {
        height: 250,
        width: '100%',
        backgroundColor: theme.colors.accent,
        marginBottom: 20,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    // Main Content
    mainContainer: {
        paddingHorizontal: 30,
        flexDirection: 'row',
        gap: 20,
    },
    leftColumn: {
        width: '35%',
        paddingRight: 10,
    },
    rightColumn: {
        width: '65%',
    },
    // Property Info Cards
    infoCard: {
        backgroundColor: theme.colors.accent,
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    infoLabel: {
        color: theme.colors.textLight,
        fontSize: 9,
        textTransform: 'uppercase',
        marginBottom: 4,
        fontWeight: 700,
    },
    infoValue: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: 500,
        marginBottom: 8,
    },
    priceTag: {
        fontSize: 20,
        fontWeight: 700,
        color: theme.colors.primary,
        marginBottom: 5,
    },
    propertyTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: theme.colors.text,
        marginBottom: 10,
        lineHeight: 1.3,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: theme.colors.secondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingBottom: 6,
        marginBottom: 10,
        marginTop: 10,
    },
    // Features Grid
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    featureBadge: {
        backgroundColor: '#EFF6FF', // Blue 50
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#BFDBFE', // Blue 200
    },
    featureText: {
        color: theme.colors.primary,
        fontSize: 9,
        fontWeight: 500,
    },
    descriptionText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: theme.colors.text,
        marginBottom: 20,
        textAlign: 'justify',
    },
    // Gallery
    galleryGrid: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    galleryImage: {
        width: 110,
        height: 80,
        borderRadius: 4,
        objectFit: 'cover',
    },
    // Footer / Agent
    agentCard: {
        marginTop: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    agentInfo: {
        marginLeft: 0,
    },
    agentName: {
        fontSize: 12,
        fontWeight: 700,
        color: theme.colors.text,
    },
    agentCompany: {
        fontSize: 10,
        color: theme.colors.textLight,
        marginBottom: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    contactText: {
        fontSize: 9,
        color: theme.colors.text,
        marginLeft: 4,
    },
    footerBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: theme.colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    footerText: {
        fontSize: 8,
        color: theme.colors.textLight,
    }
});

const ListingPDF = ({ listing, agent }: { listing: any, agent: any }) => {
    // Get formatted price
    const formattedPrice = listing.price.toLocaleString('tr-TR') + ' ' + (listing.currency === 'TRY' ? '₺' : listing.currency);

    // Get cover image and additional images
    const sortedMedia = [...(listing.listing_media || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const coverImage = sortedMedia.find(m => m.is_cover) || sortedMedia[0];
    const galleryImages = sortedMedia.filter(m => m.id !== coverImage?.id).slice(0, 6);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const getStorageUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/listing-media/${path}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerBackground} />
                <View style={styles.headerContent}>
                    <Text style={styles.logoText}>TR Danışman</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: 'white', fontSize: 10, opacity: 0.8 }}>Emlak Portföy Sunumu</Text>
                        <Text style={{ color: 'white', fontSize: 9, opacity: 0.6 }}>{new Date().toLocaleDateString('tr-TR')}</Text>
                    </View>
                </View>

                {/* Hero Image */}
                <View style={[styles.heroContainer, { marginTop: -20, marginHorizontal: 30, width: 'auto', borderRadius: 8, overflow: 'hidden', height: 200 }]}>
                    {coverImage ? (
                        <Image src={getStorageUrl(coverImage.storage_path)} style={styles.heroImage} />
                    ) : (
                        <View style={{ flex: 1, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                            <Text>Görsel Yok</Text>
                        </View>
                    )}
                </View>

                {/* Main Content */}
                <View style={styles.mainContainer}>
                    {/* Left Sidebar */}
                    <View style={styles.leftColumn}>
                        {/* Price Card */}
                        <View style={[styles.infoCard, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
                            <Text style={styles.infoLabel}>SATIŞ FİYATI</Text>
                            <Text style={styles.priceTag}>{formattedPrice}</Text>
                            <Text style={{ fontSize: 9, color: theme.colors.primary }}>{listing.purpose === 'sale' ? 'Satılık' : 'Kiralık'}</Text>
                        </View>

                        {/* Location */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>KONUM</Text>
                            <Text style={styles.infoValue}>{listing.district}, {listing.city}</Text>
                            <Text style={{ fontSize: 10, color: theme.colors.textLight }}>{listing.neighborhood}</Text>
                        </View>

                        {/* Property Details */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>ÖZEL DETAYLAR</Text>

                            <View style={{ marginBottom: 6 }}>
                                <Text style={{ fontSize: 9, color: theme.colors.textLight }}>Oda Sayısı</Text>
                                <Text style={styles.infoValue}>{listing.rooms}</Text>
                            </View>

                            <View style={{ marginBottom: 6 }}>
                                <Text style={{ fontSize: 9, color: theme.colors.textLight }}>Brüt Alan</Text>
                                <Text style={styles.infoValue}>{listing.sqm} m²</Text>
                            </View>

                            <View style={{ marginBottom: 6 }}>
                                <Text style={{ fontSize: 9, color: theme.colors.textLight }}>Bina Yaşı</Text>
                                <Text style={styles.infoValue}>{listing.building_age || 'Belirtilmemiş'}</Text>
                            </View>

                            <View>
                                <Text style={{ fontSize: 9, color: theme.colors.textLight }}>Tip</Text>
                                <Text style={styles.infoValue}>
                                    {listing.type === 'apartment' ? 'Daire' : listing.type === 'villa' ? 'Villa' : listing.type}
                                </Text>
                            </View>
                        </View>

                        {/* Agent Card */}
                        <View style={styles.agentCard}>
                            <View style={styles.agentInfo}>
                                <Text style={styles.infoLabel}>DANIŞMAN</Text>
                                <Text style={styles.agentName}>{agent.full_name}</Text>
                                <Text style={styles.agentCompany}>{agent.company || 'Gayrimenkul Danışmanı'}</Text>
                                <Text style={{ fontSize: 9, marginTop: 4 }}>{agent.phone}</Text>
                                <Text style={{ fontSize: 9 }}>{agent.email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Right Content */}
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
                            <View style={styles.featureBadge}><Text style={styles.featureText}>Krediye Uygun</Text></View>
                        </View>

                        <Text style={styles.sectionTitle}>Galeri</Text>
                        <View style={styles.galleryGrid}>
                            {galleryImages.map((img: any) => (
                                <Image key={img.id} src={getStorageUrl(img.storage_path)} style={styles.galleryImage} />
                            ))}
                            {galleryImages.length === 0 && <Text style={{ fontSize: 9, color: '#999' }}>Ek fotoğraf yok.</Text>}
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footerBar}>
                    <Text style={styles.footerText}>TR Danışman CRM tarafından oluşturulmuştur.</Text>
                    <Text style={styles.footerText}>trdanisman.com</Text>
                </View>
            </Page>
        </Document>
    );
};

export async function generateListingPDFBuffer(listing: any, agent: any) {
    return await renderToBuffer(<ListingPDF listing={listing} agent={agent} />);
}
