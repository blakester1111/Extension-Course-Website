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

async function updateLesson(id, instructions) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/lessons?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ instructions })
  })
  return res.ok
}

function formatInstructions(text) {
  if (!text) return null
  let updated = text

  // Fix stray HTML <i> tag (3rd ACC)
  updated = updated.replace(/<i>/g, '').replace(/<\/i>/g, '')

  // Pattern 1: "Listen to the lecture: TITLE and answer"
  // Capture the title between ":" and " and answer"
  updated = updated.replace(
    /Listen to the lecture:\s*(.+?)\s+and answer/g,
    (match, title) => {
      // Don't double-wrap if already italic
      if (title.startsWith('*')) return match
      return `Listen to the lecture: *${title.trim()}* and answer`
    }
  )

  // Pattern 2: "Listen to Lecture N, DATE, TITLE and answer"
  // e.g. "Listen to Lecture 1, 2 Jan. 57, Course Outline and answer"
  updated = updated.replace(
    /Listen to Lecture (\d+),\s*(\d{1,2}\s+\w+\.?\s+\d{2,4}),\s*(.+?)\s+and answer/g,
    (match, num, date, title) => {
      if (title.startsWith('*')) return match
      return `Listen to Lecture ${num}, ${date}, *${title.trim()}* and answer`
    }
  )

  // Pattern 3: "Listen to the lecture TITLE, DATE and answer" (no colon)
  updated = updated.replace(
    /Listen to the lecture ([A-Z][^,]+),\s*(\d{1,2}\s+\w+\.?\s+\d{2,4})\s+and answer/g,
    (match, title, date) => {
      if (title.startsWith('*')) return match
      return `Listen to the lecture *${title.trim()}*, ${date} and answer`
    }
  )

  // Pattern 4: "Read TITLE and answer the following" (for chapter/article names)
  // This needs to be careful - only match lines starting with "Read " followed by a title
  // Match: "Read The Goal of Dianetics and answer..."
  // Match: "Read Chapter Three Facsimiles and answer..."
  // Match: "Read Book One, Chapter Two Dianetic Evaluation and answer..."
  // Match: "Read Is It Possible to Be Happy? and answer..."
  // Don't match: "Read the following references:" or "Read the article:"
  updated = updated.replace(
    /^(Read )((?:Book \w+, )?(?:Chapter \w+ )?(?:the Preface through (?:Chapter \w+ )?)?[A-Z].+?)\s+(and answer the following)/gm,
    (match, prefix, title, suffix) => {
      if (title.startsWith('*')) return match
      // Don't match "the following" or "the article"
      if (title.match(/^the (following|article|transcript)/i)) return match
      return `${prefix}*${title.trim()}* ${suffix}`
    }
  )

  // Pattern 5: "Read the article: TITLE" (with period/date at end)
  updated = updated.replace(
    /Read the article:\s*(.+?)(\.|$)/gm,
    (match, title, end) => {
      if (title.startsWith('*')) return match
      return `Read the article: *${title.trim()}*${end}`
    }
  )

  // Pattern 6: "Read TITLE located at the back"
  updated = updated.replace(
    /Read ([A-Z].+?) located at the back/g,
    (match, title) => {
      if (title.startsWith('*')) return match
      return `Read *${title.trim()}* located at the back`
    }
  )

  // Pattern 7: Lettered reference lists "A.  Title" "B.  Title" etc
  // These are article/reference titles in lettered lists
  updated = updated.replace(
    /^([A-Z]\.)\s{1,4}([A-Z][^\n]+)$/gm,
    (match, letter, title) => {
      // Don't wrap if already formatted or if it's an instruction line
      if (title.startsWith('*') || title.startsWith('"')) return match
      // Don't wrap if it looks like an instruction ("Read", "Listen", "Answer", "Write", "Do", "Describe")
      if (title.match(/^(Read|Listen|Answer|Write|Do |Describe|Explain|Study|Complete|Review|Go to|Watch|Look up|Define|Demonstrate|Final)/)) return match
      return `${letter}  *${title.trim()}*`
    }
  )

  // Pattern 8: "read the transcript of lecture N, DATE, TITLE"
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
  // Fetch all lessons with instructions
  console.log('Fetching all lessons...')
  
  // Need to paginate — lessons table has 1605 rows
  let allLessons = []
  let offset = 0
  const limit = 1000
  while (true) {
    const batch = await fetchAll(`lessons?select=id,title,instructions,course_id&order=id&limit=${limit}&offset=${offset}`)
    allLessons = allLessons.concat(batch)
    if (batch.length < limit) break
    offset += limit
  }
  
  console.log(`Total lessons: ${allLessons.length}`)
  
  let updated = 0
  let skipped = 0
  
  for (const lesson of allLessons) {
    if (!lesson.instructions) { skipped++; continue }
    
    const newInstructions = formatInstructions(lesson.instructions)
    if (!newInstructions) { skipped++; continue }
    
    const ok = await updateLesson(lesson.id, newInstructions)
    if (ok) {
      updated++
    } else {
      console.log(`FAILED to update lesson ${lesson.id} (${lesson.title})`)
    }
  }
  
  console.log(`\nUpdated: ${updated} lessons`)
  console.log(`Skipped: ${skipped} lessons (no changes needed)`)
}

main().catch(console.error)
