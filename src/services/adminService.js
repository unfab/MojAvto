// ═══════════════════════════════════════════════════════════════════════════════
// Admin Service — MojAvto.si
// All Firebase/Firestore operations for the admin panel
// Requires the logged-in user to have role: 'admin' in users/{uid}
// ═══════════════════════════════════════════════════════════════════════════════

import {
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, orderBy, where, limit, serverTimestamp, writeBatch,
    getCountFromServer, startAfter,
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../firebase.js';

// ── Admin guard ───────────────────────────────────────────────────────────────

export async function checkAdminRole(uid) {
    if (!uid) return false;
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return false;
        const data = snap.data();
        return data.role === 'admin' || data.role === 'moderator' || data.role === 'editor';
    } catch {
        return false;
    }
}

export async function getUserRole(uid) {
    if (!uid) return null;
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return 'user';
        return snap.data().role || 'user';
    } catch {
        return null;
    }
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export async function addAuditLog(adminUid, adminName, action, target, details = {}) {
    try {
        await addDoc(collection(db, 'auditLog'), {
            adminUid,
            adminName,
            action,
            target,
            details,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.warn('[Admin] AuditLog write failed:', e);
    }
}

export async function getAuditLogs(limitN = 100) {
    const q = query(collection(db, 'auditLog'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
    const [listingsSnap, usersSnap, brandsSnap] = await Promise.allSettled([
        getCountFromServer(collection(db, 'listings')),
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'brands')),
    ]);

    const totalListings = listingsSnap.status === 'fulfilled' ? listingsSnap.value.data().count : 0;
    const totalUsers = usersSnap.status === 'fulfilled' ? usersSnap.value.data().count : 0;
    const totalBrands = brandsSnap.status === 'fulfilled' ? brandsSnap.value.data().count : 0;

    // Pending listings
    let pendingCount = 0;
    let activeCount = 0;
    let revenueTotal = 0;
    try {
        const pendingQ = query(collection(db, 'listings'), where('status', '==', 'pending'));
        const pendingSnap = await getCountFromServer(pendingQ);
        pendingCount = pendingSnap.data().count;

        const activeQ = query(collection(db, 'listings'), where('status', '==', 'active'));
        const activeSnap = await getCountFromServer(activeQ);
        activeCount = activeSnap.data().count;
    } catch { /* rules might block count */ }

    // Recent listings for revenue estimate
    let recentListings = [];
    try {
        const recentQ = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(50));
        const recentSnap = await getDocs(recentQ);
        recentListings = recentSnap.docs.map(d => d.data());
        revenueTotal = recentListings
            .filter(l => l.promotion?.tier !== 'free' && l.promotion?.paidAmount)
            .reduce((sum, l) => sum + (l.promotion.paidAmount || 0), 0);
    } catch { /* ignore */ }

    // New listings today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newToday = recentListings.filter(l => {
        const ts = l.createdAt?.toDate?.();
        return ts && ts >= todayStart;
    }).length;

    return {
        totalListings,
        totalUsers,
        totalBrands,
        pendingCount,
        activeCount,
        revenueTotal,
        newToday,
    };
}

export async function getRecentListings(limitN = 10) {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Listings management ───────────────────────────────────────────────────────

export async function getAllListings(filters = {}, limitN = 50, lastDoc = null) {
    let constraints = [orderBy('createdAt', 'desc'), limit(limitN)];

    if (filters.status) {
        constraints.unshift(where('status', '==', filters.status));
    }
    if (filters.category) {
        constraints.unshift(where('category', '==', filters.category));
    }
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, 'listings'), ...constraints);
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, _doc: d, ...d.data() }));
    return { docs, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

export async function adminUpdateListingStatus(listingId, status, note = '') {
    await updateDoc(doc(db, 'listings', listingId), {
        status,
        moderationNote: note,
        moderatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function adminDeleteListing(listingId) {
    await deleteDoc(doc(db, 'listings', listingId));
}

export async function adminSetFeatured(listingId, tier, durationDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await updateDoc(doc(db, 'listings', listingId), {
        'promotion.tier': tier,
        'promotion.activatedAt': serverTimestamp(),
        'promotion.expiresAt': expiresAt,
        updatedAt: serverTimestamp(),
    });
}

// ── Users management ──────────────────────────────────────────────────────────

export async function getAllUsers(limitN = 100) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function adminUpdateUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
}

export async function adminBanUser(uid, banned = true) {
    await updateDoc(doc(db, 'users', uid), {
        status: banned ? 'banned' : 'active',
        bannedAt: banned ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
    });
}

export async function getUserListingsCount(uid) {
    try {
        const q = query(collection(db, 'listings'), where('authorId', '==', uid));
        const snap = await getCountFromServer(q);
        return snap.data().count;
    } catch { return 0; }
}

// ── Taxonomy: Brands ──────────────────────────────────────────────────────────

export async function getBrands(categoryFilter = null) {
    let q;
    if (categoryFilter) {
        q = query(collection(db, 'brands'), where('category', '==', categoryFilter), orderBy('name'));
    } else {
        q = query(collection(db, 'brands'), orderBy('name'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createBrand(data) {
    const docRef = await addDoc(collection(db, 'brands'), {
        name: data.name.trim(),
        slug: data.slug || slugify(data.name),
        category: data.category || 'avto',
        logoUrl: data.logoUrl || '',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateBrand(id, data) {
    await updateDoc(doc(db, 'brands', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBrand(id) {
    await deleteDoc(doc(db, 'brands', id));
}

// ── Taxonomy: Models ──────────────────────────────────────────────────────────

export async function getModels(brandId = null) {
    let q;
    if (brandId) {
        q = query(collection(db, 'models'), where('brandId', '==', brandId), orderBy('name'));
    } else {
        q = query(collection(db, 'models'), orderBy('name'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createModel(data) {
    const docRef = await addDoc(collection(db, 'models'), {
        name: data.name.trim(),
        slug: data.slug || slugify(data.name),
        brandId: data.brandId,
        brandName: data.brandName || '',
        category: data.category || 'avto',
        subcategory: data.subcategory || '',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateModel(id, data) {
    await updateDoc(doc(db, 'models', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteModel(id) {
    await deleteDoc(doc(db, 'models', id));
}

// ── Excel/Bulk import ─────────────────────────────────────────────────────────

/**
 * Import taxonomy rows from parsed Excel data.
 * rows: [{ category, brand, model }]
 * Returns { imported, skipped, errors }
 */
export async function importTaxonomyRows(rows, adminUid, adminName) {
    const report = { imported: 0, skipped: 0, errors: [] };

    // Load existing brands and models for dedup
    const existingBrands = await getBrands();
    const existingModels = await getModels();

    const brandMap = new Map(existingBrands.map(b => [normalize(b.name + '|' + b.category), b]));
    const modelMap = new Map(existingModels.map(m => [normalize(m.name + '|' + m.brandId), m]));

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const row of rows) {
        try {
            const cat = (row.category || 'avto').trim().toLowerCase();
            const brandName = (row.brand || '').trim();
            const modelName = (row.model || '').trim();

            if (!brandName) { report.errors.push(`Vrstica brez znamke: ${JSON.stringify(row)}`); continue; }

            // Brand dedup
            const brandKey = normalize(brandName + '|' + cat);
            let brand = brandMap.get(brandKey);
            if (!brand) {
                const newBrandRef = doc(collection(db, 'brands'));
                batch.set(newBrandRef, {
                    name: brandName,
                    slug: slugify(brandName),
                    category: cat,
                    logoUrl: '',
                    createdAt: serverTimestamp(),
                });
                brand = { id: newBrandRef.id, name: brandName, category: cat };
                brandMap.set(brandKey, brand);
                batchCount++;
                report.imported++;
            } else {
                report.skipped++;
            }

            // Model dedup
            if (modelName) {
                const modelKey = normalize(modelName + '|' + brand.id);
                if (!modelMap.has(modelKey)) {
                    const newModelRef = doc(collection(db, 'models'));
                    batch.set(newModelRef, {
                        name: modelName,
                        slug: slugify(modelName),
                        brandId: brand.id,
                        brandName: brandName,
                        category: cat,
                        createdAt: serverTimestamp(),
                    });
                    modelMap.set(modelKey, { id: newModelRef.id });
                    batchCount++;
                    report.imported++;
                } else {
                    report.skipped++;
                }
            }

            // Firestore batch limit: 500 ops
            if (batchCount >= 490) {
                await batch.commit();
                batchCount = 0;
            }
        } catch (e) {
            report.errors.push(`Napaka pri vrstici ${JSON.stringify(row)}: ${e.message}`);
        }
    }

    if (batchCount > 0) await batch.commit();

    await addAuditLog(adminUid, adminName, 'TAXONOMY_IMPORT', 'taxonomy', {
        imported: report.imported,
        skipped: report.skipped,
        errors: report.errors.length,
    });

    return report;
}

// ── Reports / Moderation ──────────────────────────────────────────────────────

export async function getReports(status = null) {
    let q;
    if (status) {
        q = query(collection(db, 'reports'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(100));
    } else {
        q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function resolveReport(reportId, action, adminNote = '') {
    await updateDoc(doc(db, 'reports', reportId), {
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        resolvedAt: serverTimestamp(),
        adminNote,
    });
}

// ── Site settings ─────────────────────────────────────────────────────────────

export async function getSiteSettings() {
    const snap = await getDoc(doc(db, 'siteConfig', 'main'));
    if (!snap.exists()) {
        return {
            packages: {
                free: { name: 'Brezplačni', price: 0, maxListings: 3, durationDays: 30 },
                premium: { name: 'Premium', price: 9.99, maxListings: 20, durationDays: 60 },
                dealer: { name: 'Dealer', price: 49.99, maxListings: 999, durationDays: 365 },
            },
            maxImagesPerListing: 20,
            listingAutoExpireDays: 90,
            featuredPricePerDay: 2.99,
            maintenanceMode: false,
            allowGuestListings: false,
        };
    }
    return snap.data();
}

export async function updateSiteSettings(data) {
    await updateDoc(doc(db, 'siteConfig', 'main'), { ...data, updatedAt: serverTimestamp() });
}

// ── SEO Management ────────────────────────────────────────────────────────────

export async function getSeoPages(limitN = 100) {
    const q = query(collection(db, 'seoPages'), orderBy('slug'), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function upsertSeoPage(slug, data) {
    const docRef = doc(db, 'seoPages', slug.replace(/\//g, '_'));
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        await updateDoc(docRef, { ...data, slug, updatedAt: serverTimestamp() });
    } else {
        await updateDoc(docRef, { ...data, slug, createdAt: serverTimestamp() }).catch(() =>
            addDoc(collection(db, 'seoPages'), { ...data, slug, createdAt: serverTimestamp() })
        );
    }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getTopBrands(limitN = 10) {
    // Count listings per brand
    const q = query(collection(db, 'listings'), where('status', '==', 'active'), limit(500));
    const snap = await getDocs(q);
    const brandCounts = {};
    snap.docs.forEach(d => {
        const make = d.data().make || 'Neznano';
        brandCounts[make] = (brandCounts[make] || 0) + 1;
    });
    return Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitN)
        .map(([name, count]) => ({ name, count }));
}

export async function getListingsByDay(days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const q = query(
        collection(db, 'listings'),
        where('createdAt', '>=', since),
        orderBy('createdAt', 'desc'),
        limit(500)
    );
    const snap = await getDocs(q);

    const byDay = {};
    snap.docs.forEach(d => {
        const date = d.data().createdAt?.toDate?.();
        if (!date) return;
        const key = date.toISOString().split('T')[0];
        byDay[key] = (byDay[key] || 0) + 1;
    });

    // Fill missing days with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        result.push({ date: key, count: byDay[key] || 0 });
    }
    return result;
}

export async function getSearchAnalytics(limitN = 20) {
    const q = query(collection(db, 'searchLogs'), orderBy('count', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function normalize(str) {
    return str.toLowerCase().trim();
}
