# მოსავალი (Harvest) - Farm Management System

This is a Next.js application for managing farm operations (barley, wheat), localized in Georgian.

## Setup & Installation

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Supabase Setup (CRITICAL):**
    Because this environment has restrictions on `.sql` files, the database scripts are provided as `.txt` files in `supabase/migrations/`.
    
    Go to your Supabase project's **SQL Editor** and run the contents of these files in order:
    1.  `01_core_schema.txt` - Creates tables and enums.
    2.  `02_logic.txt` - Creates views, triggers (No Mixing, No Negative Stock), and RPC functions.
    3.  `03_rls.txt` - Enables security (isolation per farm).
    4.  `04_seed.txt` - Inserts default crops and work types.

3.  **Environment Variables:**
    Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```

## Business Rules Implemented
- **No Mixing:** Prevents adding a different lot to a bin that already has an active lot.
- **No Negative Stock:** Movements that result in less than 0 kg are blocked.
- **Atomic Sales:** Sales and inventory reduction happen in a single transaction via Postgres function.
- **Farm Isolation:** Users only see data belonging to their farm.

## Language
The UI is 100% Georgian. UI strings are centralizaed in `lib/strings.ts`.