export function getAnswerImageUrl(imagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-images/${imagePath}`
}
