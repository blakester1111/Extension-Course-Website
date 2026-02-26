const SUPABASE_URL = 'https://zzqlnevolmqfdsmzckkk.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cWxuZXZvbG1xZmRzbXpja2trIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYxNDIxNiwiZXhwIjoyMDg3MTkwMjE2fQ.4V5CGVs3cmf7ZIp95LBEQV45Fdm6ChJrKUHKLsu7u20'

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
}

async function query(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!res.ok) {
    console.error(`Query failed: ${res.status} ${await res.text()}`)
    return []
  }
  return res.json()
}

async function deleteRow(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers
  })
  return res.ok
}

async function main() {
  // Get all FCE questions
  const allQuestions = await query('questions?question_text=ilike.%25Final%20Course%20Exercise%25&order=lesson_id,sort_order,created_at')
  
  console.log(`Total FCE questions found: ${allQuestions.length}`)
  
  // Group by lesson_id + question_text to find duplicates
  const groups = new Map()
  for (const q of allQuestions) {
    const key = `${q.lesson_id}|||${q.question_text}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(q)
  }
  
  const toDelete = []
  for (const [key, questions] of groups) {
    if (questions.length > 1) {
      // Keep the first one (by created_at), delete the rest
      questions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      for (let i = 1; i < questions.length; i++) {
        toDelete.push(questions[i])
      }
    }
  }
  
  console.log(`Duplicate FCE questions to delete: ${toDelete.length}`)
  
  let deleted = 0
  let skipped = 0
  
  for (const q of toDelete) {
    // Check if this duplicate question has any student answers
    const answers = await query(`answers?question_id=eq.${q.id}&select=id`)
    if (answers.length > 0) {
      console.log(`  SKIP ${q.id} (has ${answers.length} answers)`)
      skipped++
      continue
    }
    
    const ok = await deleteRow('questions', q.id)
    if (ok) {
      deleted++
    } else {
      console.log(`  FAILED to delete ${q.id}`)
    }
  }
  
  console.log(`\nDeleted: ${deleted}, Skipped: ${skipped}`)
  
  // Verify
  const remaining = await query('questions?question_text=ilike.%25Final%20Course%20Exercise%25&order=lesson_id')
  const remainingGroups = new Map()
  for (const q of remaining) {
    if (!remainingGroups.has(q.lesson_id)) remainingGroups.set(q.lesson_id, 0)
    remainingGroups.set(q.lesson_id, remainingGroups.get(q.lesson_id) + 1)
  }
  const stillDuped = [...remainingGroups.values()].filter(c => c > 1).length
  console.log(`Remaining FCE questions: ${remaining.length}`)
  console.log(`Lessons still with duplicates: ${stillDuped}`)
}

main().catch(console.error)
