-- Seed test data for events, tags, and tickets
-- Run this against your Named database in PostgreSQL

-- Clean up existing test data (optional)
-- DELETE FROM "EventTag";
-- DELETE FROM "Tickets";
-- DELETE FROM "Events";
-- DELETE FROM "Tags";

-- Insert Tags
INSERT INTO "Tags" ("Id", "Name") VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Concert'),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Festival'),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Conference'),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Sports'),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Online'),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'Outdoor'),
  ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'Indoor'),
  ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'Family')
ON CONFLICT DO NOTHING;

-- Insert Events
INSERT INTO "Events" ("Id", "Title", "Description", "Location", "Date", "CreatedByUserId") VALUES
  -- 1. Rock Concert
  ('650e8400-e29b-41d4-a716-446655440101'::uuid, 
   'Summer Rock Festival', 
   'Experience the hottest rock bands of the summer. Featuring international and local artists.',
   'Vilnius', 
   '2026-07-15 19:00:00+00', 
   NULL),
  
  -- 2. Tech Conference
  ('650e8400-e29b-41d4-a716-446655440102'::uuid,
   'TechConf 2026',
   'Latest trends in AI, cloud computing, and web development. Keynotes from industry leaders.',
   'Kaunas',
   '2026-06-20 09:00:00+00',
   NULL),
  
  -- 3. Basketball Championship
  ('650e8400-e29b-41d4-a716-446655440103'::uuid,
   'National Basketball Championship',
   'Semi-final matches of the national basketball league. Live excitement on the court.',
   'Vilnius',
   '2026-05-25 18:30:00+00',
   NULL),
  
  -- 4. Art Exhibition
  ('650e8400-e29b-41d4-a716-446655440104'::uuid,
   'Contemporary Art Expo',
   'Explore modern art from emerging artists. Interactive installations and live painting demonstrations.',
   'Kaunas',
   '2026-06-01 10:00:00+00',
   NULL),
  
  -- 5. Jazz Night
  ('650e8400-e29b-41d4-a716-446655440105'::uuid,
   'Jazz Under the Stars',
   'Intimate jazz performances in an outdoor garden setting. Perfect for a romantic evening.',
   'Vilnius',
   '2026-08-10 20:00:00+00',
   NULL),
  
  -- 6. Business Summit
  ('650e8400-e29b-41d4-a716-446655440106'::uuid,
   'Baltic Business Summit',
   'Networking event for entrepreneurs and business leaders. Workshops and panel discussions.',
   'Riga',
   '2026-07-01 08:30:00+00',
   NULL),
  
  -- 7. Film Festival
  ('650e8400-e29b-41d4-a716-446655440107'::uuid,
   'European Film Festival',
   'World premiere screenings of independent films from across Europe.',
   'Tallinn',
   '2026-09-05 17:00:00+00',
   NULL),
  
  -- 8. Family Fun Day
  ('650e8400-e29b-41d4-a716-446655440108'::uuid,
   'Community Family Fun Day',
   'Games, activities, and entertainment for the whole family. Free for kids under 12.',
   'Vilnius',
   '2026-06-15 10:00:00+00',
   NULL),
  
  -- 9. Marathon
  ('650e8400-e29b-41d4-a716-446655440109'::uuid,
   'Vilnius Spring Marathon',
   '42km run through the beautiful streets of Vilnius. All skill levels welcome.',
   'Vilnius',
   '2026-05-30 07:00:00+00',
   NULL),
  
  -- 10. Comedy Show
  ('650e8400-e29b-41d4-a716-446655440110'::uuid,
   'Stand-Up Comedy Night',
   'Evening of laughter with international and local comedians.',
   'Kaunas',
   '2026-07-20 19:30:00+00',
   NULL)
ON CONFLICT DO NOTHING;

-- Insert Tickets for each event
INSERT INTO "Tickets" ("Id", "Type", "Quantity", "Sold", "Price", "EventId") VALUES
  -- Event 1: Summer Rock Festival
  ('750e8400-e29b-41d4-a716-446655440101'::uuid, 'General Admission', 1000, 450, 35.00, '650e8400-e29b-41d4-a716-446655440101'::uuid),
  ('750e8400-e29b-41d4-a716-446655440102'::uuid, 'VIP', 200, 180, 75.00, '650e8400-e29b-41d4-a716-446655440101'::uuid),
  
  -- Event 2: TechConf 2026
  ('750e8400-e29b-41d4-a716-446655440103'::uuid, 'Early Bird', 500, 420, 99.00, '650e8400-e29b-41d4-a716-446655440102'::uuid),
  ('750e8400-e29b-41d4-a716-446655440104'::uuid, 'Standard', 800, 650, 149.00, '650e8400-e29b-41d4-a716-446655440102'::uuid),
  
  -- Event 3: Basketball Championship
  ('750e8400-e29b-41d4-a716-446655440105'::uuid, 'Regular Seating', 2000, 1200, 25.00, '650e8400-e29b-41d4-a716-446655440103'::uuid),
  ('750e8400-e29b-41d4-a716-446655440106'::uuid, 'Premium Seating', 500, 450, 55.00, '650e8400-e29b-41d4-a716-446655440103'::uuid),
  
  -- Event 4: Art Exhibition
  ('750e8400-e29b-41d4-a716-446655440107'::uuid, 'Day Pass', 300, 220, 15.00, '650e8400-e29b-41d4-a716-446655440104'::uuid),
  ('750e8400-e29b-41d4-a716-446655440108'::uuid, 'VIP Tour', 50, 45, 45.00, '650e8400-e29b-41d4-a716-446655440104'::uuid),
  
  -- Event 5: Jazz Under the Stars
  ('750e8400-e29b-41d4-a716-446655440109'::uuid, 'Seating', 400, 320, 40.00, '650e8400-e29b-41d4-a716-446655440105'::uuid),
  ('750e8400-e29b-41d4-a716-446655440110'::uuid, 'Table for 4', 50, 35, 160.00, '650e8400-e29b-41d4-a716-446655440105'::uuid),
  
  -- Event 6: Baltic Business Summit
  ('750e8400-e29b-41d4-a716-446655440111'::uuid, 'Attendee', 600, 500, 199.00, '650e8400-e29b-41d4-a716-446655440106'::uuid),
  ('750e8400-e29b-41d4-a716-446655440112'::uuid, 'Sponsor', 100, 85, 499.00, '650e8400-e29b-41d4-a716-446655440106'::uuid),
  
  -- Event 7: European Film Festival
  ('750e8400-e29b-41d4-a716-446655440113'::uuid, 'Single Screening', 800, 600, 12.00, '650e8400-e29b-41d4-a716-446655440107'::uuid),
  ('750e8400-e29b-41d4-a716-446655440114'::uuid, 'Festival Pass', 200, 150, 65.00, '650e8400-e29b-41d4-a716-446655440107'::uuid),
  
  -- Event 8: Family Fun Day
  ('750e8400-e29b-41d4-a716-446655440115'::uuid, 'Adult Ticket', 500, 380, 20.00, '650e8400-e29b-41d4-a716-446655440108'::uuid),
  ('750e8400-e29b-41d4-a716-446655440116'::uuid, 'Child Ticket', 300, 250, 10.00, '650e8400-e29b-41d4-a716-446655440108'::uuid),
  
  -- Event 9: Marathon
  ('750e8400-e29b-41d4-a716-446655440117'::uuid, 'Marathon Entry', 2000, 1850, 30.00, '650e8400-e29b-41d4-a716-446655440109'::uuid),
  ('750e8400-e29b-41d4-a716-446655440118'::uuid, 'Half Marathon', 1000, 920, 20.00, '650e8400-e29b-41d4-a716-446655440109'::uuid),
  
  -- Event 10: Comedy Show
  ('750e8400-e29b-41d4-a716-446655440119'::uuid, 'Standard', 300, 270, 28.00, '650e8400-e29b-41d4-a716-446655440110'::uuid),
  ('750e8400-e29b-41d4-a716-446655440120'::uuid, 'Premium Seating', 100, 90, 48.00, '650e8400-e29b-41d4-a716-446655440110'::uuid)
ON CONFLICT DO NOTHING;

-- Associate Events with Tags
INSERT INTO "EventTag" ("EventsId", "TagsId") VALUES
  -- Event 1: Summer Rock Festival - Concert, Outdoor, Festival
  ('650e8400-e29b-41d4-a716-446655440101'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('650e8400-e29b-41d4-a716-446655440101'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
  ('650e8400-e29b-41d4-a716-446655440101'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid),
  
  -- Event 2: TechConf 2026 - Conference, Indoor
  ('650e8400-e29b-41d4-a716-446655440102'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid),
  ('650e8400-e29b-41d4-a716-446655440102'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid),
  
  -- Event 3: Basketball Championship - Sports, Indoor
  ('650e8400-e29b-41d4-a716-446655440103'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid),
  ('650e8400-e29b-41d4-a716-446655440103'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid),
  
  -- Event 4: Art Exhibition - Festival, Indoor, Indoor
  ('650e8400-e29b-41d4-a716-446655440104'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
  ('650e8400-e29b-41d4-a716-446655440104'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid),
  
  -- Event 5: Jazz Under the Stars - Concert, Outdoor
  ('650e8400-e29b-41d4-a716-446655440105'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('650e8400-e29b-41d4-a716-446655440105'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid),
  
  -- Event 6: Baltic Business Summit - Conference, Indoor
  ('650e8400-e29b-41d4-a716-446655440106'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid),
  ('650e8400-e29b-41d4-a716-446655440106'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid),
  
  -- Event 7: Film Festival - Festival, Indoor
  ('650e8400-e29b-41d4-a716-446655440107'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
  ('650e8400-e29b-41d4-a716-446655440107'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid),
  
  -- Event 8: Family Fun Day - Family, Outdoor
  ('650e8400-e29b-41d4-a716-446655440108'::uuid, '550e8400-e29b-41d4-a716-446655440008'::uuid),
  ('650e8400-e29b-41d4-a716-446655440108'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid),
  
  -- Event 9: Marathon - Sports, Outdoor
  ('650e8400-e29b-41d4-a716-446655440109'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid),
  ('650e8400-e29b-41d4-a716-446655440109'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid),
  
  -- Event 10: Comedy Show - Concert, Indoor
  ('650e8400-e29b-41d4-a716-446655440110'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('650e8400-e29b-41d4-a716-446655440110'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid)
ON CONFLICT DO NOTHING;
