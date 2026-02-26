/**
 * Flag questions that require diagram/drawing/sketch images.
 * Run AFTER the migration adds the requires_image column.
 *
 * Usage: node scripts/flag-image-questions.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zzqlnevolmqfdsmzckkk.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cWxuZXZvbG1xZmRzbXpja2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYxNDIxNiwiZXhwIjoyMDg3MTkwMjE2fQ.4V5CGVs3cmf7ZIp95LBEQV45Fdm6ChJrKUHKLsu7u20'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Search patterns: [coursePattern, questionPattern]
const DIAGRAM_QUESTIONS = [
  // Dianetics / DMSMH (3 questions)
  ['Dianetics', 'Draw from your own lifetime your own survival graph'],
  ['Dianetics', 'drawing to show the standard banks'],
  ['Dianetics', 'Draw an engram chain showing'],
  // Science of Survival (1)
  ['Science of Survival', 'Draw concentric circles'],
  // Ethics (2)
  ['Ethics', 'Draw a sample graph for each of the conditions'],
  ['Ethics', 'Draw some sample graphs and state the trends'],
  // Scn 8-80 (3)
  ['8-80', 'Draw an orderly wave and indicate'],
  ['8-80', 'Draw an example of each of the four categories of wave flow'],
  ['8-80', 'Draw a diagram which shows how a bracket is run'],
  // AP&A B&L (2)
  ['AP&A', 'Diagram the postulated relationship between the organism'],
  ['AP&A', 'diagram how'],  // "physical mind...concerned with estimating efforts"
  // Milestone One (2)
  ['Milestone One', 'Sketch the difference between force and effort'],
  ['Milestone One', 'electrical resistance of the body rises and falls'],
  // PDC (1)
  ['PDC', 'Diagram an example showing each of these'],
  // Phoenix Lectures (1)
  ['Phoenix', 'Diagram time'],
  // Technique 88 (1)
  ['Technique 88', 'Diagram each of these'],
  // 1st ACC (3)
  ['1st', 'eight points'],   // "Diagram how...cube of space"
  ['1st', 'Aberration is nothing but'],  // "irregular course of departure"
  ['1st', 'resists he eventually gets a starvation'],
  // 2nd ACC (2)
  ['2ND', 'cause end of a communication line'],
  ['2ND', 'framework is composed of a number of hold sparks'],
  // 3rd ACC (1)
  ['3RD', 'thetan is in good shape and having a good game'],
  // 7th ACC (1)
  ['7TH', 'co-action of particles'],
  // 16th ACC (2)
  ['16TH', 'Diagram the first cause-and-effect line'],
  ['16TH', 'Diagram the second cause-and-effect line'],
  // 20th ACC (1)
  ['20TH', 'Diagram the equations of auditor and pc'],
  // C-D-E (1)
  ['C-D-E', 'Draw a sketch showing how Straightwire'],
  // South African Anatomy (6)
  ['SOUTH AFRICAN', 'mental image picture'],
  ['SOUTH AFRICAN', 'Draw a sketch showing what a field is'],
  ['SOUTH AFRICAN', 'engrams, secondaries and locks'],
  ['SOUTH AFRICAN', 'Sketch the cycle-of-action'],
  ['SOUTH AFRICAN', 'Diagram the cycle of control'],
  ['SOUTH AFRICAN', 'Draw a diagram showing what a time track is'],
  // Clean Hands Congress (1)
  ['Clean Hands', 'Sketch a Goals Problem Mass'],
  // Clearing Congress (1)
  ['Clearing Congress', 'Diagram the three equations'],
  // Freedom Congress (2)
  ['Freedom Congress', 'Diagram the combination of the three most intimate items'],
  ['Freedom Congress', 'Verbalization is not the intension'],
  // Washington Congress (1)
  ['WASHINGTON', 'Diagram the spectrum'],
  // Western Congress (3)
  ['Western Congress', 'big curve is actually composed of little curves'],
  ['Western Congress', 'Knowing is senior to looking'],
  ['Western Congress', 'Each part of this big curve'],
]

async function main() {
  console.log('Fetching all courses...')
  const { data: courses } = await sb.from('courses').select('id, title')
  if (!courses) { console.error('No courses found'); return }

  console.log(`Found ${courses.length} courses`)

  let totalFlagged = 0
  const notFound = []

  for (const [coursePattern, questionPattern] of DIAGRAM_QUESTIONS) {
    // Find matching course
    const matchingCourses = courses.filter(c =>
      c.title.toUpperCase().includes(coursePattern.toUpperCase())
    )

    if (matchingCourses.length === 0) {
      notFound.push({ coursePattern, questionPattern, reason: 'No matching course' })
      continue
    }

    let found = false
    for (const course of matchingCourses) {
      // Get lessons for this course
      const { data: lessons } = await sb
        .from('lessons')
        .select('id')
        .eq('course_id', course.id)

      if (!lessons || lessons.length === 0) continue
      const lessonIds = lessons.map(l => l.id)

      // Find the question
      const { data: questions } = await sb
        .from('questions')
        .select('id, question_text, requires_image')
        .in('lesson_id', lessonIds)
        .ilike('question_text', `%${questionPattern}%`)

      if (questions && questions.length > 0) {
        for (const q of questions) {
          if (!q.requires_image) {
            const { error } = await sb
              .from('questions')
              .update({ requires_image: true })
              .eq('id', q.id)

            if (error) {
              console.error(`  ERROR updating ${q.id}: ${error.message}`)
            } else {
              console.log(`  Flagged: [${course.title}] "${q.question_text.substring(0, 60)}..."`)
              totalFlagged++
            }
          } else {
            console.log(`  Already flagged: [${course.title}] "${q.question_text.substring(0, 60)}..."`)
          }
        }
        found = true
        break
      }
    }

    if (!found) {
      notFound.push({ coursePattern, questionPattern, reason: 'No matching question' })
    }
  }

  console.log(`\nTotal flagged: ${totalFlagged}`)

  if (notFound.length > 0) {
    console.log(`\nNot found (${notFound.length}):`)
    for (const nf of notFound) {
      console.log(`  [${nf.coursePattern}] "${nf.questionPattern}" - ${nf.reason}`)
    }
  }

  // Verify
  const { count } = await sb
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('requires_image', true)

  console.log(`\nTotal questions with requires_image=true: ${count}`)
}

main().catch(console.error)
