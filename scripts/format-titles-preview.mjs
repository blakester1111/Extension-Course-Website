const SUPABASE_URL = 'https://zzqlnevolmqfdsmzckkk.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cWxuZXZvbG1xZmRzbXpja2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYxNDIxNiwiZXhwIjoyMDg3MTkwMjE2fQ.4V5CGVs3cmf7ZIp95LBEQV45Fdm6ChJrKUHKLsu7u20'

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
}

async function fetchAll(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!res.ok) { console.error(await res.text()); return [] }
  return res.json()
}

function formatInstructions(text) {
  if (!text) return null
  let updated = text

  // Fix stray HTML <i> tag
  updated = updated.replace(/<i>/g, '').replace(/<\/i>/g, '')

  // Pattern 1: "Listen to the lecture: TITLE and answer"
  updated = updated.replace(
    /Listen to the lecture:\s*(.+?)\s+and answer/g,
    (match, title) => {
      if (title.startsWith('*')) return match
      return `Listen to the lecture: *${title.trim()}* and answer`
    }
  )

  // Pattern 2: "Listen to Lecture N, DATE, TITLE and answer"
  updated = updated.replace(
    /Listen to Lecture (\d+),\s*(\d{1,2}\s+\w+\.?\s+\d{2,4}),\s*(.+?)\s+and answer/g,
    (match, num, date, title) => {
      if (title.startsWith('*')) return match
      return `Listen to Lecture ${num}, ${date}, *${title.trim()}* and answer`
    }
  )

  // Pattern 3: "Read TITLE and answer the following" (chapter/article names starting with caps)
  updated = updated.replace(
    /^(Read )((?:Book \w+, )?(?:Chapter \w+ )?(?:the Preface through (?:Chapter \w+ )?)?[A-Z].+?)\s+(and answer the following)/gm,
    (match, prefix, title, suffix) => {
      if (title.startsWith('*')) return match
      if (title.match(/^the (following|article|transcript)/i)) return match
      return `${prefix}*${title.trim()}* ${suffix}`
    }
  )

  // Pattern 4: "Read the article: TITLE"
  updated = updated.replace(
    /Read the article:\s*(.+?)(\.|$)/gm,
    (match, title, end) => {
      if (title.startsWith('*')) return match
      return `Read the article: *${title.trim()}*${end}`
    }
  )

  // Pattern 5: "Read TITLE located at the back"
  updated = updated.replace(
    /Read ([A-Z].+?) located at the back/g,
    (match, title) => {
      if (title.startsWith('*')) return match
      return `Read *${title.trim()}* located at the back`
    }
  )

  // Pattern 6: Lettered reference lists "A.  Title"
  updated = updated.replace(
    /^([A-Z]\.)\s{1,4}([A-Z][^\n]+)$/gm,
    (match, letter, title) => {
      if (title.startsWith('*') || title.startsWith('"')) return match
      if (title.match(/^(Read|Listen|Answer|Write|Do |Describe|Explain|Study|Complete|Review|Go to|Watch|Look up|Define|Demonstrate|Final)/)) return match
      return `${letter}  *${title.trim()}*`
    }
  )

  // Pattern 7: "read the transcript of lecture N, DATE, TITLE"
  updated = updated.replace(
    /read the transcript of lecture (\d+),\s*(\d{1,2}\s+\w+\.?\s+\d{2,4}),\s*(.+?)(\.|$)/gi,
    (match, num, date, title, end) => {
      if (title.startsWith('*')) return match
      return `read the transcript of lecture ${num}, ${date}, *${title.trim()}*${end}`
    }
  )

  return updated === text ? null : updated
}

async function main() {
  let allLessons = []
  let offset = 0
  const limit = 1000
  while (true) {
    const batch = await fetchAll(`lessons?select=id,title,instructions,course_id&order=id&limit=${limit}&offset=${offset}`)
    allLessons = allLessons.concat(batch)
    if (batch.length < limit) break
    offset += limit
  }

  // Also get courses for context
  const courses = await fetchAll('courses?select=id,title')
  const courseMap = new Map(courses.map(c => [c.id, c.title]))
  
  let changeCount = 0
  const samples = []
  
  for (const lesson of allLessons) {
    if (!lesson.instructions) continue
    const newInstructions = formatInstructions(lesson.instructions)
    if (!newInstructions) continue
    
    changeCount++
    // Show first 15 examples
    if (samples.length < 15) {
      samples.push({
        course: courseMap.get(lesson.course_id),
        lesson: lesson.title,
        before: lesson.instructions.substring(0, 200),
        after: newInstructions.substring(0, 200)
      })
    }
  }
  
  console.log(`Total lessons that would be updated: ${changeCount}\n`)
  console.log('=== SAMPLE CHANGES ===\n')
  for (const s of samples) {
    console.log(`--- ${s.course} — ${s.lesson} ---`)
    console.log(`BEFORE: ${s.before}`)
    console.log(`AFTER:  ${s.after}`)
    console.log()
  }
}

main().catch(console.error)
