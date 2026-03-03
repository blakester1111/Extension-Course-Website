export interface TourStep {
  target?: string        // data-tour attribute value (omit for concept/info steps)
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  icon?: string          // Icon key for concept steps: 'book', 'clipboard', 'award', 'user', 'settings'
}

// ---------------------------------------------------------------------------
//  STUDENT TOUR — 8 steps
// ---------------------------------------------------------------------------

export const studentTourSteps: TourStep[] = [
  {
    target: 'student-dashboard',
    title: 'Your Dashboard',
    description: 'This is your home base. See your enrolled courses, personal stats, and study route progress. Use the "Continue Learning" button to jump right back into your current lesson.',
    placement: 'bottom',
  },
  {
    icon: 'book',
    title: 'Taking a Course',
    description: 'Click any course to see its lessons. Open a lesson, read the instructions, and answer each question. You can save your work as a draft and come back later, or submit when you\'re ready.',
  },
  {
    icon: 'clipboard',
    title: 'Grading & Corrections',
    description: 'After you submit a lesson, your supervisor reviews your answers and gives you a grade. If corrections are needed, you\'ll see their feedback and can revise and resubmit.',
  },
  {
    target: 'student-certificates',
    title: 'Certificates',
    description: 'When you complete all lessons in a course, a certificate is automatically created. Once processed, you can view and print it here.',
    placement: 'right',
  },
  {
    target: 'student-honor-roll',
    title: 'Honor Roll',
    description: 'See how you rank against other students! Pass at least one lesson per week to maintain your streak and climb the leaderboard.',
    placement: 'right',
  },
  {
    target: 'student-resources',
    title: 'Resources',
    description: 'Access study guides and reference materials like The Complete Routes to Knowledge and the Materials Guide Chart.',
    placement: 'right',
  },
  {
    target: 'student-notifications',
    title: 'Notifications',
    description: 'You\'ll be notified here when lessons are graded, corrections are needed, or certificates are issued.',
    placement: 'right',
  },
  {
    target: 'student-profile',
    title: 'Your Profile',
    description: 'Update your name, study route, password, and certificate delivery preference here.',
    placement: 'right',
  },
]

// ---------------------------------------------------------------------------
//  SUPERVISOR TOUR — 8 steps (self-contained, covers student features too)
// ---------------------------------------------------------------------------

export const supervisorTourSteps: TourStep[] = [
  {
    target: 'supervisor-dashboard',
    title: 'Supervisor Dashboard',
    description: 'Your overview at a glance — pending submissions waiting for grading, overdue items (waiting more than 24 hours), and your student count.',
    placement: 'right',
  },
  {
    target: 'supervisor-queue',
    title: 'Grading Queue',
    description: 'Student submissions appear here, oldest first. A red indicator means a submission has been waiting more than 24 hours — try to review those promptly.',
    placement: 'right',
  },
  {
    icon: 'clipboard',
    title: 'How to Grade',
    description: 'Open a submission to read the student\'s answers. Mark it as Pass or Corrections Needed, enter a grade percentage, and write feedback that the student will see. If you mark corrections, the student can revise and resubmit.',
  },
  {
    target: 'supervisor-invoices',
    title: 'Pending Invoices',
    description: 'When staff members enroll with an invoice number, their enrollment needs your verification. Approve it here so they can access the course.',
    placement: 'right',
  },
  {
    target: 'supervisor-students',
    title: 'Your Students',
    description: 'View assigned students, their progress, and contact info. Click a student\'s name to see their profile. Use the Notes and Materials buttons to track your observations and what course materials they own.',
    placement: 'right',
  },
  {
    target: 'supervisor-reports',
    title: 'Reports',
    description: 'Access activity reports, progress boards, completion stats, grading analytics, and weekly CSV exports. Filter by date range, organization, and audience.',
    placement: 'right',
  },
  {
    target: 'my-learning',
    title: 'My Learning',
    description: 'You can take courses yourself! Below this divider you\'ll find your own student dashboard, certificates, honor roll, resources, notifications, and profile.',
    placement: 'right',
  },
  {
    icon: 'book',
    title: 'Your Courses',
    description: 'As a student, click a course to see its lessons. Answer questions, save drafts, and submit when ready. Your work will be graded the same way. Pass at least one lesson per week to maintain your Honor Roll streak!',
  },
]

// ---------------------------------------------------------------------------
//  ADMIN TOUR — 16 steps (self-contained, covers the entire platform)
// ---------------------------------------------------------------------------

export const adminTourSteps: TourStep[] = [
  {
    target: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'Your platform overview — active enrollments, pending grades, weekly and monthly activity trends, and organization breakdowns.',
    placement: 'right',
  },
  {
    target: 'admin-courses',
    title: 'Course Management',
    description: 'Add, edit, and publish courses. Each course contains lessons, and each lesson has questions with correct answers that serve as a grading reference for supervisors.',
    placement: 'right',
  },
  {
    target: 'admin-supervisors',
    title: 'Supervisors',
    description: 'View and manage supervisor accounts. Supervisors grade student submissions and track their assigned students\' progress.',
    placement: 'right',
  },
  {
    target: 'admin-users',
    title: 'User Management',
    description: 'Manage all users — assign roles, supervisors, organizations, and study routes. Enroll students in courses and set certificate permissions.',
    placement: 'right',
  },
  {
    icon: 'user',
    title: 'User Profiles & Back-Enter',
    description: 'Click any user\'s name to open their profile where you can edit contact info, change their role, assign an organization (Day/Foundation), set their supervisor, and manage permissions. Use the back-enter feature on their card to mark courses completed for historical records.',
  },
  {
    target: 'admin-queue',
    title: 'Grading Queue',
    description: 'All student submissions across every supervisor. You can review and grade submissions directly from here too.',
    placement: 'right',
  },
  {
    target: 'admin-invoices',
    title: 'Pending Invoices',
    description: 'Approve staff invoice enrollments. Students can\'t access their course until their enrollment is verified here.',
    placement: 'right',
  },
  {
    target: 'admin-all-students',
    title: 'All Students Progress',
    description: 'A comprehensive view of every student\'s course progress, notes, and materials across the entire platform — not limited to a single supervisor.',
    placement: 'right',
  },
  {
    target: 'admin-reports',
    title: 'Reports',
    description: 'Activity, progress, completions, grading analytics, student activity, and weekly exports. Filter by date range, organization, and audience.',
    placement: 'right',
  },
  {
    target: 'admin-revenue',
    title: 'Revenue',
    description: 'Track sales and revenue by time period and organization. View individual order details and payment status.',
    placement: 'right',
  },
  {
    target: 'admin-certificates',
    title: 'Certificates',
    description: 'Manage the certificate pipeline. Certificates go through three stages: Pending Attestation (assign a certificate number), Pending Seal (apply the official seal), then Issued.',
    placement: 'right',
  },
  {
    target: 'admin-routes',
    title: 'Study Routes',
    description: 'Define recommended course sequences that guide students through the curriculum in a specific order. Students can be assigned a route during onboarding or from their profile.',
    placement: 'right',
  },
  {
    target: 'admin-deadfile',
    title: 'Deadfile',
    description: 'Archive inactive student accounts. Deadfiled students are hidden from active lists but their data is preserved and can be restored.',
    placement: 'right',
  },
  {
    target: 'admin-email-settings',
    title: 'Email Settings',
    description: 'Configure notification recipients for each organization (Day and Foundation) and manage email routing for sale notifications.',
    placement: 'right',
  },
  {
    target: 'admin-settings',
    title: 'Site Settings',
    description: 'Configure the site timezone and other system-wide defaults.',
    placement: 'right',
  },
  {
    target: 'my-learning',
    title: 'My Learning',
    description: 'You have full student access too! Take courses, earn certificates, track your Honor Roll streak, and manage your own profile. You\'ll find all your student features below this divider.',
    placement: 'right',
  },
]
