/*
  # JEE Mains 2026 Preparation Platform Schema

  1. Tables Created
    - `schedules` - Daily study schedule management
      - `id` (uuid, primary key)
      - `date` (date) - Study date
      - `start_time` (time) - Session start time
      - `end_time` (time) - Session end time
      - `subject` (text) - Physics/Chemistry/Mathematics/Revision/Mock Test
      - `topic` (text) - Specific topic or chapter
      - `completed` (boolean) - Task completion status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `revision_items` - Smart revision content storage
      - `id` (uuid, primary key)
      - `title` (text) - Item title/description
      - `content_text` (text) - Text content/notes
      - `image_url` (text) - Uploaded image URL
      - `subject` (text) - Subject classification
      - `priority` (text) - High/Medium/Low priority
      - `created_at` (timestamp)
      - `last_reviewed` (timestamp)
      - `review_count` (integer) - Number of reviews
      - `next_review` (timestamp) - Next scheduled review

    - `notification_settings` - Spaced repetition notification management
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to revision_items)
      - `intervals` (text[]) - Array of reminder intervals
      - `next_reminder` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for full CRUD access (no auth required)
*/

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject text NOT NULL CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics', 'Revision', 'Mock Test')),
  topic text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create revision_items table
CREATE TABLE IF NOT EXISTS revision_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_text text,
  image_url text,
  subject text NOT NULL CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics', 'General')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  created_at timestamptz DEFAULT now(),
  last_reviewed timestamptz DEFAULT now(),
  review_count integer DEFAULT 0,
  next_review timestamptz DEFAULT now()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES revision_items(id) ON DELETE CASCADE,
  intervals text[] DEFAULT ARRAY['1 hour', '1 day', '3 days', '1 week', '2 weeks'],
  next_reminder timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (no auth required)
CREATE POLICY "Allow full access to schedules"
  ON schedules
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to revision_items"
  ON revision_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to notification_settings"
  ON notification_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_subject ON schedules(subject);
CREATE INDEX IF NOT EXISTS idx_revision_items_subject ON revision_items(subject);
CREATE INDEX IF NOT EXISTS idx_revision_items_next_review ON revision_items(next_review);
CREATE INDEX IF NOT EXISTS idx_notification_settings_next_reminder ON notification_settings(next_reminder);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for schedules table
CREATE TRIGGER update_schedules_updated_at 
  BEFORE UPDATE ON schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();