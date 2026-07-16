Build a functional web application called "SIGAP-Kronis" — a Clinical Decision Support System 
for stratifying hypertension and Type 2 Diabetes patient risk at an Indonesian Puskesmas (community 
health center), using MADM (Multi-Attribute Decision Making) with AHP for criteria weighting and 
SAW + TOPSIS for patient ranking. This must include REAL WORKING LOGIC (calculations, state, role 
permissions), not just static visuals.

=== DATA MODEL ===
Each patient record has these fields (criteria):
- C1: Tekanan Darah Sistolik (mmHg) — COST (lower is better)
- C2: Gula Darah Puasa (mg/dL) — COST (lower is better)
- C3: Usia (tahun) — COST (lower is better)
- C4: IMT/BMI (kg/m²) — COST (lower is better)
- C5: Kepatuhan Kontrol/Minum Obat (scale 1-5) — BENEFIT (higher is better)

Default criteria weights (from AHP, editable by admin — see Admin Panel below):
W = { C1: 0.333, C2: 0.333, C3: 0.067, C4: 0.067, C5: 0.200 }

=== CALCULATION LOGIC (must be functional, recalculated live when data changes) ===

SAW METHOD:
1. For COST criteria: normalized value = min(all patients' value for this criteria) / patient's value
2. For BENEFIT criteria: normalized value = patient's value / max(all patients' value for this criteria)
3. SAW score = sum of (normalized value × weight) for all 5 criteria
4. Rank patients descending by SAW score (highest score = safest/lowest risk)

TOPSIS METHOD:
1. Normalize decision matrix: rij = xij / sqrt(sum of xij² for that column)
2. Weighted normalized matrix: yij = rij × weight
3. Determine ideal positive solution (A+): for COST criteria take MIN of column, for BENEFIT take MAX
4. Determine ideal negative solution (A-): for COST criteria take MAX of column, for BENEFIT take MIN
5. Calculate Euclidean distance from each patient to A+ (call it D+) and to A- (call it D-)
6. Preference score Vi = D- / (D+ + D-)
7. Rank patients descending by Vi (highest = safest/lowest risk)

RISK CATEGORY (based on TOPSIS Vi, apply to all patients):
- Vi >= 0.75 → "Aman" (green)
- 0.5 <= Vi < 0.75 → "Sedang" (yellow)  
- 0.25 <= Vi < 0.5 → "Tinggi" (orange)
- Vi < 0.25 → "Sangat Tinggi / Red Flag" (red)

=== USER ROLES & PERMISSIONS (implement actual role-based view switching after login) ===

1. KADER (health worker): can only INPUT new patient examination data and VIEW the ranking list 
(read-only). Cannot edit weights or manage users.

2. DOKTER/PERAWAT: can view full ranking + patient detail, can ADD follow-up notes/actions to a 
patient's history log, can mark a patient as "sudah ditindaklanjuti". Cannot edit criteria weights 
or manage users.

3. KEPALA PUSKESMAS/ADMIN: full access — can view aggregate dashboard, manage user accounts (add/
remove kader & dokter), and access the Admin Panel to adjust criteria weights or add/remove 
criteria (see below).

Use a simple role selector on login (dropdown or 3 demo login buttons: "Login sebagai Kader", 
"Login sebagai Dokter", "Login sebagai Admin") since this is a prototype — after "login" the 
sidebar menu items shown must differ per role.

=== SCREENS TO BUILD ===

1. LOGIN — SIGAP-Kronis branding, role-based demo login buttons as described above.

2. DASHBOARD (view varies slightly by role) — summary cards (Total Pasien, Pasien Red Flag, 
Sudah Ditindaklanjuti, Kunjungan Terjadwal), a donut/bar chart of patients by risk category, 
and a "Top 5 Prioritas" list. Kader sees a simplified version with fewer stats.

3. INPUT DATA PASIEN (Kader & Admin only) — form with the 5 criteria fields, patient name/ID 
field, "Simpan & Hitung Ulang" button that ACTUALLY recalculates and updates that patient's SAW/
TOPSIS score and re-sorts the ranking table live. Include basic validation (e.g., systolic BP 
must be a number between 60-250, age between 1-120) and show an inline error if invalid data 
is entered or a required field is empty.

4. RANKING & ANALYSIS — full sortable/filterable table of all patients with SAW score, TOPSIS 
score (Vi), risk category badge, and a toggle to compare SAW-only vs SAW+TOPSIS side by side. 
Clicking a row opens Patient Detail.

5. PATIENT DETAIL — shows raw criteria values, a radar chart vs population average, a follow-up 
history log (list of past actions with date + who performed it — Dokter/Perawat can add new 
entries here), and a color-coded recommendation banner based on risk category.

6. ADMIN PANEL (Admin/Kepala Puskesmas only) — three tabs:
   a) "Kelola Kriteria" — table listing C1-C5 with their current AHP weight and cost/benefit 
      type, editable fields, and an "Tambah Kriteria Baru" button to add a new criteria (name, 
      unit, cost/benefit type, weight) — when weights are changed, show a live total that must 
      sum to 1.0/100% before saving, and trigger recalculation of all patient scores.
   b) "Kelola Pengguna" — table of kader/dokter accounts with name, role, and status (Aktif/
      Nonaktif), with "Tambah Pengguna" and toggle-active buttons.
   c) "Kelola Data Pasien" — full CRUD table of all patients (edit/delete any patient record).

=== SUPPORTING FEATURES (implement, not just mention) ===
- Notification/alert banner on the Dashboard when a new patient becomes "Red Flag" status
- A small trend indicator on Patient Detail showing if the patient's last 2 recalculated scores 
  went up (improving) or down (worsening), with an up/down arrow icon
- "Ekspor Laporan" button on Ranking page (can just show a confirmation toast, doesn't need real 
  file export)
- Empty/edge case states: if a patient has no follow-up history yet, show "Belum ada riwayat 
  tindak lanjut" instead of a blank table; if fewer than 2 patients exist, show a message that 
  ranking needs at least 2 patients to compare

=== VISUAL STYLE ===
Color palette: primary teal/medical blue #0F5C7A, status colors: red #DC2626 (Sangat Tinggi), 
orange #F59E0B (Tinggi), yellow #FBBF24 (Sedang), green #16A34A (Aman). Font: Inter or Poppins. 
Clean, clinical, trustworthy — calm tone appropriate for healthcare, large readable text since 
some users (kader) may not be tech-savvy. Use patient initials/ID instead of full names in list 
views for privacy; show full name only in Patient Detail.

Pre-populate the app with 5 sample patients using the following exact data so the calculation 
logic can be demonstrated immediately without manual input:
- Bu Sari (62 th): sistolik 165, GDP 210, BMI 29, kepatuhan 2
- Pak Joko (45 th): sistolik 130, GDP 110, BMI 23, kepatuhan 4
- Bu Wati (55 th): sistolik 150, GDP 180, BMI 27, kepatuhan 3
- Pak Slamet (38 th): sistolik 120, GDP 95, BMI 21, kepatuhan 5
- Bu Ningsih (68 th): sistolik 175, GDP 230, BMI 31, kepatuhan 1