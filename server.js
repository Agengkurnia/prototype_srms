const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel Compatibility Settings
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
const DB_PATH = isVercel ? path.join('/tmp', 'db.json') : path.join(__dirname, 'db.json');
const UPLOAD_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'public', 'uploads');

const EMPTY_DB = {
  slopes: [],
  documents: [],
  records: [],
  inspections: [],
  maintenances: [],
  preservations: [],
  mitigations: []
};

function ensureDB() {
  if (fs.existsSync(DB_PATH)) return;
  const srcDB = path.join(__dirname, 'db.json');
  try {
    if (fs.existsSync(srcDB)) {
      fs.copyFileSync(srcDB, DB_PATH);
    } else {
      fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('ensureDB failed:', err);
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
  }
}

if (isVercel) {
  ensureDB();
}

// Ensure upload directory exists (will succeed in /tmp or local)
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create upload directory:", e);
  }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Helper to read DB
function readDB() {
  ensureDB();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('readDB failed:', err);
    writeDB(EMPTY_DB);
    return { ...EMPTY_DB };
  }
}

// Helper to write DB
function writeDB(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Health check (useful for Vercel debugging)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    vercel: isVercel,
    dbExists: fs.existsSync(DB_PATH),
    dbPath: isVercel ? '/tmp/db.json' : 'local'
  });
});

// GET all slopes with search & filter
app.get('/api/slopes', (req, res) => {
  const db = readDB();
  let slopes = db.slopes || [];
  
  const search = req.query.search ? req.query.search.toLowerCase() : '';
  const side = req.query.side_of_road || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;

  if (search) {
    slopes = slopes.filter(s => 
      s.slope_name.toLowerCase().includes(search) || 
      s.location.toLowerCase().includes(search)
    );
  }

  if (side) {
    slopes = slopes.filter(s => s.side_of_road === side);
  }

  const total = slopes.length;
  const startIndex = (page - 1) * limit;
  const paginated = slopes.slice(startIndex, startIndex + limit);

  res.json({
    slopes: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    sideA: db.slopes.filter(s => s.side_of_road === 'A').length,
    sideB: db.slopes.filter(s => s.side_of_road === 'B').length
  });
});

// GET dashboard compiled telemetry and stats
app.get('/api/dashboard/stats', (req, res) => {
  const db = readDB();
  const slopes = db.slopes || [];
  const records = db.records || [];
  const inspections = db.inspections || [];
  const maintenances = db.maintenances || [];
  const preservations = db.preservations || [];
  const mitigations = db.mitigations || [];
  
  // Calculate risk classes
  let highRiskCount = 0;
  let medRiskCount = 0;
  let lowRiskCount = 0;
  let highestRiskSlope = null;
  let maxRS = -1;

  const typeCounts = {
    'cut-type': 0,
    'rock-type': 0,
    'fill-type': 0,
    'retaining-type': 0,
    'combine-type': 0
  };

  let sideAHigh = 0, sideAMed = 0, sideALow = 0, sideATotalRS = 0, sideACount = 0;
  let sideBHigh = 0, sideBMed = 0, sideBLow = 0, sideBTotalRS = 0, sideBCount = 0;

  slopes.forEach(s => {
    // Increment type count
    if (typeCounts[s.slope_type] !== undefined) {
      typeCounts[s.slope_type]++;
    }

    // Determine risk rating
    const rs = s.ranking && s.ranking.RS !== '-' ? parseFloat(s.ranking.RS) : 0;
    if (rs >= 1000) {
      highRiskCount++;
    } else if (rs >= 100) {
      medRiskCount++;
    } else {
      lowRiskCount++;
    }

    // Tracks highest risk
    if (rs > maxRS) {
      maxRS = rs;
      highestRiskSlope = s;
    }

    // Road side calculations
    if (s.side_of_road === 'A') {
      sideACount++;
      sideATotalRS += rs;
      if (rs >= 1000) {
        sideAHigh++;
      } else if (rs >= 100) {
        sideAMed++;
      } else {
        sideALow++;
      }
    } else if (s.side_of_road === 'B') {
      sideBCount++;
      sideBTotalRS += rs;
      if (rs >= 1000) {
        sideBHigh++;
      } else if (rs >= 100) {
        sideBMed++;
      } else {
        sideBLow++;
      }
    }
  });

  const sideARisk = {
    high: sideAHigh,
    med: sideAMed,
    low: sideALow,
    avgRS: sideACount > 0 ? sideATotalRS / sideACount : 0
  };

  const sideBRisk = {
    high: sideBHigh,
    med: sideBMed,
    low: sideBLow,
    avgRS: sideBCount > 0 ? sideBTotalRS / sideBCount : 0
  };

  // Compile recent failures with slope names
  const recentRecords = records.slice(-4).reverse().map(r => {
    const matchingSlope = slopes.find(s => s.slug === r.slug);
    return {
      ...r,
      slope_name: matchingSlope ? matchingSlope.slope_name : 'Unknown Slope',
      location: matchingSlope ? matchingSlope.location : ''
    };
  });

  // Map slope coordinates for map visualization
  const mapMarkers = slopes.map(s => ({
    slope_name: s.slope_name,
    slug: s.slug,
    location: s.location,
    latitude: s.latitude,
    longtitude: s.longtitude,
    slope_type: s.slope_type,
    rs: s.ranking && s.ranking.RS !== '-' ? parseFloat(s.ranking.RS) : 0
  }));

  // Upcoming inspection schedules (sorted by nearest engineer inspection date)
  const upcomingInspections = slopes
    .filter(s => s.engineer_inspection)
    .map(s => ({
      slope_name: s.slope_name,
      slug: s.slug,
      location: s.location,
      side_of_road: s.side_of_road,
      engineer_inspection: s.engineer_inspection,
      maintenance_inspection: s.maintenance_inspection,
      consequence_to_life: (s.rating && s.rating.consequence_to_life) || 'category-2',
      rs: s.ranking && s.ranking.RS !== '-' ? parseFloat(s.ranking.RS) : 0
    }))
    .sort((a, b) => new Date(a.engineer_inspection) - new Date(b.engineer_inspection))
    .slice(0, 8);

  // Calculate mitigation costs
  let totalMitigationCost = 0;
  mitigations.forEach(m => {
    const cost = m.mitigation_estimate && m.mitigation_estimate.total ? parseFloat(m.mitigation_estimate.total) : 0;
    totalMitigationCost += cost;
  });

  res.json({
    totalSlopes: slopes.length,
    sideA: slopes.filter(s => s.side_of_road === 'A').length,
    sideB: slopes.filter(s => s.side_of_road === 'B').length,
    highRiskCount,
    medRiskCount,
    lowRiskCount,
    typeCounts,
    highestRiskSlope,
    recentRecords,
    upcomingInspections,
    mapMarkers,
    sideARisk,
    sideBRisk,
    // Enriched stats for dashboards
    totalInspections: inspections.length,
    totalMaintenances: maintenances.length,
    totalPreservations: preservations.length,
    totalMitigations: mitigations.length,
    totalMitigationCost
  });
});

// GET single slope detail
app.get('/api/slopes/:slug', (req, res) => {
  const db = readDB();
  const slope = db.slopes.find(s => s.slug === req.params.slug);
  if (!slope) return res.status(404).json({ error: 'Slope not found' });

  // Get matching documents and records
  const documents = (db.documents || []).filter(d => d.slug === slope.slug);
  const records = (db.records || []).filter(r => r.slug === slope.slug);
  const inspections = (db.inspections || []).filter(i => i.slug === slope.slug);
  const maintenances = (db.maintenances || []).filter(m => m.slug === slope.slug);
  const preservations = (db.preservations || []).filter(p => p.slug === slope.slug);
  const mitigations = (db.mitigations || []).filter(m => m.slug === slope.slug);

  res.json({ slope, documents, records, inspections, maintenances, preservations, mitigations });
});

// POST create base slope
app.post('/api/slopes', (req, res) => {
  const db = readDB();
  const { slope_name, location, sta1, sta2, latitude, longitude, gps1, gps2, side_of_road, slope_type } = req.body;

  if (!slope_name) return res.status(400).json({ error: 'Slope name is required' });

  const slug = slope_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Check unique slug
  if (db.slopes.some(s => s.slug === slug)) {
    return res.status(400).json({ error: 'Slope name must be unique' });
  }

  const newSlope = {
    id: db.slopes.length ? Math.max(...db.slopes.map(s => s.id)) + 1 : 1,
    slope_name,
    slug,
    location: location || '',
    sta1: sta1 || '',
    sta2: sta2 || '',
    latitude: latitude || null,
    longtitude: longitude || null, // Map longtitude/longitude consistency
    gps1: gps1 || null,
    gps2: gps2 || null,
    side_of_road,
    slope_type,
    geometry: null,
    characteristic: null,
    rating: null,
    ranking: null,
    engineer_inspection: null,
    maintenance_inspection: null,
    img: []
  };

  db.slopes.push(newSlope);
  writeDB(db);

  res.json({ success: true, slug });
});

// POST edit basic slope info
app.post('/api/slopes/:slug/edit', (req, res) => {
  const db = readDB();
  const slopeIndex = db.slopes.findIndex(s => s.slug === req.params.slug);
  if (slopeIndex === -1) return res.status(404).json({ error: 'Slope not found' });

  const { location, sta1, sta2, latitude, longitude, gps1, gps2, side_of_road } = req.body;
  const slope = db.slopes[slopeIndex];

  slope.location = location;
  slope.sta1 = sta1;
  slope.sta2 = sta2;
  slope.latitude = latitude;
  slope.longtitude = longitude;
  slope.gps1 = gps1;
  slope.gps2 = gps2;
  slope.side_of_road = side_of_road;

  writeDB(db);
  res.json({ success: true, slope });
});

// POST save slope geometry
app.post('/api/slopes/:slug/geometry', (req, res) => {
  const db = readDB();
  const slope = db.slopes.find(s => s.slug === req.params.slug);
  if (!slope) return res.status(404).json({ error: 'Slope not found' });

  const geo = req.body;
  
  // Calculate feature height based on type
  let feature_height = 0;
  if (slope.slope_type === 'cut-type' || slope.slope_type === 'combine-type') {
    const soil = parseFloat(geo.soil_slope_height) || 0;
    const rock = parseFloat(geo.rock_slope_height) || 0;
    const crest = parseFloat(geo.crest_wall_height) || 0;
    const toe = parseFloat(geo.toe_wall_height) || 0;
    feature_height = soil + rock + crest + toe;
  } else if (slope.slope_type === 'rock-type') {
    const soil = parseFloat(geo.soil_slope_height) || 0;
    const rock = parseFloat(geo.rock_slope_height) || 0;
    const crest = parseFloat(geo.crest_wall_height) || 0;
    const toe = parseFloat(geo.toe_wall_height) || 0;
    feature_height = soil + rock + crest + toe;
  } else if (slope.slope_type === 'fill-type') {
    const fill = parseFloat(geo.fill_slope_height) || 0;
    const crest = parseFloat(geo.crest_wall_height) || 0;
    const toe = parseFloat(geo.toe_wall_height) || 0;
    feature_height = fill + crest + toe;
  } else if (slope.slope_type === 'retaining-type') {
    const wall = parseFloat(geo.wall_height) || 0;
    const soil = parseFloat(geo.soil_slope_height) || 0;
    const rock = parseFloat(geo.rock_slope_height) || 0;
    feature_height = wall + soil + rock;
  }

  geo.feature_height = feature_height;
  slope.geometry = geo;

  writeDB(db);
  res.json({ success: true });
});

// POST save slope characteristic
app.post('/api/slopes/:slug/characteristic', (req, res) => {
  const db = readDB();
  const slope = db.slopes.find(s => s.slug === req.params.slug);
  if (!slope) return res.status(404).json({ error: 'Slope not found' });

  slope.characteristic = req.body;

  writeDB(db);
  res.json({ success: true });
});

// POST save slope rating & calculate ranking scores
app.post('/api/slopes/:slug/rating', (req, res) => {
  const db = readDB();
  const slopeIndex = db.slopes.findIndex(s => s.slug === req.params.slug);
  if (slopeIndex === -1) return res.status(404).json({ error: 'Slope not found' });

  const slope = db.slopes[slopeIndex];
  const rating = req.body;
  slope.rating = rating;

  const geometry = slope.geometry || {};
  const feature_height = parseFloat(geometry.feature_height) || 1;

  // Convert all rating inputs to float/int
  const A1 = parseFloat(rating.A1) || 1;
  const A2 = parseFloat(rating.A2) || 1;
  const A3 = parseFloat(rating.A3) || 1;
  const A4 = parseFloat(rating.A4) || 1;
  const A5 = parseFloat(rating.A5) || 1;
  const B1 = parseFloat(rating.B1) || 1;
  const B2 = parseFloat(rating.B2) || 1;
  const C1 = parseFloat(rating.C1) || 1;
  const C2 = parseFloat(rating.C2) || 1;
  const D1 = parseFloat(rating.D1) || 1;
  const D2 = parseFloat(rating.D2) || 1;

  let IS = 1;
  let CS = 1;
  let TS = 1;
  let RS = 0;
  let ranking = {};

  if (slope.slope_type === 'cut-type' || slope.slope_type === 'combine-type') {
    IS = A1 * A2 * A3 * A4 * A5 * B1 * B2;
    CS = ((C1 * C2) + (D1 * D2)) * feature_height;
    TS = IS * CS;
    if (slope.slope_type === 'cut-type') {
      RS = TS * 0.063;
    } else {
      RS = (TS * 0.063) + (TS * 0.027); // combine-type formula
    }
    ranking = { IS, CS, TS, RS };
  } else if (slope.slope_type === 'rock-type') {
    IS = A1 * A2 * A3 * A4 * B1 * B2;
    let K = 1;
    if (rating.scale_of_failure === 'Large') K = 5;
    else if (rating.scale_of_failure === 'Medium') K = 3;
    else K = 1;
    CS = ((C1 * C2) + (D1 * D2)) * K;
    TS = IS * CS;
    RS = TS * 0.022;
    ranking = { IS, CS, TS, RS };
  } else if (slope.slope_type === 'fill-type') {
    const C21 = parseFloat(rating.C21) || 1;
    const C22 = parseFloat(rating.C22) || 1;
    const C23 = parseFloat(rating.C23) || 1;
    const D21 = parseFloat(rating.D21) || 1;
    const D22 = parseFloat(rating.D22) || 1;
    const D23 = parseFloat(rating.D23) || 1;

    const IS1 = A1 * A2 * B1 * B2;
    const IS2 = A1 * A3 * B1 * B2;
    const IS3 = A1 * A4 * B1 * B2;

    const CS1 = ((C1 * C21) + (D1 * D21)) * feature_height;
    const CS2 = ((C1 * C22) + (D1 * D22)) * feature_height;
    const CS3 = ((C1 * C23) + (D1 * D23)) * feature_height;

    TS = (IS1 * CS1) + (IS2 * CS2) + (IS3 * CS3);
    RS = TS * 0.006;

    ranking = {
      IS1, IS2, IS3,
      CS1, CS2, CS3,
      IS: '-',
      CS: '-',
      TS,
      RS
    };
  } else if (slope.slope_type === 'retaining-type') {
    IS = A1 * A2 * A3 * A4 * A5 * B1 * B2;
    CS = ((C1 * C2) + (D1 * D2)) * feature_height;
    TS = IS * CS;
    RS = TS * 0.027;
    ranking = { IS, CS, TS, RS };
  }

  slope.ranking = ranking;

  // Set next inspection dates based on Consequence Category
  const cons = rating.consequence_to_life || 'category-2';
  let inspectionYears = 5;
  let maintenanceYears = 1;
  if (cons === 'category-3') {
    inspectionYears = 10;
    maintenanceYears = 2;
  }

  const now = new Date();
  const engDate = new Date();
  engDate.setFullYear(now.getFullYear() + inspectionYears);
  const maintDate = new Date();
  maintDate.setFullYear(now.getFullYear() + maintenanceYears);

  slope.engineer_inspection = engDate.toISOString();
  slope.maintenance_inspection = maintDate.toISOString();

  // Create historical inspection entry
  if (!db.inspections) {
    db.inspections = [];
  }
  const newInspection = {
    id: db.inspections.length ? Math.max(...db.inspections.map(i => i.id)) + 1 : 1,
    slope_name: slope.slope_name,
    slug: slope.slug,
    slope_type: slope.slope_type,
    date_of_inspection: now.toISOString(),
    weather_condition: (geometry && geometry.weather_condition) || 'Sunny',
    geometry: slope.geometry,
    characteristic: slope.characteristic,
    rating: slope.rating,
    ranking: slope.ranking,
    img: slope.img || []
  };
  db.inspections.push(newInspection);

  writeDB(db);
  res.json({ success: true, slope });
});

// DELETE a slope
app.delete('/api/slopes/:slug', (req, res) => {
  const db = readDB();
  const slug = req.params.slug;
  
  db.slopes = db.slopes.filter(s => s.slug !== slug);
  db.documents = (db.documents || []).filter(d => d.slug !== slug);
  db.records = (db.records || []).filter(r => r.slug !== slug);

  writeDB(db);
  res.json({ success: true });
});

// POST upload slope document
app.post('/api/slopes/:slug/documents', upload.single('doc_file'), (req, res) => {
  const db = readDB();
  const slug = req.params.slug;
  const original_name = req.file ? req.file.originalname : req.body.doc || 'document.pdf';
  const uploader = req.body.uploader || 'Admin User';

  const newDoc = {
    id: (db.documents && db.documents.length) ? Math.max(...db.documents.map(d => d.id)) + 1 : 1,
    file_name: original_name,
    slug,
    direction: req.file ? req.file.filename : 'doc_mock.pdf',
    extension: original_name.split('.').pop() || 'pdf',
    uploader,
    original_name,
    created_at: new Date().toISOString()
  };

  db.documents.push(newDoc);
  writeDB(db);

  res.json({ success: true, document: newDoc });
});

// DELETE document
app.delete('/api/documents/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  
  db.documents = db.documents.filter(d => d.id !== id);
  writeDB(db);
  
  res.json({ success: true });
});

// POST add failure record
app.post('/api/slopes/:slug/records', (req, res) => {
  const db = readDB();
  const slug = req.params.slug;
  const recordData = req.body;

  const newRecord = {
    id: db.records.length ? Math.max(...db.records.map(r => r.id)) + 1 : 1,
    slug,
    ...recordData,
    created_at: new Date().toISOString()
  };

  db.records.push(newRecord);
  writeDB(db);

  res.json({ success: true, record: newRecord });
});

// DELETE record
app.delete('/api/records/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  
  db.records = db.records.filter(r => r.id !== id);
  writeDB(db);

  res.json({ success: true });
});

// GET all inspections
app.get('/api/inspections', (req, res) => {
  const db = readDB();
  res.json(db.inspections || []);
});

// GET inspections for a single slope
app.get('/api/slopes/:slug/inspections', (req, res) => {
  const db = readDB();
  const list = (db.inspections || []).filter(i => i.slug === req.params.slug);
  res.json(list);
});

// GET all maintenances
app.get('/api/maintenances', (req, res) => {
  const db = readDB();
  res.json(db.maintenances || []);
});

// POST maintenance
app.post('/api/slopes/:slug/maintenances', (req, res) => {
  const db = readDB();
  const slug = req.params.slug;
  const slope = db.slopes.find(s => s.slug === slug);
  if (!slope) return res.status(404).json({ error: 'Slope not found' });

  const { date_of_maintenance, weather_condition, resume } = req.body;

  const newMaint = {
    id: db.maintenances.length ? Math.max(...db.maintenances.map(m => m.id)) + 1 : 1,
    slope_name: slope.slope_name,
    slug: slope.slug,
    slope_type: slope.slope_type,
    date_of_maintenance: date_of_maintenance || new Date().toISOString().split('T')[0],
    weather_condition: weather_condition || 'Sunny',
    resume: resume || '',
    img: []
  };

  if (!db.maintenances) {
    db.maintenances = [];
  }
  db.maintenances.push(newMaint);

  // Recalculate next maintenance date based on consequence category (category-3 = 2 yrs, category-1/2 = 1 yr)
  const rating = slope.rating || {};
  const cons = rating.consequence_to_life || 'category-2';
  const maintYears = cons === 'category-3' ? 2 : 1;
  
  const baseDate = date_of_maintenance ? new Date(date_of_maintenance) : new Date();
  baseDate.setFullYear(baseDate.getFullYear() + maintYears);
  slope.maintenance_inspection = baseDate.toISOString();

  writeDB(db);
  res.json({ success: true, maintenance: newMaint, slope });
});

// GET all preservations
app.get('/api/preservations', (req, res) => {
  const db = readDB();
  res.json(db.preservations || []);
});

// POST preservation
app.post('/api/slopes/:slug/preservations', (req, res) => {
  const db = readDB();
  const slug = req.params.slug;
  const slope = db.slopes.find(s => s.slug === slug);
  if (!slope) return res.status(404).json({ error: 'Slope not found' });

  const { date_of_landslide, landslide_type, type_of_improvement_works, type, note } = req.body;

  const newPres = {
    id: db.preservations.length ? Math.max(...db.preservations.map(p => p.id)) + 1 : 1,
    slope_name: slope.slope_name,
    slug: slope.slug,
    slope_type: slope.slope_type,
    date_of_landslide: date_of_landslide || new Date().toISOString().split('T')[0],
    landslide_type: landslide_type || 'Flow Landslide',
    type_of_improvement_works: type_of_improvement_works || 'Preventive maintenance works',
    type: type || {},
    file: [],
    note: note || '',
    created_at: new Date().toISOString()
  };

  if (!db.preservations) {
    db.preservations = [];
  }
  db.preservations.push(newPres);
  writeDB(db);
  res.json({ success: true, preservation: newPres });
});

// DELETE preservation
app.delete('/api/preservations/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.preservations = (db.preservations || []).filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// GET all mitigations
app.get('/api/mitigations', (req, res) => {
  const db = readDB();
  res.json(db.mitigations || []);
});

// POST mitigation
app.post('/api/slopes/:slug/mitigations', (req, res) => {
  const db = readDB();
  const slug = req.params.slug;
  const slope = db.slopes.find(s => s.slug === slug);
  if (!slope) return res.status(404).json({ error: 'Slope not found' });

  const { slope_condition, mitigation_strategy, mitigation_estimate, author } = req.body;

  const newMit = {
    id: db.mitigations.length ? Math.max(...db.mitigations.map(m => m.id)) + 1 : 1,
    slope_name: slope.slope_name,
    slug: slope.slug,
    slope_type: slope.slope_type,
    slope_condition: slope_condition || '',
    mitigation_strategy: mitigation_strategy || '',
    mitigation_estimate: mitigation_estimate || {},
    author: author || 'Admin User',
    created_at: new Date().toISOString()
  };

  if (!db.mitigations) {
    db.mitigations = [];
  }
  db.mitigations.push(newMit);
  writeDB(db);
  res.json({ success: true, mitigation: newMit });
});

// DELETE mitigation
app.delete('/api/mitigations/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.mitigations = (db.mitigations || []).filter(m => m.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Start server
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  LHMS/SRMS STANDALONE CRUD PROTOTYPE RUNNING          `);
    console.log(`  Access URL: http://localhost:${PORT}                 `);
    console.log(`=======================================================`);
  });
}

module.exports = app;
