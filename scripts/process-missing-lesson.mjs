/**
 * Process a single Missing Lessons folder:
 * 1. Read extracted_lessons.json
 * 2. Clean track references from instructions
 * 3. Look up the course in the database
 * 4. Match lessons by sort_order
 * 5. Update lesson instructions and insert questions
 *
 * Usage: node scripts/process-missing-lesson.mjs "Folder Name"
 * Example: node scripts/process-missing-lesson.mjs "15th American ACC"
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// Load env vars from .env.local
config({ path: resolve(projectRoot, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Folder name to exact DB course title mapping
const FOLDER_TO_COURSE = {
  '15th American ACC': '15th American ACC: The Power of Simplicity',
  '1st Saint Hill ACC': '1st Saint Hill ACC: Why Auditing Works',
  'Ability Congress': 'Ability Congress',
  'Application of Games Theory': 'Application of Games Theory to Processing',
  'Axiom and the Stable Datum': 'Axiom of the Stable Datum: Know and not-Know',
  'Clearing Success Congress': 'Clearing Success Congress',
  'Hubbard Clearing Scientologist': 'Hubbard® Clearing Scientologist Course',
  'Postulates and Live Comm': 'Postulates & Live Communication: Why You Can Audit',
  'Rehabilitation of Power of Choice': 'Rehabilitating Power of Choice: Six Levels of Processing',
  'Remedy of Havingness': 'The Remedy of Havingness Why Games',
  'The Factors': 'The Factors: Admiration & the Renaissance of Beingness',
}

/**
 * Remove track/disc references from instruction strings.
 * Handles patterns like:
 *   ", Track 10"
 *   ", Tracks 12 and 13"
 *   ", Track 8, Tracks 12 and 13"
 *   ", Disc 8, Track 12"
 *   ", Track 4 and Track 9"
 *   ", Track 7 and Track 11"
 */
function cleanTrackReferences(instruction) {
  // Remove patterns like ", Disc X" and ", Track X" and ", Tracks X and Y"
  // Also handles "Track X and Track Y" combinations
  let cleaned = instruction

  // Remove ", Disc N, Track N" or ", Disc N"
  cleaned = cleaned.replace(/,?\s*Disc\s+\d+/gi, '')

  // Remove ", Tracks N and N"
  cleaned = cleaned.replace(/,?\s*Tracks?\s+\d+\s+and\s+Tracks?\s+\d+/gi, '')

  // Remove ", Tracks N and N"
  cleaned = cleaned.replace(/,?\s*Tracks\s+\d+\s+and\s+\d+/gi, '')

  // Remove ", Track N and Track N"
  cleaned = cleaned.replace(/,?\s*Track\s+\d+\s+and\s+Track\s+\d+/gi, '')

  // Remove remaining standalone ", Track N"
  cleaned = cleaned.replace(/,?\s*Track\s+\d+/gi, '')

  // Clean up any trailing commas or extra spaces
  cleaned = cleaned.replace(/,\s*$/, '')
  cleaned = cleaned.replace(/\s{2,}/g, ' ')
  cleaned = cleaned.trim()

  return cleaned
}

async function processFolder(folderName) {
  const courseTitle = FOLDER_TO_COURSE[folderName]
  if (!courseTitle) {
    console.error(`Unknown folder: "${folderName}"`)
    console.error('Known folders:', Object.keys(FOLDER_TO_COURSE).join(', '))
    process.exit(1)
  }

  const jsonPath = resolve(projectRoot, 'softcopy lessons', 'Missing Lessons', folderName, 'extracted_lessons.json')

  console.log(`\n=== Processing: ${folderName} ===`)
  console.log(`DB Course: ${courseTitle}`)
  console.log(`JSON Path: ${jsonPath}\n`)

  // Step 1: Read and clean the JSON
  let data
  try {
    data = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  } catch (e) {
    console.error(`Could not read ${jsonPath}: ${e.message}`)
    process.exit(1)
  }

  let trackRefsFound = 0
  for (const lesson of data.lessons) {
    const original = lesson.instructions
    lesson.instructions = cleanTrackReferences(lesson.instructions)
    if (original !== lesson.instructions) {
      trackRefsFound++
      console.log(`  Cleaned lesson ${lesson.lesson_number}: "${original}" -> "${lesson.instructions}"`)
    }
  }
  console.log(`\nTrack references cleaned: ${trackRefsFound}`)

  // Save cleaned JSON back
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n')
  console.log('Saved cleaned JSON.\n')

  // Step 2: Look up the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('title', courseTitle)
    .single()

  if (courseError || !course) {
    console.error(`Course not found: "${courseTitle}"`, courseError)
    process.exit(1)
  }
  console.log(`Found course: "${course.title}" (${course.id})`)

  // Step 3: Get existing lessons
  const { data: dbLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, sort_order, instructions')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true })

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError)
    process.exit(1)
  }
  console.log(`Found ${dbLessons.length} lessons in DB\n`)

  // Step 4: Check for existing questions (to avoid duplicates)
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('lesson_id, id')
    .in('lesson_id', dbLessons.map(l => l.id))

  const lessonsWithQuestions = new Set((existingQuestions || []).map(q => q.lesson_id))

  // Step 5: Match and insert
  let totalQuestionsInserted = 0
  let lessonsUpdated = 0
  let lessonsSkipped = 0

  for (const extracted of data.lessons) {
    // Find matching DB lesson by sort_order
    const dbLesson = dbLessons.find(l => l.sort_order === extracted.lesson_number)

    if (!dbLesson) {
      console.warn(`  WARNING: No DB lesson found for lesson_number ${extracted.lesson_number} (sort_order match). Skipping.`)
      lessonsSkipped++
      continue
    }

    // Check if this lesson already has questions
    if (lessonsWithQuestions.has(dbLesson.id)) {
      console.log(`  Lesson ${extracted.lesson_number} ("${dbLesson.title}") already has questions. Skipping.`)
      lessonsSkipped++
      continue
    }

    // Update instructions
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ instructions: extracted.instructions })
      .eq('id', dbLesson.id)

    if (updateError) {
      console.error(`  ERROR updating lesson ${extracted.lesson_number}:`, updateError)
      continue
    }

    // Insert questions
    const questionsToInsert = extracted.questions.map((q, index) => ({
      lesson_id: dbLesson.id,
      question_text: q,
      sort_order: index + 1
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (insertError) {
      console.error(`  ERROR inserting questions for lesson ${extracted.lesson_number}:`, insertError)
      continue
    }

    totalQuestionsInserted += questionsToInsert.length
    lessonsUpdated++
    console.log(`  Lesson ${extracted.lesson_number} ("${dbLesson.title}"): instructions updated, ${questionsToInsert.length} questions inserted`)
  }

  // Step 6: Verify
  console.log(`\n=== Results for ${folderName} ===`)
  console.log(`Course: ${courseTitle}`)
  console.log(`Lessons updated: ${lessonsUpdated}`)
  console.log(`Lessons skipped: ${lessonsSkipped}`)
  console.log(`Total questions inserted: ${totalQuestionsInserted}`)

  // Verify total questions in DB for this course
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .in('lesson_id', dbLessons.map(l => l.id))

  console.log(`Total questions now in DB for this course: ${count}`)
  console.log('=== Done ===\n')
}

// Main
const folderName = process.argv[2]
if (!folderName) {
  console.error('Usage: node scripts/process-missing-lesson.mjs "Folder Name"')
  console.error('Available folders:', Object.keys(FOLDER_TO_COURSE).join(', '))
  process.exit(1)
}

processFolder(folderName)
