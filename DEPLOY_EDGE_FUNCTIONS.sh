#!/bin/bash
# ============================================================
# SKYBRIDGE TRAVEL — Deploy Edge Functions to Supabase
# Run this script after installing Supabase CLI and logging in
# ============================================================

echo "🚀 Deploying Skybridge Travel Edge Functions..."
echo ""

# Step 1: Install Supabase CLI if not installed
# npm install -g supabase

# Step 2: Login (run this once)
# npx supabase login

# Step 3: Deploy all functions
PROJECT_REF="cysneoxmhwkbkhqdulwm"

functions=(
  "search-flights"
  "book-flight"
  "search-hotels"
  "book-hotel"
  "google-calendar"
  "meta-webhook"
)

for fn in "${functions[@]}"; do
  echo "📦 Deploying: $fn"
  npx supabase functions deploy "$fn" \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt
  echo "✅ $fn deployed"
  echo ""
done

echo "🎉 All edge functions deployed!"
echo ""
echo "Function URLs:"
for fn in "${functions[@]}"; do
  echo "  https://${PROJECT_REF}.supabase.co/functions/v1/${fn}"
done
