# მოსავალი (Harvest) - პროექტის სტატუსი

## 1. მონაცემთა ბაზა (Supabase/Postgres)
- [x] ძირითადი სქემა (Core Schema) - `supabase/migrations/01_core_schema.txt`
- [x] ბიზნეს ლოგიკა (Triggers, Functions, Views) - `supabase/migrations/02_logic.txt`
- [x] უსაფრთხოება (RLS Policies) - `supabase/migrations/03_rls.txt`
- [x] საწყისი მონაცემები (Seed Data) - `supabase/migrations/04_seed.txt`
- [x] ავტორიზაციის ტრიგერი (Auth Trigger) - `supabase/migrations/05_auth.txt`

## 2. ძირითადი მოდულები (UI/Frontend)
- [x] ავტორიზაცია (Login/Auth)
- [x] ნავიგაცია (Mobile/Desktop Layout)
- [x] მიწები (Fields) - სია, დეტალები, დამატება
- [x] მოსავალი (Lots) - სია, დეტალები, დამატება (მიღებით)
- [x] საწყობები (Warehouses) - სია, დეტალები (Bins), დამატება
- [x] გაყიდვები (Sales) - სია, დეტალები, დამატება (Atomic RPC)
- [x] გადატანა (Transfer)
- [x] სამუშაოები (Works) - სია, დეტალები (სტატუსის შეცვლა), დამატება
- [x] ხარჯები (Expenses) - სია, დამატება
- [x] რეპორტები (Reports) - მარაგი, ფინანსები, მოსავლიანობა

## 3. წესების იმპლემენტაცია
- [x] No Mixing (არევის აკრძალვა) - იმპლემენტირებულია DB დონეზე
- [x] No Negative Stock (უარყოფითი ნაშთის აკრძალვა) - იმპლემენტირებულია DB დონეზე
- [x] Tons/Kg კონვერტაცია UI-ში

---
*სტატუსი: დასრულებულია*
*თარიღი: 2026-01-05*