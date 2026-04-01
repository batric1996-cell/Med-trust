/*
  # Medical Professional Evaluation System Schema

  ## Overview
  Creates a formal peer evaluation system for medical professionals with controlled endorsement tracking.

  ## 1. New Tables
  
  ### `profiles`
  User profile for medical professionals
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text, not null) - Doctor's full name
  - `specialty` (text, not null) - Medical specialty
  - `trust_band` (text, not null, default 'Stable') - Professional standing level
  - `created_at` (timestamptz) - Profile creation timestamp
  
  Trust band levels:
  - Stable: 0-2 evaluations
  - Strong: 3-6 evaluations
  - Advanced: 7+ evaluations

  ### `peer_reviews`
  Professional evaluations between doctors
  - `id` (uuid, primary key) - Unique review identifier
  - `evaluator_id` (uuid, not null) - Doctor submitting evaluation
  - `evaluated_id` (uuid, not null) - Doctor being evaluated
  - `traits` (integer[], not null) - Selected professional traits (1-5)
  - `created_at` (timestamptz) - Evaluation timestamp
  
  Trait mapping:
  1 = Clinical Accuracy
  2 = Communication Clarity
  3 = Ethical Practice
  4 = Diagnostic Skill
  5 = Collaboration
  
  ## 2. Security
  
  - Enable RLS on both tables
  - Profiles: Users can read all profiles, update only their own
  - Peer reviews: Users can insert their own evaluations, read all evaluations
  - Unique constraint prevents duplicate evaluations (evaluator_id, evaluated_id)
  
  ## 3. Important Notes
  
  - Self-evaluation prevention enforced at application level
  - Trust band calculation based on evaluation count
  - Traits must be array of 1-3 integers between 1-5
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  specialty text NOT NULL,
  trust_band text NOT NULL DEFAULT 'Stable',
  created_at timestamptz DEFAULT now()
);

-- Create peer_reviews table
CREATE TABLE IF NOT EXISTS peer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluated_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  traits integer[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_evaluation UNIQUE (evaluator_id, evaluated_id),
  CONSTRAINT valid_traits_count CHECK (array_length(traits, 1) >= 1 AND array_length(traits, 1) <= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Peer reviews policies
CREATE POLICY "Users can view all evaluations"
  ON peer_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit evaluations"
  ON peer_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = evaluator_id);

-- Create function to update trust band
CREATE OR REPLACE FUNCTION update_trust_band(doctor_id uuid)
RETURNS void AS $$
DECLARE
  eval_count integer;
  new_band text;
BEGIN
  -- Count evaluations for the doctor
  SELECT COUNT(*) INTO eval_count
  FROM peer_reviews
  WHERE evaluated_id = doctor_id;
  
  -- Determine trust band
  IF eval_count >= 7 THEN
    new_band := 'Advanced';
  ELSIF eval_count >= 3 THEN
    new_band := 'Strong';
  ELSE
    new_band := 'Stable';
  END IF;
  
  -- Update the profile
  UPDATE profiles
  SET trust_band = new_band
  WHERE id = doctor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update trust band after new evaluation
CREATE OR REPLACE FUNCTION trigger_update_trust_band()
RETURNS trigger AS $$
BEGIN
  PERFORM update_trust_band(NEW.evaluated_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_peer_review_insert
AFTER INSERT ON peer_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_update_trust_band();