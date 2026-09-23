# Unverified / not seeded (honest gaps)

Items below were inspected against official `.gov.in` / `.nic.in` (and previously seeded utility sources) but were **not** treated as verified filing/tracking deep-links unless noted.

## Delhi Fire Service
- **Official complaint / grievances page** — `https://dfs.delhi.gov.in/dfs/complaint-and-grievances` is the verified official DFS channel URL used as `filing_url` for `dfs_complaint_grievances_info`. My Delhi opens this page only; it does **not** submit a complaint. Interactive form behavior may vary; treat as redirect to official platform.
- **Tracking URL** for fire complaints — **not verified**; left NULL.

## Delhi Jal Board
- **Web tracking URL for water/sewer complaints** — Official materials instruct tracking by calling **1916** with the SMS complaint reference. DJB RMS portal pages (`djb.gov.in` RMS grievance status) appear oriented to **revenue/billing** grievances, not confirmed as the water/sewer CCR track channel. `tracking_url` left **NULL**; phone channel seeded.
- Exact **required form fields** for any DJB web form — not inventoried as required; only recommended prep fields seeded.
- **Every ZRO phone from ContactUs.pdf** — intentionally **not** hardcoded into UI (area PDF opened as official channel instead).

## Water & Drainage (verified 2026-09-20)

### Verified and seeded
- **DJB** — `https://djb.gov.in/` + `https://djb.gov.in/StaticContent/ContactUs.pdf`: **1916** Water/Sewer option 1; Billing option 3; billing grievances direct **011-66587300**; alternate toll-free **1800117118** (prior seed).
- **MCD** — `https://mcdonline.nic.in/portal/feedback`: **155305**, MCD311, email helpdesk (Building/Construction seeds reused with waterlogging purpose).
- **NDMC Kali Bari water control** — `https://www.ndmc.gov.in/departments/civil_i.aspx`: **011-23743642**, **23360683**, **23747566**, **23747568** (NDMC-area geography). Civil hub `…/Departments/civil_complaints.aspx`.
- **NDMC sewerage** — `https://www.ndmc.gov.in/faq/sewerage_faqs.aspx` seeded as portal only (area-specific centres) — **no** fake universal NDMC sewer number.
- **I&FC** — `https://ifc.delhi.gov.in/ifc/organizational-setup`: waterlogging helpline **1800-11-0093**; Central Flood Control Room **011-21210867**. Flood rooms page `https://ifc.delhi.gov.in/ifc/flood-control-rooms` seeded as official URL.

### Unverified / not seeded (honest gaps)
- **1077** disaster helpline — **not** confirmed as current operational contact in this pass; left out (use 112/101/102 + I&FC 1800-11-0093).
- **I&FC flood-control-rooms page** live fetch timed out during audit; org-setup page confirmed helpline; flood-rooms URL retained as official path from user/source list.
- **NDMC area-specific sewerage centre phone list** — not copied into channels (stale risk); FAQ URL only.
- **DJB water/sewer web tracking URL** — NULL (track via 1916 + SMS).
- **Fake GIS / water jurisdiction polygons** — intentionally not seeded. GPS never maps to DJB/MCD/NDMC/I&FC.
- Any Water / Waste / Roads / Environment portals beyond Water & Drainage / Waste & Garbage / Roads & Public Spaces seeds above.

## MCD (Building — verified 2026-09-20)
- **Citizen Call Center 155305** — listed on `https://mcdonline.nic.in/portal/feedback`.
- **Email mcd-ithelpdesk@mcd.nic.in** — listed on the same feedback page (not labeled as Building Department email).
- **MCD311 complaint (createissue)** — linked from official feedback page as “Click here for Complaint” → `mcd.everythingcivic.com/citizen/createissue?...` (seeded as `action_url` / `filing_url`).
- **MCD311 tracking (issuedetail)** — linked from the same official feedback page → `mcd.everythingcivic.com/citizen/issuedetail?...` (seeded as `tracking_url`). Do **not** append `?reference=` or invent query params beyond the official link.
- **Building plan approval** — `https://eodb.mcd.gov.in/` (EODB OBPS) verified HTTP 200; also Town Planning info at `https://mcdonline.nic.in/tpobps-mcd/web/citizen/info`. Seeded as **approval-only** service — never default for dangerous-building complaints.
- Exact **required** MCD311 form field schema — not copied as `required`; only **recommended** prep fields where previously seeded.

## NDMC (Building — verified 2026-09-20)
- **Helpline 1533**, **WhatsApp 8588887773**, **care@ndmc.gov.in** — listed on `https://www.ndmc.gov.in/complaints.aspx` (care also via mailto on NDMC chrome).
- **Complaint action_url** — `https://www.ndmc.gov.in/complaints.aspx` (official complaints hub; NDMC 311 app for lodging). Dedicated interactive web form deep-link beyond this page **not** verified as a separate createissue URL.
- **Tracking URL** — **not verified** as a citizen track-by-reference page; `https://online.ndmc.gov.in/311_dashboard/` exists but is a dashboard — **not** seeded as `tracking_url`.
- **EBR** — `https://www.ndmc.gov.in/departments/ebr.aspx` documents unauthorized-construction enforcement and that complaints arrive via NDMC 311 / written / PGMS etc. Knowledge only; route citizen concerns to NDMC 311 / complaints hub, not as a legal finding.
- **Online Building Plan Approval** — `https://bap.ndmc.gov.in/bpamsclient/` linked from NDMC Online Services as “Online Building Approval”. Seeded as **approval-only** — never default complaint channel.
- Electricity helpline **19121** remains a separate prior seed — not used as Building civic contact.

## DDA (Building — verified 2026-09-20)
- **Helpline 1800110332**, **dirsagr@dda.org.in** — listed on DDA contact page (`dda.gov.in`).
- **Grievance hub** — `https://dda.gov.in/grievance` (lists STF, Grievance Portal, DDA 311 app, Samasya Nidaan).
- **Grievance Portal** — `https://dda.everythingcivic.com/login` linked from official grievance page.
- **Samasya Nidaan** — `https://dda.org.in/sns` linked from official pages.
- **STF** — `https://stf.dda.org.in/` linked from official grievance / STF pages.
- **Encroachment** — `http://ddaservices.dda.org.in/encroach/` linked from Online Public Services.
- **Online Building Permit** — `https://obps.dda.org.in/BPAMSClient/default.aspx` linked from Online Public Services — **approval-only**.
- **Dedicated tracking URL** with reference query param — **not verified**; left NULL on channels (do not invent).

## Delhi Cantonment Board (Building)
- **Website** `https://delhi.cantt.gov.in/` — official domain (live fetch timed out during this audit; keep prior seed).
- **Phones 25693837 / 25695450**, **email ceodelhicantt@gmail.com** — retained from prior official public-contact seed (gmail domain noted).
- **Complaint `action_url` / `tracking_url`** — **not verified**; left **NULL**. Do not invent a portal.

## UBBL 2016 (knowledge only)
- Official DDA Building Bye-Laws page: `https://dda.gov.in/building-laws`
- Notified PDF: `https://dda.gov.in/sites/default/files/2022-01/UBBL_2016_Notified.pdf`
- Knowledge / Learn more only — never a legal conclusion about a reported property.

## Electricity (BRPL / BYPL / TPDDL / NDMC) — verified 2026-09-20

### Verified and seeded
- **BRPL** — `https://www.bsesdelhi.com/web/brpl/contact-points`: **19123** (24x7), **011-49516707** (Emergency / Streetlight), WhatsApp **8800919123**. Email **brpl.customercare@reliancegroupindia.com** on BRPL feedback page. Power theft portal `…/web/brpl/report-power-theft`. BRPL Power App: Play Store `com.bses.bsesapp`, App Store id `1198980319`.
- **BYPL** — `https://www.bsesdelhi.com/web/bypl/contact-points`: **19122** (24x7), **011-41999808** labeled **Streetlight Emergency** (not seeded as fire/shock). Email **bypl.customercare@reliancegroupindia.com** on BYPL feedback page. Power theft portal `…/web/bypl/report-power-theft`. BYPL Connect: Play Store `com.bses.bypl.prod`, App Store id `1524511018`.
- **TPDDL** — Customer Charter / touchpoints: **19124**, **1800-208-9124**, **customercare@tatapower-ddl.com**. Online complaint `…/customer/complaint/online-complaint.aspx` and status `…/view-current-status.aspx` (homepage fetch returned 406 to automated client; URLs retained from official path structure + search confirmation). My Tata Power: Play Store `com.sew.tatapower`, App Store id `1606674128`.
- **DERC** — `https://www.derc.gov.in/` regulatory / rights / escalation knowledge only.
- **Rights** — Electricity (Rights of Consumers) Rules, 2020 + Amendment Rules, 2024 connection timeline maximums (metro 3 / municipal 7 / rural 15 / hilly 30) presented as **rules prescribe maximum subject to conditions**; Delhi SOP not unconditionally promised as 3 days.

### Unverified / not seeded (honest gaps)
- **BYPL separate fire/shock number** — current contact-points page only confirms Streetlight Emergency; no separate fire_shock phone seeded.
- **BRPL power-theft WhatsApp 9555010022** — appears in BSES citizen charter PDF; not re-confirmed as primary citizen CTA on the live theft form page in this pass — **not** seeded as the primary theft channel (portal is).
- **NDMC area-specific no-current centre phone list** — official page `electricity_nocurrent_complaint.aspx` exists; individual centre numbers **not** copied from partial snippets (risk of stale/wrong numbers). Seeded page URL only + prior **19121** helpline retained with “confirm NDMC area” note.
- **NDMC / DISCOM CGRF street addresses & emails** — older public bulletins list addresses; **not** re-verified as current on DERC/DISCOM pages this pass — escalation rows point to DERC / NDMC contacts pages without inventing phones/emails.
- **Electricity Ombudsman phone/email/address** — confirm on DERC; not seeded as dialable contacts.
- **UMANG electricity deep-links** — not assumed / not seeded.
- **Fake GIS / DISCOM polygons** — intentionally **not** seeded. GPS never maps to DISCOM.
- **SMS short codes** for no-supply — not verified on current pages; left NULL.
- **Tracking URL** for BRPL/BYPL by reference — not verified as public track-by-ref pages; left NULL (app/call centre).
- Exact Delhi DERC SoP compensation amounts / claim form URLs — knowledge only via DERC homepage; no invented claim portal.

## DPCC / PWD / Labour / Traffic (Construction — verified 2026-09-20)
- **PWD** — Official site `https://www.pwddelhi.gov.in/`. Sewa hub `/sewa` lists toll-free **1908**, WhatsApp chatbot **8130188222**, email **complaint@pwddelhi.gov.in**. Help Desk also lists 011-23490323 / 1800110093. Seeded Sewa action_url; **tracking_url** by reference **not** separately verified — left NULL. Confirm asset is PWD before directing citizens.
- **DPCC / Green Delhi** — Pollution complaints via official portal `https://greendelhi.nic.in/` (DPCC / Environment). Seeded as `action_url` / filing. In-portal tracking after login — **no** separate public `tracking_url` seeded.
- **DPCC homepage** — prior seed `https://www.dpcc.delhigovt.nic.in/` retained as information website.
- **Labour** — Shramik Helpline **155214** and HQ email **labjlc2.delhi@nic.in** listed on `labour.delhi.gov.in` contact / grievance pages. Dedicated construction complaint deep-link **not** verified — `action_url` NULL.
- **Traffic Police** — Helpline **1095** (also 25844444 in public materials). Seeded only as **conditional alternative** for traffic-management impacts — not for every road obstruction. No inventing complaint form URLs.
- **DFS** — Reuse existing Fire Safety / 101 path for `construction_fire_risk`. Do not duplicate DFS authorities.

## Source shells (future phases — not Construction-routed beyond above)
- **DERC**, **PGMS**, **CM Jan Sunwai** — registered in `sources` with official homepage URLs for later phases. CM Jan Sunwai uses `https://delhi.gov.in/` as homepage shell only — dedicated Jan Sunwai deep-link **not verified**.
- **I&FC** — upgraded from shell to Water & Drainage routing (see Water & Drainage section above).

## General
- Any phone, portal, or tracking URL **not** listed in seeds = treat as **Verification required** / **Not currently verified**.
- My Delhi **never** submits government complaints and never invents official reference numbers.
- Category ≠ authority: Building and Construction always show **Likely Authority** / jurisdiction confirmation — never auto-assigns all → MCD.
- Opening an official URL does **not** mark a complaint as filed.
- `MD-######` is internal only — never an official government reference.

## NOT VERIFIED — DO NOT DISPLAY
- Invented Building Department–specific emails (use general helpdesk/care emails only as labeled)
- Cantonment complaint / tracking portals
- NDMC citizen tracking deep-link by reference
- DDA tracking URL with invented query parameters
- PWD tracking-by-reference URL
- Labour construction-specific web form deep-link
- Traffic Police construction-obstruction web form
- DJB auto-routing for Construction water/drainage (show as needs_confirmation alternative only)
- Any Water / Waste / Roads / Environment portals beyond existing shells and Construction/Electricity/Water & Drainage/Waste & Garbage/Roads & Public Spaces seeds above
- Legal conclusions ("unauthorized", "illegal", "unsafe" as confirmed facts)
- Invented CGRF / Ombudsman phone numbers or APK download mirrors
- GPS → DISCOM auto-assignment
- GPS → DJB / all-water auto-assignment
- GPS → MCD / all-waste auto-assignment
- GPS → DPCC / all-waste auto-assignment
- GPS → PWD / all-roads auto-assignment
- GPS → Traffic Police for every pothole

## Waste & Garbage (verified 2026-09-20)

### Verified and seeded
- **MCD** — `https://mcdonline.nic.in/portal/feedback`: **155305**, MCD311, email **mcd-ithelpdesk@mcd.nic.in**. Create/track: MCD311 createissue + issuedetail (same official feedback links as Building).
- **NDMC** — prior verified `https://www.ndmc.gov.in/complaints.aspx`: **1533**, WhatsApp **8588887773**, **care@ndmc.gov.in**. Sanitation department page URL seeded for public_health purpose — area contacts NOT copied as universal officer numbers. Live fetch of complaints.aspx timed out this pass; retained prior verification.
- **Green Delhi** — `https://greendelhi.nic.in/` for pollution / burning complaints (DPCC public materials). Tracking inside portal after login — **no** separate public `tracking_url`.
- **DPCC burning WhatsApp 9717593574** — leave/garbage burning purpose only (DPCC functions-page text). Live `…/functions` returned HTTP **500** this pass; text reconfirmed via official-page snippet + prior public materials. **Not** a universal waste helpline. Fire → 112/101 first.
- **SWM Rules, 2026** — PIB confirms notification / in force from 2026-04-01 (supersedes 2016). Knowledge only — **no invented fines**. DPCC solid-waste page may still list 2016 documents.

### Unverified / not seeded (honest gaps)
- **DCB waste complaint phone / portal** — website `https://delhi.cantt.gov.in/` only; live fetch timed out; waste-specific contacts **NULL**.
- **NDMC track-by-reference URL** — still **NULL** (dashboard not seeded as tracking).
- **Hazardous / biomedical / e-waste citizen complaint portals** — **not** verified; DPCC website information only — do not invent authorized recycler lists or phones.
- **NDMC public_health_sanitation area officer phone list** — not copied (stale risk).
- **Fake GIS / waste jurisdiction polygons** — intentionally not seeded.
- Any invented MSW SLA hours / compensation amounts.
- Invented universal NDMC sewer number
- 1077 unless re-confirmed on a current official source

## Roads & Public Spaces (verified 2026-09-20)

### Verified and seeded
- **MCD** — prior `mcdonline.nic.in/portal/feedback`: **155305**, MCD311 create/track, **mcd-ithelpdesk@mcd.nic.in**. Live feedback fetch timed out this pass; retained prior Building/Waste verification.
- **NDMC** — prior `complaints.aspx`: **1533**, WhatsApp **8588887773**, **care@ndmc.gov.in**. Civil-I `civil_i.aspx` confirms roads / footpaths / parks / FOB / Bus-Q-Shelters in NDMC area (search snippet + responsibilities pages). Live complaints.aspx timed out; retained prior seed. **No** invented city-wide bus-shelter operator.
- **PWD** — `https://www.pwddelhi.gov.in/` chrome shows **1908**. Sewa `/sewa` lists **1908**, WhatsApp **8130188222**, **complaint@pwddelhi.gov.in**. Submit: `pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/`. Status: `…/CheckComplaintStatus` (search by mobile/email/complaint number — seeded as tracking_url). Portal index also lists **complaint@pwddelhi.com** — see gap below.
- **Traffic Police** — live `traffic.delhipolice.gov.in/en/contact-us`: **1095**, **011-25844444**, **grievance.traffic@delhipolice.gov.in**. Not for every pothole.
- **DDA** — reuse Building grievance: **1800110332**, **dirsagr@dda.org.in**, `dda.gov.in/grievance` — parks/roads only when DDA context.
- **I&FC** — waterlogging helpline **1800-11-0093** cross-ref for road waterlogging (not auto road owner).

### Unverified / not seeded (honest gaps)
- **PWD email `complaint@pwddelhi.com`** — appears on Sewa portal chrome; seeded **complaint@pwddelhi.gov.in** from `/sewa` + Help Desk. Do not treat `.com` as primary without re-confirm.
- **PWD SEWA App Store / Play Store deep-links** — homepage mentions apps; store URLs not separately verified — open Sewa hub.
- **Traffic Police dedicated online complaint form** (node/391 guidance) — contact-us verified; separate create-complaint deep-link **not** verified this pass — contact page only.
- **DCB road/park complaint phones** — website only this pass (live fetch timed out); phones **NULL**.
- **NDMC / DDA / Traffic track-by-reference URL** — **NULL** (do not invent).
- **City-wide bus shelter operator** (non-NDMC) — **not** invented; NDMC Civil-I only when NDMC area.
- **DISCOM streetlight phones** — **not** duplicated here; reuse Electricity category streetlight architecture.
- **Fake GIS / road-ownership polygons** — intentionally not seeded. GPS never maps to MCD/PWD/NDMC.
- Any invented repair SLA hours / compensation amounts.
- GPS → all-roads → PWD or MCD
- GPS → Traffic Police for every pothole

## Environment (verified 2026-09-20)

### Verified and seeded
- **NGMS noise** — `https://ngms.delhi.gov.in/` action; track `https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx`; helpline **155271**. Prefer over DPCC / Environment Dept homepage for noise.
- **Forest** — grievance `https://grievance.eforest.delhi.gov.in/`; Green Helpline **1800-11-8600**; status `https://ghl.eforest.delhi.gov.in/Status.aspx`. Not every municipal park → Forest.
- **Green Delhi App** — Play `com.green_delhi_teste`; iOS id **1586987377**; portal `https://greendelhi.nic.in/` (in-app tracking after login — no separate public tracking_url).
- **Environment Dept** — `https://environment.delhi.gov.in/` reference only.
- **DPCC** — homepage retained; burning WhatsApp **9717593574** reused for burning purpose only (prior Waste verification). Not all environment → DPCC.
- **CM Jan Sunwai** — `https://cmjansunwai.delhi.gov.in/` general fallback last; tracker `/ComplaintTracker`.

### Unverified / not seeded (honest gaps)
- Forest grievance portal separate “View Status” deep-link beyond Green Helpline Status — use Status.aspx when citizen has a helpline complaint number.
- Invented DPCC-specific noise form — **do not** seed; NGMS is the noise action channel.
- Every municipal park ownership map — intentionally not seeded.
- GPS → DPCC / Forest / NGMS auto-assignment — never.
