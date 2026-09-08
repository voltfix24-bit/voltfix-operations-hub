# VoltFix hardening roadmap

- [ ] 1. Migration: create_guest_booking RPC + scheduled_time_window + get_public_slot_availability + claim_open_job + tightened jobs RLS + private job-photos + storage policies
- [x] 2. Pricing: shared formatter, service-specific base, planned discount, remove "30 minuten"
- [x] 3. Planned flow fetches availability -> TimeSlotCalendar; time window stored
- [ ] 4. Photos: private uploads guest/<uuid>, cleanup on failure, JobPhotoGrid signed URLs
- [ ] 5. Backoffice: claim via RPC, time window shown, signed grid, photo count in OpenJobsList
- [ ] 6. Edge function invite-technician + InviteTechnicianForm
- [ ] 7. Routing/SEO: noindex backoffice, /register -> /login, remove /track, header, contact config, robots.txt
- [x] 8. Tests: pricing tests, remove example test, test+build green (frontend block)
