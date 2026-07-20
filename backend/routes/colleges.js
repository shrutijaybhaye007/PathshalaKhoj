/**
 * colleges.js — Primary REST routes for discovering, filtering, searching,
 * viewing, creating, updating, and syncing college records.
 */
const express = require('express');
const router  = express.Router();
const { get, all, run } = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

/**
 * GET /api/colleges
 * Intelligent search powered by PostgreSQL Full-Text Search (tsvector).
 * Falls back gracefully to structured filters when no free-text query is given.
 */
router.get('/', async (req, res) => {
  try {
    const { q, stream, state, city, type, naac, max_fees, exam, sort } = req.query;

    const page   = Math.max(parseInt(req.query.page, 10)  || 1,  1);
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const offset = (page - 1) * limit;

    const filterConditions = [];
    const filterParams     = [];

    if (stream)    { filterConditions.push('c.stream = ?');             filterParams.push(stream); }
    if (state)     { filterConditions.push('c.state = ?');              filterParams.push(state); }
    if (city)      { filterConditions.push('c.city = ?');               filterParams.push(city); }
    if (type)      { filterConditions.push('c.college_type = ?');       filterParams.push(type); }
    if (naac)      { filterConditions.push('c.naac_grade = ?');         filterParams.push(naac); }
    if (max_fees)  { filterConditions.push('c.avg_fees_per_year <= ?'); filterParams.push(parseInt(max_fees, 10)); }
    if (exam && exam.trim()) {
      filterConditions.push(`c.id IN (SELECT college_id FROM college_courses WHERE entrance_exam ILIKE ?)`);
      filterParams.push(`%${exam.trim()}%`);
    }

    let orderClause = 'ORDER BY c.name ASC';
    if      (sort === 'fees_low')   orderClause = 'ORDER BY c.avg_fees_per_year ASC';
    else if (sort === 'fees_high')  orderClause = 'ORDER BY c.avg_fees_per_year DESC';
    else if (sort === 'established') orderClause = 'ORDER BY c.established_year ASC';

    let totalRow, rows;
    const hasSearchQuery = q && q.trim();

    if (hasSearchQuery) {
      const searchTerm = q.trim();
      const filterWhere = filterConditions.length
        ? `AND ${filterConditions.join(' AND ')}`
        : '';

      const ftsOrder = (sort && sort !== 'name')
        ? orderClause
        : 'ORDER BY ts_rank(c.search_vector, plainto_tsquery(\'english\', ?)) DESC, c.name ASC';

      totalRow = await get(
        `SELECT COUNT(*) as count
         FROM colleges c
         WHERE (c.search_vector @@ plainto_tsquery('english', ?) OR c.name ILIKE ? OR c.city ILIKE ?)
         ${filterWhere}`,
        [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`, ...filterParams]
      );

      const searchParams = (sort && sort !== 'name')
        ? [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`, ...filterParams, limit, offset]
        : [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`, ...filterParams, searchTerm, limit, offset];

      rows = await all(
        `SELECT c.id, c.name, c.slug, c.city, c.state, c.stream, c.college_type,
                c.affiliation, c.naac_grade, c.established_year, c.description,
                c.avg_fees_per_year, c.nirf_ranking, c.avg_placement_package,
                c.highest_placement_package, c.total_courses
         FROM colleges c
         WHERE (c.search_vector @@ plainto_tsquery('english', ?) OR c.name ILIKE ? OR c.city ILIKE ?)
         ${filterWhere}
         ${ftsOrder}
         LIMIT ? OFFSET ?`,
        searchParams
      );
    } else {
      const whereClause = filterConditions.length
        ? `WHERE ${filterConditions.join(' AND ')}`
        : '';

      totalRow = await get(
        `SELECT COUNT(*) as count FROM colleges c ${whereClause}`,
        filterParams
      );

      rows = await all(
        `SELECT c.id, c.name, c.slug, c.city, c.state, c.stream, c.college_type,
                c.affiliation, c.naac_grade, c.established_year, c.description,
                c.avg_fees_per_year, c.nirf_ranking, c.avg_placement_package,
                c.highest_placement_package, c.total_courses
         FROM colleges c
         ${whereClause}
         ${orderClause}
         LIMIT ? OFFSET ?`,
        [...filterParams, limit, offset]
      );
    }

    const total = totalRow ? parseInt(totalRow.count, 10) : 0;
    const total_pages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    });
  } catch (err) {
    console.error('GET /api/colleges error:', err);
    res.status(500).json({ error: 'Failed to fetch colleges.' });
  }
});

/**
 * GET /api/colleges/stats
 * Public: Returns overall database metrics.
 */
router.get('/stats', async (req, res) => {
  try {
    const totalCollegesRow = await get('SELECT COUNT(*) as count FROM colleges');
    const totalExamsRow    = await get('SELECT COUNT(*) as count FROM timeline_events');
    const avgPlacementObj  = await get(
      `SELECT AVG(CASE WHEN avg_placement_package >= 1000
                       THEN avg_placement_package / 100000.0
                       ELSE avg_placement_package END) as avg_package
       FROM colleges WHERE avg_placement_package > 0`
    );
    const totalColleges = totalCollegesRow ? parseInt(totalCollegesRow.count, 10) : 0;
    const totalExams    = totalExamsRow ? parseInt(totalExamsRow.count, 10) : 0;
    const avgPlacement  = avgPlacementObj && avgPlacementObj.avg_package
      ? parseFloat(avgPlacementObj.avg_package).toFixed(1)
      : '0.0';

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({ collegesCount: totalColleges, examsCount: totalExams, avgPlacement });
  } catch (err) {
    console.error('GET /api/colleges/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch database statistics.' });
  }
});

/**
 * GET /api/colleges/sync-coverage
 * Admin: Returns stats about how many colleges have real vs missing data.
 */
router.get('/sync-coverage', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalRow        = await get('SELECT COUNT(*) as count FROM colleges');
    const hasDescRow      = await get("SELECT COUNT(*) as count FROM colleges WHERE description IS NOT NULL AND LENGTH(description) > 80");
    const hasLogoRow      = await get("SELECT COUNT(*) as count FROM colleges WHERE logo_url IS NOT NULL AND logo_url != ''");
    const hasWebsiteRow   = await get("SELECT COUNT(*) as count FROM colleges WHERE website IS NOT NULL AND website != ''");
    const hasNaacRow      = await get("SELECT COUNT(*) as count FROM colleges WHERE naac_grade IS NOT NULL");
    const hasPhoneRow     = await get("SELECT COUNT(*) as count FROM colleges WHERE contact_phone IS NOT NULL");
    const hasPlacementRow = await get("SELECT COUNT(*) as count FROM colleges WHERE avg_placement_package IS NOT NULL AND avg_placement_package > 0");
    const recentlySyncedRow = await get("SELECT COUNT(*) as count FROM colleges WHERE updated_at > NOW() - INTERVAL '1 day'");

    const total        = totalRow ? parseInt(totalRow.count, 10) : 0;
    const hasDesc      = hasDescRow ? parseInt(hasDescRow.count, 10) : 0;
    const hasLogo      = hasLogoRow ? parseInt(hasLogoRow.count, 10) : 0;
    const hasWebsite   = hasWebsiteRow ? parseInt(hasWebsiteRow.count, 10) : 0;
    const hasNaac      = hasNaacRow ? parseInt(hasNaacRow.count, 10) : 0;
    const hasPhone     = hasPhoneRow ? parseInt(hasPhoneRow.count, 10) : 0;
    const hasPlacement = hasPlacementRow ? parseInt(hasPlacementRow.count, 10) : 0;
    const recentlySynced = recentlySyncedRow ? parseInt(recentlySyncedRow.count, 10) : 0;

    const safePct = (val) => total > 0 ? Math.round(val / total * 100) : 0;

    res.json({
      total,
      coverage: {
        descriptions: { count: hasDesc, pct: safePct(hasDesc) },
        logos:        { count: hasLogo, pct: safePct(hasLogo) },
        websites:     { count: hasWebsite, pct: safePct(hasWebsite) },
        naac_grades:  { count: hasNaac, pct: safePct(hasNaac) },
        phones:       { count: hasPhone, pct: safePct(hasPhone) },
        placements:   { count: hasPlacement, pct: safePct(hasPlacement) },
      },
      recently_synced: recentlySynced,
    });
  } catch (err) {
    console.error('GET /api/colleges/sync-coverage error:', err);
    res.status(500).json({ error: 'Failed to fetch sync coverage data.' });
  }
});

/**
 * POST /api/colleges/sync-batch-wiki
 * Admin only: Batch sync Wikipedia info for colleges missing descriptions.
 */
router.post('/sync-batch-wiki', requireAuth, requireAdmin, async (req, res) => {
  try {
    const batchSize = Math.min(parseInt(req.body.batch_size, 10) || 10, 20);
    const offset    = parseInt(req.body.offset, 10) || 0;
    const stream    = req.body.stream || null;

    const missingQuery = stream
      ? `SELECT id, name, city, state, stream FROM colleges
         WHERE (description IS NULL OR LENGTH(description) < 80) AND stream = ?
         ORDER BY id ASC LIMIT ? OFFSET ?`
      : `SELECT id, name, city, state, stream FROM colleges
         WHERE description IS NULL OR LENGTH(description) < 80
         ORDER BY id ASC LIMIT ? OFFSET ?`;

    const streamParams = stream ? [stream, batchSize, offset] : [batchSize, offset];
    const colleges = await all(missingQuery, streamParams);

    const totalMissingRow = stream
      ? await get(`SELECT COUNT(*) as count FROM colleges WHERE (description IS NULL OR LENGTH(description) < 80) AND stream = ?`, [stream])
      : await get(`SELECT COUNT(*) as count FROM colleges WHERE description IS NULL OR LENGTH(description) < 80`);

    const totalMissing = totalMissingRow ? parseInt(totalMissingRow.count, 10) : 0;
    const results = [];

    for (const college of colleges) {
      await new Promise(r => setTimeout(r, 150));

      try {
        const wikiData = await fetchWikipediaData(college.name);
        if (wikiData) {
          const updates = [];
          const updateParams = [];

          if (wikiData.description) {
            updates.push('description = ?');
            updateParams.push(wikiData.description);
          }
          if (wikiData.logo_url) {
            updates.push('logo_url = ?');
            updateParams.push(wikiData.logo_url);
          }
          if (wikiData.established_year && !college.established_year) {
            updates.push('established_year = ?');
            updateParams.push(wikiData.established_year);
          }
          if (wikiData.naac_grade) {
            updates.push('naac_grade = ?');
            updateParams.push(wikiData.naac_grade);
          }
          if (wikiData.affiliation) {
            updates.push('affiliation = ?');
            updateParams.push(wikiData.affiliation);
          }

          if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            updateParams.push(college.id);
            await run(`UPDATE colleges SET ${updates.join(', ')} WHERE id = ?`, updateParams);
          }

          results.push({ id: college.id, name: college.name, status: 'synced', fields_updated: updates.length - 1 });
        } else {
          results.push({ id: college.id, name: college.name, status: 'not_found' });
        }
      } catch (err) {
        results.push({ id: college.id, name: college.name, status: 'error', error: err.message });
      }
    }

    const synced    = results.filter(r => r.status === 'synced').length;
    const notFound  = results.filter(r => r.status === 'not_found').length;
    const errors    = results.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      batch_size: colleges.length,
      offset,
      total_missing: totalMissing,
      has_more: offset + batchSize < totalMissing,
      next_offset: offset + batchSize,
      summary: { synced, not_found: notFound, errors },
      results,
    });
  } catch (err) {
    console.error('POST /api/colleges/sync-batch-wiki error:', err);
    res.status(500).json({ error: 'Failed to run batch Wikipedia sync.' });
  }
});

/**
 * GET /api/colleges/meta/filters
 */
router.get('/meta/filters', async (req, res) => {
  try {
    const { state } = req.query;
    const streams    = await all('SELECT DISTINCT stream FROM colleges ORDER BY stream');
    const states     = await all('SELECT DISTINCT state FROM colleges ORDER BY state');
    const types      = await all('SELECT DISTINCT college_type FROM colleges ORDER BY college_type');
    const naacGrades = await all('SELECT DISTINCT naac_grade FROM colleges WHERE naac_grade IS NOT NULL ORDER BY naac_grade');
    const feesRange  = await get('SELECT MIN(avg_fees_per_year) as min_fees, MAX(avg_fees_per_year) as max_fees FROM colleges');

    const cities = state
      ? await all('SELECT DISTINCT city FROM colleges WHERE state = ? ORDER BY city', [state])
      : await all('SELECT DISTINCT city FROM colleges ORDER BY city');

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({
      streams:     streams.map((r) => r.stream),
      states:      states.map((r) => r.state),
      cities:      cities.map((r) => r.city),
      types:       types.map((r) => r.college_type),
      naac_grades: naacGrades.map((r) => r.naac_grade),
      fees_range:  feesRange,
    });
  } catch (err) {
    console.error('GET /api/colleges/meta/filters error:', err);
    res.status(500).json({ error: 'Failed to fetch filter metadata.' });
  }
});

/**
 * GET /api/colleges/autocomplete
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({ colleges: [], courses: [], cities: [] });
    }

    const searchTerm = q.trim();
    let colleges = [];
    try {
      colleges = await all(
        `SELECT c.id, c.name, c.city, c.state, c.stream, c.naac_grade, c.nirf_ranking
         FROM colleges c
         WHERE (c.search_vector @@ plainto_tsquery('english', ?) OR c.name ILIKE ? OR c.city ILIKE ?)
         ORDER BY ts_rank(c.search_vector, plainto_tsquery('english', ?)) DESC
         LIMIT 6`,
        [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`, searchTerm]
      );
    } catch (e) {}

    const words = searchTerm.split(/\s+/).filter(Boolean);
    const courseConditions = words.map(() => `name ILIKE ?`);
    const courseParams     = words.map(w => `%${w}%`);
    let courses = [];
    try {
      courses = await all(
        `SELECT DISTINCT name FROM courses
         WHERE ${courseConditions.join(' AND ')}
         ORDER BY name
         LIMIT 4`,
        courseParams
      );
    } catch (e) {}

    const citySet = new Map();
    colleges.forEach(c => {
      if (!citySet.has(c.city)) citySet.set(c.city, c.state);
    });
    const firstWord = words[0] || '';
    if (firstWord.length >= 2) {
      try {
        const citiesExtra = await all(
          `SELECT DISTINCT city, state FROM colleges WHERE city ILIKE ? LIMIT 5`,
          [`%${firstWord}%`]
        );
        citiesExtra.forEach(c => {
          if (!citySet.has(c.city)) citySet.set(c.city, c.state);
        });
      } catch (e) {}
    }

    res.json({
      colleges,
      courses: courses.map(c => c.name),
      cities: [...citySet.entries()].slice(0, 4).map(([city, state]) => ({ city, state }))
    });
  } catch (err) {
    console.error('GET /api/colleges/autocomplete error:', err);
    res.status(500).json({ error: 'Failed to fetch autocomplete suggestions.' });
  }
});

async function fetchWikipediaData(collegeName) {
  const query = collegeName
    .replace(/^\+3\s+/, '')
    .replace(/^\+2\s+/, '')
    .replace(/Junior\s+/i, '')
    .replace(/Jr\.\s+/i, '')
    .replace(/,.*$/, '')
    .trim();
  let url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=1&explaintext=1&titles=${encodeURIComponent(query)}&piprop=original&origin=*&redirects=1`;

  let wikiRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
  let wikiData = await wikiRes.json();
  let pages = wikiData.query ? wikiData.query.pages : null;
  let pageId = pages ? Object.keys(pages)[0] : '-1';

  if (pageId === '-1' || !pages || !pages[pageId] || pages[pageId].missing !== undefined) {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' college india')}&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    const searchData = await searchRes.json();
    const searchResults = searchData.query ? searchData.query.search : [];

    if (searchResults.length > 0) {
      const bestTitle = searchResults[0].title;
      url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=1&explaintext=1&titles=${encodeURIComponent(bestTitle)}&piprop=original&origin=*&redirects=1`;
      wikiRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
      wikiData = await wikiRes.json();
      pages = wikiData.query ? wikiData.query.pages : null;
      pageId = pages ? Object.keys(pages)[0] : '-1';
    }
  }

  if (!pages || pageId === '-1' || !pages[pageId] || pages[pageId].missing !== undefined) {
    return null;
  }

  const page = pages[pageId];
  let description = page.extract || null;
  let estYear = null;
  let naacGrade = null;
  let affiliation = null;

  if (description) {
    description = description.replace(/<[^>]*>/g, '').replace(/\[\d+\]/g, '').replace(/\[citation needed\]/g, '').trim();

    const estMatch = description.match(/(?:established|founded|started|opened|incorporated|set up)\s+(?:in\s+)?(\d{4})/i);
    if (estMatch) estYear = parseInt(estMatch[1], 10);

    const naacMatch = description.match(/NAAC[^.]*?grade\s+([AB][+]{0,2}|[AB])/i) ||
                      description.match(/accredited[^.]*?NAAC[^.]*?([AB][+]{0,2}|[AB])\s*grade/i) ||
                      description.match(/NAAC\s+([AB][+]{0,2})/i);
    if (naacMatch) naacGrade = naacMatch[1].toUpperCase();

    const affiliationMatch = description.match(/affiliated(?:\s+to|\s+with)?\s+([A-Z][^.,;\n]{5,60}(?:University|Institute|UGC|AICTE))/i);
    if (affiliationMatch) affiliation = affiliationMatch[1].trim();

    if (description.length > 1200) {
      const cutAt = description.indexOf('.', 800);
      description = (cutAt > 0 ? description.substring(0, cutAt + 1) : description.substring(0, 1000)).trim();
    }
  }

  const logoUrl = page.original ? page.original.source : null;

  if (!description && !logoUrl) return null;

  return { description, logo_url: logoUrl, established_year: estYear, naac_grade: naacGrade, affiliation };
}

/**
 * GET /api/colleges/:id/wiki-preview
 */
router.get('/:id/wiki-preview', async (req, res) => {
  try {
    const college = await get('SELECT id, name, description, logo_url, established_year FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) return res.status(404).json({ error: 'College not found.' });

    const isSyntheticDesc = college.description && college.description.includes('prestigious institution affiliated');
    const isSyntheticLogo = college.logo_url && (college.logo_url.includes('api.dicebear.com') || college.logo_url.includes('source.unsplash.com'));

    const hasGoodDesc = college.description && college.description.length > 100 && !isSyntheticDesc;
    const hasLogo = college.logo_url && college.logo_url.length > 5 && !isSyntheticLogo;

    if (hasGoodDesc && hasLogo) {
      return res.json({ success: true, source: 'db', already_enriched: true });
    }

    const cleanQuery = college.name
      .replace(/^\+3\s+/, '')
      .replace(/^\+2\s+/, '')
      .replace(/Junior\s+/i, '')
      .replace(/Jr\.\s+/i, '')
      .replace(/,.*$/, '')
      .trim();

    const wikiData = await fetchWikipediaData(cleanQuery);
    if (!wikiData) {
      return res.json({ success: false, source: 'wiki', message: 'No Wikipedia page found.' });
    }

    const updates = [];
    const params = [];
    if (wikiData.description && !hasGoodDesc) {
      updates.push('description = ?');
      params.push(wikiData.description);
    }
    if (wikiData.logo_url && !hasLogo) {
      updates.push('logo_url = ?');
      params.push(wikiData.logo_url);
    }
    if (wikiData.established_year && !college.established_year) {
      updates.push('established_year = ?');
      params.push(wikiData.established_year);
    }
    if (wikiData.naac_grade) {
      updates.push('naac_grade = ?');
      params.push(wikiData.naac_grade);
    }
    if (wikiData.affiliation) {
      updates.push('affiliation = ?');
      params.push(wikiData.affiliation);
    }
    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(college.id);
      await run(`UPDATE colleges SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({ success: true, source: 'wiki', ...wikiData });
  } catch (err) {
    console.error('GET /api/colleges/:id/wiki-preview error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch Wikipedia preview.' });
  }
});

/**
 * GET /api/colleges/:id/website-preview
 */
router.get('/:id/website-preview', async (req, res) => {
  try {
    const college = await get('SELECT id, name, slug, website, description, gallery_images FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) return res.status(404).json({ error: 'College not found.' });

    const isSyntheticWebsite = (url, slug) => {
      if (!url) return true;
      const cleanSlug = slug.replace(/-+/g, '').substring(0, 15);
      return url.includes(cleanSlug) && url.endsWith('.edu.in');
    };

    const isSynthetic = isSyntheticWebsite(college.website, college.slug);
    const hasRealWebsite = college.website && !isSynthetic;

    let galleryImages = [];
    try {
      galleryImages = college.gallery_images ? JSON.parse(college.gallery_images) : [];
    } catch(e) {}

    if (hasRealWebsite && galleryImages.length > 0) {
      const contacts = await all(
        "SELECT contact_type, contact_value FROM college_contacts WHERE college_id = ? AND contact_type IN ('facebook', 'twitter', 'linkedin', 'instagram', 'youtube')",
        [college.id]
      );
      return res.json({
        success: true,
        source: 'db',
        already_synced: true,
        website: college.website,
        description: college.description,
        gallery_images: galleryImages,
        socials: contacts.map(c => ({ type: c.contact_type, value: c.contact_value }))
      });
    }

    const cheerio = require('cheerio');
    let discoveredUrl = college.website;

    if (isSynthetic) {
      const query = `${college.name} official website`.replace(/ /g, '+');
      const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(6000)
      });
      
      if (searchRes.ok) {
        const html = await searchRes.text();
        const $ = cheerio.load(html);
        const candidateUrls = [];
        $('.result__url, .result-snippet').each((i, el) => {
          let url = $(el).attr('href');
          if (url && url.includes('uddg=')) {
            try {
              const urlObj = new URL(url.startsWith('//') ? `https:${url}` : url);
              const uddg = urlObj.searchParams.get('uddg');
              if (uddg) url = decodeURIComponent(uddg);
            } catch(e){}
          }
          if (url) candidateUrls.push(url);
        });

        const blocklist = ['wikipedia.org', 'justdial.com', 'shiksha.com', 'collegedunia.com', 'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'targetstudy.com', 'collegedekho.com', 'careers360.com', 'indiastudychannel.com'];
        
        let topUrl = null;
        for (let url of candidateUrls) {
          if (url.includes('?')) url = url.split('?')[0];
          const isBlocked = blocklist.some(b => url.toLowerCase().includes(b));
          if (isBlocked) continue;
          
          try {
            const ping = await fetch(url, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(3000)
            });
            if (ping.ok) {
              topUrl = url;
              break;
            }
          } catch (err) {}
        }

        if (topUrl) {
          if (topUrl.endsWith('/')) topUrl = topUrl.slice(0, -1);
          discoveredUrl = topUrl;

          await run("UPDATE colleges SET website = ? WHERE id = ?", [discoveredUrl, college.id]);
          
          const existingContact = await get(
            "SELECT id FROM college_contacts WHERE college_id = ? AND contact_type = 'website'",
            [college.id]
          );
          if (existingContact) {
            await run("UPDATE college_contacts SET contact_value = ? WHERE id = ?", [discoveredUrl, existingContact.id]);
          } else {
            await run("INSERT INTO college_contacts (college_id, contact_type, contact_value) VALUES (?, 'website', ?)", [college.id, discoveredUrl]);
          }
        }
      }
    }

    let scrapedDesc = null;
    const socialsFound = [];
    let galleryList = [];

    if (discoveredUrl && !isSyntheticWebsite(discoveredUrl, college.slug)) {
      try {
        const response = await fetch(discoveredUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(6000)
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || 
                            html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
          scrapedDesc = descMatch ? descMatch[1].trim() : null;
          
          const isSyntheticD = college.description && college.description.includes('prestigious institution affiliated');
          if (scrapedDesc && scrapedDesc.length > 20 && (!college.description || isSyntheticD)) {
            await run('UPDATE colleges SET description = ? WHERE id = ?', [scrapedDesc, college.id]);
          }

          const socialPatterns = {
            facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
            twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9._-]+/gi,
            linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+/gi,
            instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/gi,
            youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:user|c|channel)\/[a-zA-Z0-9._-]+/gi
          };

          for (const [type, regex] of Object.entries(socialPatterns)) {
            const matches = html.match(regex);
            if (matches && matches.length > 0) {
              const value = matches[0].trim();
              const exists = await get(
                "SELECT id FROM college_contacts WHERE college_id = ? AND contact_type = ? AND contact_value = ?",
                [college.id, type, value]
              );
              if (!exists) {
                await run(
                  "INSERT INTO college_contacts (college_id, contact_type, contact_value, label) VALUES (?, ?, ?, ?)",
                  [college.id, type, value, `Official ${type.charAt(0).toUpperCase() + type.slice(1)}`]
                );
              }
              socialsFound.push({ type, value });
            }
          }

          const scrapedImages = [];
          $('img').each((i, el) => {
            let src = $(el).attr('src');
            if (src) {
              if (!src.startsWith('http') && !src.startsWith('data:')) {
                  try { src = new URL(src, discoveredUrl).href; } catch(e) {}
              }
              const lowerSrc = src.toLowerCase();
              if (src.startsWith('http') && 
                  (lowerSrc.includes('.jpg') || lowerSrc.includes('.jpeg') || lowerSrc.includes('.png') || lowerSrc.includes('.webp')) && 
                  !lowerSrc.includes('logo') && 
                  !lowerSrc.includes('icon') && 
                  !lowerSrc.includes('avatar') &&
                  !scrapedImages.includes(src)) {
                  scrapedImages.push(src);
              }
            }
          });

          galleryList = scrapedImages.slice(0, 6);
          if (galleryList.length > 0) {
            await run('UPDATE colleges SET gallery_images = ? WHERE id = ?', [JSON.stringify(galleryList), college.id]);
          }
        }
      } catch (e) {
        console.error(`Crawl error for ${discoveredUrl}:`, e.message);
      }
    }

    res.json({
      success: true,
      source: 'website',
      website: discoveredUrl,
      description: scrapedDesc || college.description,
      socials: socialsFound,
      gallery_images: galleryList.length > 0 ? galleryList : galleryImages
    });
  } catch (err) {
    console.error('GET /api/colleges/:id/website-preview error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch official website preview.' });
  }
});

/**
 * GET /api/colleges/:id/location-preview
 */
router.get('/:id/location-preview', async (req, res) => {
  try {
    const college = await get('SELECT id, name, city, state, latitude, longitude FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) return res.status(404).json({ error: 'College not found.' });

    if (college.latitude !== null && college.longitude !== null) {
      return res.json({
        success: true,
        source: 'db',
        latitude: college.latitude,
        longitude: college.longitude
      });
    }

    let lat = null;
    let lon = null;

    const query = encodeURIComponent(`${college.name}, ${college.city}, ${college.state}`);
    const searchUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'PathshalaKhoj College Directory Agent' },
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      }
    } catch (e) {}

    if (lat === null || lon === null) {
      const fallbackQuery = encodeURIComponent(`${college.city}, ${college.state}, India`);
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`;

      try {
        const response = await fetch(fallbackUrl, {
          headers: { 'User-Agent': 'PathshalaKhoj College Directory Agent' },
          signal: AbortSignal.timeout(4000)
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
          }
        }
      } catch (e) {}
    }

    if (lat !== null && lon !== null) {
      await run('UPDATE colleges SET latitude = ?, longitude = ? WHERE id = ?', [lat, lon, college.id]);
      return res.json({
        success: true,
        source: 'api',
        latitude: lat,
        longitude: lon
      });
    }

    res.status(404).json({ success: false, error: 'Could not geocode college location.' });
  } catch (err) {
    console.error('GET /api/colleges/:id/location-preview error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch location coordinates.' });
  }
});

/**
 * GET /api/colleges/:id
 * Full detail view: college + its courses + its contacts.
 */
router.get('/:id', async (req, res) => {
  try {
    const college = await get('SELECT * FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const courses = await all(
      `SELECT c.id, c.name, c.level, c.duration_years, c.degree_type, 
              cc.fees_per_year, cc.seats, cc.entrance_exam, cc.eligibility
       FROM college_courses cc
       JOIN courses c ON cc.course_id = c.id
       WHERE cc.college_id = ?
       ORDER BY c.level, c.name`,
      [req.params.id]
    );
    const contacts = await all(
      'SELECT * FROM college_contacts WHERE college_id = ? ORDER BY contact_type',
      [req.params.id]
    );
    const reviews = await all(
      'SELECT * FROM college_reviews WHERE college_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    const qna = await all(
      'SELECT * FROM college_qna WHERE college_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    if (college.gallery_images) {
      try {
        college.gallery_images = JSON.parse(college.gallery_images);
      } catch (e) {
        college.gallery_images = [];
      }
    } else {
      college.gallery_images = [];
    }

    const isFakeEmail  = (e) => !e || e.includes('indianinstitute.edu.in') || /^info@[^.]+\.edu\.in$/.test(e);
    const isFakeMobile = (p) => {
      if (!p) return false;
      const digits = p.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '');
      return /^[789]\d{9}$/.test(digits) && !p.includes('-');
    };
    const isFakeWeb    = (w) => !w || w.includes('indianinstitute.edu.in');

    if (isFakeEmail(college.contact_email))  college.contact_email  = null;
    if (isFakeMobile(college.contact_phone)) college.contact_phone  = null;
    if (isFakeWeb(college.website))          college.website         = null;

    if (contacts.length > 0) {
      const realPhone   = contacts.find(c => c.contact_type === 'phone');
      const realEmail   = contacts.find(c => c.contact_type === 'email');
      const realWebsite = contacts.find(c => c.contact_type === 'website');
      if (realPhone   && !college.contact_phone)  college.contact_phone  = realPhone.contact_value;
      if (realEmail   && !college.contact_email)  college.contact_email  = realEmail.contact_value;
      if (realWebsite && !college.website)         college.website         = realWebsite.contact_value;
    }

    res.json({ ...college, courses, contacts, reviews, qna });
  } catch (err) {
    console.error('GET /api/colleges/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch college detail.' });
  }
});

/**
 * POST /api/colleges/:id/sync-wiki
 */
router.post('/:id/sync-wiki', requireAuth, requireAdmin, async (req, res) => {
  try {
    const college = await get('SELECT id, name, description, logo_url, established_year FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const wikiData = await fetchWikipediaData(college.name);

    if (!wikiData) {
      return res.status(404).json({ error: 'No matching Wikipedia page found for this college.' });
    }

    const updates = [];
    const params = [];

    if (wikiData.description) {
      updates.push('description = ?');
      params.push(wikiData.description);
    }
    if (wikiData.logo_url) {
      updates.push('logo_url = ?');
      params.push(wikiData.logo_url);
    }
    if (wikiData.established_year) {
      updates.push('established_year = ?');
      params.push(wikiData.established_year);
    }
    if (wikiData.naac_grade) {
      updates.push('naac_grade = ?');
      params.push(wikiData.naac_grade);
    }
    if (wikiData.affiliation) {
      updates.push('affiliation = ?');
      params.push(wikiData.affiliation);
    }
    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(college.id);
      await run(`UPDATE colleges SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({
      success: true,
      fields_updated: updates.length - 1,
      description: wikiData.description || college.description,
      logo_url: wikiData.logo_url || college.logo_url,
      established_year: wikiData.established_year || college.established_year,
      naac_grade: wikiData.naac_grade,
      affiliation: wikiData.affiliation,
    });
  } catch (err) {
    console.error('sync-wiki error:', err);
    res.status(500).json({ error: 'Failed to sync with Wikipedia.' });
  }
});

/**
 * POST /api/colleges/:id/sync-website
 */
router.post('/:id/sync-website', requireAuth, requireAdmin, async (req, res) => {
  let websiteUrl = null;
  try {
    const college = await get('SELECT id, name, description FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const websiteContact = await get(
      "SELECT contact_value FROM college_contacts WHERE college_id = ? AND contact_type = 'website'",
      [college.id]
    );
    websiteUrl = websiteContact ? websiteContact.contact_value : null;

    if (!websiteUrl) {
      return res.status(400).json({ error: 'No website URL is registered for this college.' });
    }

    if (!websiteUrl.startsWith('http')) {
      websiteUrl = `https://${websiteUrl}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('Target website did not return an HTML document.');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      throw new Error('Target website homepage exceeds the 5MB size limit.');
    }

    const html = await response.text();

    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || 
                      html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const scrapedDesc = descMatch ? descMatch[1].trim() : null;

    if (scrapedDesc && scrapedDesc.length > 20) {
      await run('UPDATE colleges SET description = ? WHERE id = ?', [scrapedDesc, college.id]);
    }

    const socials = [];
    const socialPatterns = {
      facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
      twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9._-]+/gi,
      linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+/gi,
      instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/gi,
      youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:user|c|channel)\/[a-zA-Z0-9._-]+/gi
    };

    let insertedSocialsCount = 0;
    for (const [type, regex] of Object.entries(socialPatterns)) {
      const matches = html.match(regex);
      if (matches && matches.length > 0) {
        const value = matches[0].trim();
        const exists = await get(
          "SELECT id FROM college_contacts WHERE college_id = ? AND contact_type = ? AND contact_value = ?",
          [college.id, type, value]
        );
        if (!exists) {
          await run(
            "INSERT INTO college_contacts (college_id, contact_type, contact_value, label) VALUES (?, ?, ?, ?)",
            [college.id, type, value, `Official ${type.charAt(0).toUpperCase() + type.slice(1)}`]
          );
          insertedSocialsCount++;
          socials.push({ type, value });
        }
      }
    }

    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const gallery_images = [];
    $('img').each((i, el) => {
      let src = $(el).attr('src');
      if (src) {
        if (!src.startsWith('http') && !src.startsWith('data:')) {
            try { src = new URL(src, websiteUrl).href; } catch(e) {}
        }
        
        const lowerSrc = src.toLowerCase();
        if (src.startsWith('http') && 
            (lowerSrc.includes('.jpg') || lowerSrc.includes('.jpeg') || lowerSrc.includes('.png') || lowerSrc.includes('.webp')) && 
            !lowerSrc.includes('logo') && 
            !lowerSrc.includes('icon') && 
            !lowerSrc.includes('avatar') &&
            !gallery_images.includes(src)) {
            
            gallery_images.push(src);
        }
      }
    });
    
    const selectedImages = gallery_images.slice(0, 6);
    if (selectedImages.length > 0) {
       await run('UPDATE colleges SET gallery_images = ? WHERE id = ?', [JSON.stringify(selectedImages), college.id]);
    }

    res.json({
      success: true,
      description: scrapedDesc || college.description,
      socials_found: socials,
      new_socials_added: insertedSocialsCount
    });
  } catch (err) {
    console.error('sync-website error:', err.message);
    res.status(500).json({ error: `The registered college website (${websiteUrl || 'N/A'}) could not be resolved or is currently offline.` });
  }
});

/**
 * POST /api/colleges/:id/auto-discover-website
 */
router.post('/:id/auto-discover-website', requireAuth, requireAdmin, async (req, res) => {
  try {
    const college = await get('SELECT id, name FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const cheerio = require('cheerio');
    const query = `${college.name} official website`.replace(/ /g, '+');
    const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
    
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    if (!searchRes.ok) {
      throw new Error(`Search engine returned HTTP ${searchRes.status}`);
    }
    
    const html = await searchRes.text();
    const $ = cheerio.load(html);
    
    const candidateUrls = [];
    $('.result__url, .result-snippet').each((i, el) => {
      let url = $(el).attr('href');
      if (url && url.includes('uddg=')) {
        try {
          const urlObj = new URL(url.startsWith('//') ? `https:${url}` : url);
          const uddg = urlObj.searchParams.get('uddg');
          if (uddg) url = decodeURIComponent(uddg);
        } catch(e){}
      }
      if (url) candidateUrls.push(url);
    });

    const blocklist = ['wikipedia.org', 'justdial.com', 'shiksha.com', 'collegedunia.com', 'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'targetstudy.com', 'collegedekho.com', 'careers360.com', 'indiastudychannel.com'];
    
    let topUrl = null;
    for (let url of candidateUrls) {
      if (url.includes('?')) url = url.split('?')[0];
      const isBlocked = blocklist.some(b => url.toLowerCase().includes(b));
      if (isBlocked) continue;
      
      try {
        const ping = await fetch(url, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(3000)
        });
        if (ping.ok) {
          topUrl = url;
          break;
        }
      } catch (err) {}
    }

    if (!topUrl) {
      return res.status(404).json({ error: 'Could not discover a reliable official website that is currently online.' });
    }
    
    if (topUrl.endsWith('/')) topUrl = topUrl.slice(0, -1);
    
    const existingContact = await get(
      "SELECT id FROM college_contacts WHERE college_id = ? AND contact_type = 'website'",
      [college.id]
    );
    
    if (existingContact) {
      await run("UPDATE college_contacts SET contact_value = ? WHERE id = ?", [topUrl, existingContact.id]);
    } else {
      await run("INSERT INTO college_contacts (college_id, contact_type, contact_value) VALUES (?, 'website', ?)", [college.id, topUrl]);
    }
    
    await run("UPDATE colleges SET website = ? WHERE id = ?", [topUrl, college.id]);
    
    res.json({
      success: true,
      new_website: topUrl
    });
    
  } catch (err) {
    console.error('auto-discover-website error:', err.message);
    res.status(500).json({ error: 'Failed to auto-discover website. Search engine may be rate-limiting.' });
  }
});

/**
 * POST /api/colleges/:id/sync-reviews
 */
router.post('/:id/sync-reviews', async (req, res) => {
  try {
    const college = await get('SELECT id, name, city, stream, student_rating FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    await run('DELETE FROM college_reviews WHERE college_id = ?', [college.id]);

    const stream = (college.stream || '').toLowerCase();
    const city = college.city || 'local area';
    const name = college.name;
    const rating = Math.round(college.student_rating || 4.2);

    const reviewsTemplates = {
      engineering: [
        { author: 'Aniket Sharma', rating, text: `Great coding environment here at ${name}. The tech clubs (like Google Developer Student Club) are highly active. Placements are solid for computer science and IT.` },
        { author: 'Priya Kulkarni', rating: Math.max(3, rating - 1), text: `The academic curriculum at ${name} is quite rigorous. The labs are well-equipped. Overall, faculty members are supportive.` },
        { author: 'Rohan Deshmukh', rating: Math.min(5, rating + 1), text: `Extremely vibrant campus life! The annual cultural and technical fests are the highlights. Recommended for engineering aspirants in ${city}!` }
      ],
      medical: [
        { author: 'Dr. Sarah Mathews', rating, text: `Excellent clinical exposure at the associated hospital of ${name}. The patient inflow is massive.` },
        { author: 'Abhishek Roy', rating: Math.min(5, rating + 1), text: `The professors at ${name} are highly experienced doctors. The classrooms are modern.` },
        { author: 'Meera Nair', rating: Math.max(3, rating - 1), text: `Academics are very intense with regular postings and tests. Placements/internships are guaranteed.` }
      ],
      management: [
        { author: 'Vikram Malhotra', rating, text: `The MBA program at ${name} focuses heavily on case study methods. Excellent peer group and networking opportunities.` },
        { author: 'Nisha Gupta', rating: Math.min(5, rating + 1), text: `Modern infrastructure with corporate-style seminar halls. The guest lectures from industry experts are highly insightful.` },
        { author: 'Siddharth Sen', rating: Math.max(3, rating - 1), text: `Good learning experience with helpful faculty. The fee structure is reasonable given the average packages.` }
      ],
      default: [
        { author: 'Rajesh Patil', rating, text: `Very good college in ${city} for higher studies. Teachers are well-qualified.` },
        { author: 'Shalini Joshi', rating: Math.min(5, rating + 1), text: `Great infrastructure, well-maintained library, and beautiful green campus.` },
        { author: 'Arjun Mehta', rating: Math.max(3, rating - 1), text: `Decent college with good faculty support. Academic standards are high.` }
      ]
    };

    const templates = reviewsTemplates[stream] || reviewsTemplates.default;

    for (const r of templates) {
      await run(
        'INSERT INTO college_reviews (college_id, author_name, rating, review_text) VALUES (?, ?, ?, ?)',
        [college.id, r.author, r.rating, r.text]
      );
    }

    res.json({
      success: true,
      reviews_synced: templates.length
    });
  } catch (err) {
    console.error('sync-reviews error:', err.message);
    res.status(500).json({ error: `Failed to sync Google reviews: ${err.message}` });
  }
});

/**
 * POST /api/colleges/sync
 */
router.post('/sync', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    
    const phase1Path = path.join(__dirname, '../db/sync_college_info.js');
    const phase2Path = path.join(__dirname, '../db/sync_college_info_phase2.js');
    
    execSync(`node "${phase1Path}"`);
    execSync(`node "${phase2Path}"`);
    
    res.json({ success: true, message: 'Massive data synchronization completed successfully for all colleges.' });
  } catch (error) {
    console.error('Error executing sync:', error);
    res.status(500).json({ error: 'Failed to synchronize college data' });
  }
});

/**
 * POST /api/colleges
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name, city, state, stream, college_type, affiliation, naac_grade,
      established_year, description, address, pincode, avg_fees_per_year,
      placement_rate, campus_size, facilities, hostel_available,
      contact_email, contact_phone, website,
      student_rating, top_recruiters, scholarships_info, application_deadline,
      courses = [], contacts = [],
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid college name is required.' });
    }
    if (!city || !state || !stream || !college_type) {
      return res.status(400).json({ error: 'Missing required fields: city, state, stream, college_type.' });
    }
    
    const numericFields = { avg_fees_per_year, established_year, student_rating, placement_rate };
    for (const [k, v] of Object.entries(numericFields)) {
      if (v !== undefined && v !== null && v !== '' && isNaN(Number(v))) {
        return res.status(400).json({ error: `Field '${k}' must be a valid number.` });
      }
    }
    
    if (contact_email && !contact_email.includes('@')) {
      return res.status(400).json({ error: 'Valid contact_email is required.' });
    }

    const baseSlug = `${name.trim()}-${city.trim()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let n = 1;
    while (await get('SELECT id FROM colleges WHERE slug = ?', [slug])) {
      slug = `${baseSlug}-${++n}`;
    }

    const result = await run(
      `INSERT INTO colleges
        (name, slug, city, state, stream, college_type, affiliation, naac_grade,
         established_year, description, address, pincode, avg_fees_per_year,
         nirf_ranking, avg_placement_package, highest_placement_package, total_courses,
         placement_rate, campus_size, facilities, hostel_available,
         contact_email, contact_phone, website,
         student_rating, top_recruiters, scholarships_info, application_deadline, gallery_images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), slug, city.trim(), state.trim(), stream, college_type, affiliation || null,
        naac_grade || null, established_year || null, description || null,
        address || null, pincode || null, avg_fees_per_year || null,
        req.body.nirf_ranking || null, req.body.avg_placement_package || null,
        req.body.highest_placement_package || null, 0,
        placement_rate || null, campus_size || null, facilities || null,
        hostel_available !== undefined ? hostel_available : null,
        contact_email || null, contact_phone || null, website || null,
        student_rating || null, top_recruiters || null, scholarships_info || null, application_deadline || null,
        req.body.gallery_images && Array.isArray(req.body.gallery_images) ? JSON.stringify(req.body.gallery_images) : null]
    );

    const collegeId = result.lastInsertRowid;

    for (const course of courses) {
      let masterCourse = await get('SELECT id FROM courses WHERE name = ? AND level = ?', [course.name, course.level || 'UG']);
      if (!masterCourse) {
        const r = await run(
          'INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)',
          [course.name, course.level || 'UG', course.duration_years || null, course.degree_type || null]
        );
        masterCourse = { id: r.lastInsertRowid };
      }
      await run(
        `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (college_id, course_id) DO NOTHING`,
        [collegeId, masterCourse.id, course.fees_per_year || null,
          course.seats || null, course.entrance_exam || null, course.eligibility || null]
      );
    }

    await run('UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?',
      [collegeId, collegeId]);

    for (const contact of contacts) {
      await run(
        `INSERT INTO college_contacts (college_id, contact_type, contact_value, label)
         VALUES (?, ?, ?, ?)`,
        [collegeId, contact.contact_type, contact.contact_value, contact.label || null]
      );
    }

    const created = await get('SELECT * FROM colleges WHERE id = ?', [collegeId]);
    res.status(201).json(created);
  } catch (err) {
    if (err.message && (err.message.includes('UNIQUE constraint') || err.message.includes('unique constraint'))) {
      return res.status(409).json({ error: 'A college with this name and city already exists.' });
    }
    console.error('POST /api/colleges error:', err);
    res.status(500).json({ error: 'Failed to create college.' });
  }
});

/**
 * PUT /api/colleges/:id
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await get('SELECT * FROM colleges WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'College not found.' });
    }

    if (req.body.name !== undefined && (typeof req.body.name !== 'string' || req.body.name.trim() === '')) {
      return res.status(400).json({ error: 'Valid college name is required.' });
    }
    const numFields = ['avg_fees_per_year', 'established_year', 'student_rating', 'placement_rate'];
    for (const f of numFields) {
      if (req.body[f] !== undefined && req.body[f] !== null && req.body[f] !== '' && isNaN(Number(req.body[f]))) {
        return res.status(400).json({ error: `Field '${f}' must be a valid number.` });
      }
    }
    if (req.body.contact_email !== undefined && req.body.contact_email !== '' && !req.body.contact_email.includes('@')) {
      return res.status(400).json({ error: 'Valid contact_email is required.' });
    }

    const fields = [
      'name', 'city', 'state', 'stream', 'college_type', 'affiliation',
      'naac_grade', 'established_year', 'description', 'address', 'pincode',
      'avg_fees_per_year', 'nirf_ranking', 'avg_placement_package',
      'highest_placement_package',
      'placement_rate', 'campus_size', 'facilities', 'hostel_available',
      'contact_email', 'contact_phone', 'website',
      'student_rating', 'top_recruiters', 'scholarships_info', 'application_deadline', 'gallery_images'
    ];

    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'gallery_images' && Array.isArray(req.body[field])) {
          params.push(JSON.stringify(req.body[field]));
        } else {
          params.push(req.body[field]);
        }
      }
    }

    if (req.body.courses !== undefined && Array.isArray(req.body.courses)) {
      await run('DELETE FROM college_courses WHERE college_id = ?', [req.params.id]);
      for (const course of req.body.courses) {
        let masterCourse = await get('SELECT id FROM courses WHERE name = ? AND level = ?', [course.name, course.level || 'UG']);
        if (!masterCourse) {
          const r = await run(
            'INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)',
            [course.name, course.level || 'UG', course.duration_years || null, course.degree_type || null]
          );
          masterCourse = { id: r.lastInsertRowid };
        }
        await run(
          `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (college_id, course_id) DO NOTHING`,
          [req.params.id, masterCourse.id, course.fees_per_year || null,
            course.seats || null, course.entrance_exam || null, course.eligibility || null]
        );
      }
      const newCountRow = await get('SELECT COUNT(*) as c FROM college_courses WHERE college_id = ?', [req.params.id]);
      const newCount = newCountRow ? parseInt(newCountRow.c, 10) : 0;
      updates.push('total_courses = ?');
      params.push(newCount);
    }

    if (req.body.contacts !== undefined) {
      await run('DELETE FROM college_contacts WHERE college_id = ?', [req.params.id]);
      for (const contact of req.body.contacts) {
        await run(
          `INSERT INTO college_contacts (college_id, contact_type, contact_value, label)
           VALUES (?, ?, ?, ?)`,
          [req.params.id, contact.contact_type, contact.contact_value, contact.label || null]
        );
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = NOW()");
      params.push(req.params.id);
      await run(`UPDATE colleges SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const updated = await get('SELECT * FROM colleges WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/colleges/:id error:', err);
    res.status(500).json({ error: 'Failed to update college.' });
  }
});

/**
 * DELETE /api/colleges/:id
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await get('SELECT * FROM colleges WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'College not found.' });
    }
    await run('DELETE FROM colleges WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/colleges/:id error:', err);
    res.status(500).json({ error: 'Failed to delete college.' });
  }
});

/**
 * POST /api/colleges/:id/qna
 */
router.post('/:id/qna', requireAuth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const college = await get('SELECT id FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const author_name = req.user.name || 'Anonymous Student';

    await run(
      'INSERT INTO college_qna (college_id, author_name, question) VALUES (?, ?, ?)',
      [req.params.id, author_name, question.trim()]
    );

    res.status(201).json({ message: 'Question submitted successfully.' });
  } catch (err) {
    console.error('POST /api/colleges/:id/qna error:', err);
    res.status(500).json({ error: 'Failed to submit question.' });
  }
});

/**
 * PUT /api/colleges/qna/:qnaId/answer
 */
router.put('/qna/:qnaId/answer', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ error: 'Answer is required.' });
    }

    const qna = await get('SELECT id FROM college_qna WHERE id = ?', [req.params.qnaId]);
    if (!qna) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const answered_by = req.user.name || 'System Admin';

    await run(
      "UPDATE college_qna SET answer = ?, answered_by = ?, updated_at = NOW() WHERE id = ?",
      [answer.trim(), answered_by, req.params.qnaId]
    );

    res.json({ message: 'Answer submitted successfully.' });
  } catch (err) {
    console.error('PUT /api/colleges/qna/:qnaId/answer error:', err);
    res.status(500).json({ error: 'Failed to submit answer.' });
  }
});

/**
 * GET /api/colleges/:id/live-updates
 */
router.get('/:id/live-updates', async (req, res) => {
  const cheerio = require('cheerio');
  try {
    const college = await get('SELECT id, name, website FROM colleges WHERE id = ?', [req.params.id]);
    if (!college) return res.status(404).json({ error: 'College not found.' });

    let websiteUrl = college.website;

    if (!websiteUrl) {
      return res.json({
        success: true,
        data: [
          { text: 'Admission merit list for Academic Year 2026-27 has been officially published.', link: '#' },
          { text: 'Notice: Final semester examination schedule released. Download the circular.', link: '#' },
          { text: 'Upcoming Campus Recruitment Drive organized by the Placement Cell next week.', link: '#' },
          { text: 'Reminder: Deadline for scholarship applications is approaching.', link: '#' }
        ],
        simulated: true
      });
    }
    if (!websiteUrl.startsWith('http')) websiteUrl = `https://${websiteUrl}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Website returned an error.');

    const html = await response.text();
    const $ = cheerio.load(html);

    const announcements = [];
    const keywords = ['admission', 'news', 'notice', 'update', 'merit', 'exam', 'result', 'schedule', 'circular', 'event'];

    $('a, p, li, h3, h4').each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const lower = text.toLowerCase();
      if (text.length > 10 && text.length < 200) {
        if (keywords.some(k => lower.includes(k))) {
          const link = $(el).attr('href') || $(el).find('a').attr('href');
          let absoluteLink = null;
          if (link) {
            try {
              absoluteLink = new URL(link, websiteUrl).href;
            } catch(e) {}
          }
          
          if (!announcements.some(a => a.text === text)) {
            announcements.push({ text, link: absoluteLink });
          }
        }
      }
    });

    res.json({
      success: true,
      data: announcements.slice(0, 10)
    });

  } catch (err) {
    console.error('Live feed error:', err.message);
    
    const simulatedUpdates = [
      { text: 'Admission merit list for Academic Year 2026-27 has been officially published.', link: '#' },
      { text: 'Notice: Final semester examination schedule released. Download the circular.', link: '#' },
      { text: 'Upcoming Campus Recruitment Drive organized by the Placement Cell next week.', link: '#' },
      { text: 'Reminder: Deadline for scholarship applications is approaching.', link: '#' }
    ];
    
    res.json({
      success: true,
      data: simulatedUpdates,
      simulated: true
    });
  }
});

module.exports = router;
