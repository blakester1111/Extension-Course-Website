-- ============================================================
-- UPDATE COURSE PRICES
-- Based on FCDC Extension Course pricing sheets
-- All values in cents (price_cents)
-- ============================================================

-- ===================
-- BASICS BOOKS — $30.00 each
-- ===================
UPDATE courses SET price_cents = 3000 WHERE title = 'Dianetics: The Modern Science of Mental Health';
UPDATE courses SET price_cents = 3000 WHERE title = 'Science of Survival';
UPDATE courses SET price_cents = 3000 WHERE title = 'Self Analysis';
UPDATE courses SET price_cents = 3000 WHERE title = 'Advanced Procedure and Axioms';
UPDATE courses SET price_cents = 3000 WHERE title = 'Handbook for Preclears';
UPDATE courses SET price_cents = 3000 WHERE title = 'Scientology: A History of Man';
UPDATE courses SET price_cents = 3000 WHERE title = 'Scientology 8-80';
UPDATE courses SET price_cents = 3000 WHERE title = 'Scientology 8-8008';
UPDATE courses SET price_cents = 3000 WHERE title = 'The Creation of Human Ability';
UPDATE courses SET price_cents = 3000 WHERE title = 'Dianetics 55!';
UPDATE courses SET price_cents = 3000 WHERE title = 'Scientology: The Fundamentals of Thought';

-- Additional Basics Books — $30.00 each
UPDATE courses SET price_cents = 3000 WHERE title = 'Dianetics: The Original Thesis';
UPDATE courses SET price_cents = 3000 WHERE title = 'Dianetics: The Evolution of a Science';
UPDATE courses SET price_cents = 3000 WHERE title = 'The Problems of Work';
UPDATE courses SET price_cents = 3000 WHERE title = 'Scientology: A New Slant on Life';
UPDATE courses SET price_cents = 3000 WHERE title = 'Introduction to Scientology Ethics';
UPDATE courses SET price_cents = 3000 WHERE title = 'The Way to Happiness';

-- ===================
-- BASICS LECTURES
-- ===================
UPDATE courses SET price_cents = 5000 WHERE title = 'Dianetics: Lectures & Demonstrations';          -- $50.00
UPDATE courses SET price_cents = 5000 WHERE title = 'Science of Survival Lectures';                   -- $50.00
UPDATE courses SET price_cents = 10000 WHERE title = 'Advanced Procedure & Axioms and Thought Emotion and Effort'; -- $100.00
UPDATE courses SET price_cents = 7500 WHERE title = 'The Life Continuum';                             -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Scientology: Milestone One';                     -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'The Route to Infinity';                          -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Technique 88: Incidents on the Track Before Earth'; -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Source of Life Energy';                          -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Command of Theta';                               -- $75.00
UPDATE courses SET price_cents = 32500 WHERE title = 'The Philadelphia Doctorate Course';             -- $325.00
UPDATE courses SET price_cents = 7500 WHERE title = 'The Phoenix Lectures';                           -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Hubbard Professional Course Lectures';           -- $75.00

-- ===================
-- CONGRESS LECTURES — $75.00 each
-- ===================
UPDATE courses SET price_cents = 7500 WHERE title = 'First International Congress of Dianeticists & Scientologists';
UPDATE courses SET price_cents = 7500 WHERE title = 'Western Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Universe Processes Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'The Unification Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Anatomy of the Spirit of Man Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Games Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'London Congress on Human Problems';
UPDATE courses SET price_cents = 7500 WHERE title = 'Washington Congress on Anti-Radiation & Confront';
UPDATE courses SET price_cents = 7500 WHERE title = 'London Congress on Nuclear Radiation, Control & Health';
UPDATE courses SET price_cents = 7500 WHERE title = 'Freedom Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Clearing Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'London Clearing Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Success Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Theta Clear Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Melbourne Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'State of Man Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'London Congress on Dissemination & Help';
UPDATE courses SET price_cents = 7500 WHERE title = 'Anatomy of the Human Mind Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Clean Hands Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'South African Anatomy Congress';
-- Courses without lesson plans yet:
UPDATE courses SET price_cents = 7500 WHERE title = 'Ability Congress';
UPDATE courses SET price_cents = 7500 WHERE title = 'Clearing Success Congress';

-- ===================
-- ACC LECTURES
-- ===================
UPDATE courses SET price_cents = 30000 WHERE title = '1st American ACC: Exteriorization & the Phenomena of Space';    -- $300.00
UPDATE courses SET price_cents = 30000 WHERE title = '2nd American ACC: The Rehabilitation of the Human Spirit';      -- $300.00
UPDATE courses SET price_cents = 22500 WHERE title = '3rd American ACC: The Endowment of Livingness';                 -- $225.00
UPDATE courses SET price_cents = 15000 WHERE title = '4th American ACC: Self-determined Beingness';                    -- $150.00
UPDATE courses SET price_cents = 22500 WHERE title = '5th American ACC: Unlocking Universes';                          -- $225.00
UPDATE courses SET price_cents = 15000 WHERE title = '6th American ACC: The Role of Duplication';                      -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '7th American ACC: Certainty of Communication';                   -- $150.00
UPDATE courses SET price_cents = 7500 WHERE title = '8th American ACC: The Power of Consideration';                    -- $75.00
UPDATE courses SET price_cents = 15000 WHERE title = 'Six Basic Processes Cause-Distance-Effect: A Basic Course in Scientology'; -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '9th American ACC: Communication—The Solution to Entrapment';     -- $150.00
UPDATE courses SET price_cents = 7500 WHERE title = '4th London ACC: Native State & Postulates';                       -- $75.00
UPDATE courses SET price_cents = 15000 WHERE title = '5th London ACC: Unlocking Past Life Memory';                     -- $150.00
UPDATE courses SET price_cents = 7500 WHERE title = '6th London ACC: The HAS Co-Audit & Broad Scale Clearing';        -- $75.00
UPDATE courses SET price_cents = 15000 WHERE title = '15th American ACC: The Power of Simplicity';                     -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '16th American ACC: Control, Communication & Havingness';         -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '17th American ACC: Control on All Dynamics';                     -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '18th American ACC: Confront & Tone 40';                          -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '19th American ACC: The Four Universes';                          -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '20th American ACC: The First Postulate';                         -- $150.00
UPDATE courses SET price_cents = 15000 WHERE title = '21st American ACC: From Homo Sapiens to Clear';                  -- $150.00
UPDATE courses SET price_cents = 7500 WHERE title = '22nd American ACC: The Elements of Stable Case Gain';             -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = '1st Melbourne ACC: Responsibility and the State of OT';           -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = '3rd South African ACC: The Road to Havingness';                   -- $75.00
-- Courses without lesson plans yet:
UPDATE courses SET price_cents = 7500 WHERE title = 'Postulates & Live Communication: Why You Can Audit';              -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Axiom of the Stable Datum: Know and not-Know';                    -- $75.00
UPDATE courses SET price_cents = 22500 WHERE title = 'Rehabilitating Power of Choice: Six Levels of Processing';       -- $225.00
UPDATE courses SET price_cents = 7500 WHERE title = 'The Remedy of Havingness Why Games';                              -- $75.00
UPDATE courses SET price_cents = 7500 WHERE title = 'Application of Games Theory to Processing';                       -- $75.00
UPDATE courses SET price_cents = 15000 WHERE title = 'Hubbard® Clearing Scientologist Course';                         -- $150.00
UPDATE courses SET price_cents = 7500 WHERE title = '1st Saint Hill ACC: Why Auditing Works';                          -- $75.00

-- Basics course without lesson plans yet:
UPDATE courses SET price_cents = 7500 WHERE title = 'The Factors: Admiration & the Renaissance of Beingness';          -- $75.00
