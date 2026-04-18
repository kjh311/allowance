# Allowance Tracker

A high-fidelity, Progressive Web App (PWA) designed for tracking children's allowances with a premium editorial aesthetic. Built with React, Tailwind CSS, and Supabase for real-time synchronization.

## ✨ Features

- **Premium Editorial Design**: A "No-Line" design system utilizing tonal layering, glassmorphism, and organic asymmetry.
- **Smart Allowance Logic**: 
  - Quick `+` and `-` buttons for instant balance updates based on child-specific increments.
  - Dedicated "Spend" input for one-off purchases.
- **Customizable Settings**: Define unique "Quick Add" amounts for each child.
- **Real-time Sync**: Instant balance updates across all devices powered by Supabase Realtime.
- **PWA Ready**: Installable on mobile and desktop for a native-like experience.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- A Supabase account and project

### 2. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema
Run the following SQL in your Supabase SQL Editor to initialize the table and enable real-time sync:

```sql
-- Create the Ledgers table
CREATE TABLE ledgers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  balance numeric DEFAULT 0,
  color text DEFAULT 'primary',
  increment_amount numeric DEFAULT 1.00,
  updated_at timestamptz DEFAULT now()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ledgers;

-- Set up RLS Policies (Critical for access)
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON ledgers FOR SELECT USING (true);
CREATE POLICY "Allow public update access" ON ledgers FOR UPDATE USING (true);

-- Insert Initial Data
INSERT INTO ledgers (name, balance, color, increment_amount)
VALUES 
  ('Lyriana', 42.50, 'primary', 1.00),
  ('Alexander', 18.25, 'tertiary', 0.50);
```

### 4. Installation & Development
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🎨 Design Principles
- **The "No-Line" Rule**: Avoid 1px dividers. Use background shifts and soft shadows (`shadow-ambient`) to define containers.
- **Intentional Asymmetry**: Use offset elements (like the curved side indicators) to create an organic, premium feel.
- **Material Symbols**: Integrated Google's Material Symbols Outlined for a professional, cohesive icon set.


## 🛠 Tech Stack
- **Frontend**: React, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Deployment**: PWA optimized via `vite-plugin-pwa`
