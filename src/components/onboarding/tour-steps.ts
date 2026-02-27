export interface TourStep {
  target: string        // data-tour attribute value
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const studentTourSteps: TourStep[] = [
  {
    target: 'student-dashboard',
    title: 'Your Dashboard',
    description: 'This is your home base. See your stats, enrolled courses, and study route progress all in one place.',
    placement: 'bottom',
  },
  {
    target: 'student-certificates',
    title: 'Certificates',
    description: 'After completing a course, your certificate will appear here. You can view and print it anytime.',
    placement: 'right',
  },
  {
    target: 'student-honor-roll',
    title: 'Honor Roll',
    description: 'See how you rank against other students. Keep your weekly streak going to climb the leaderboard!',
    placement: 'right',
  },
  {
    target: 'student-notifications',
    title: 'Notifications',
    description: 'You\'ll get notified here when lessons are graded, corrections are needed, or certificates are issued.',
    placement: 'right',
  },
  {
    target: 'student-profile',
    title: 'Your Profile',
    description: 'Update your name, study route, password, and certificate delivery preference here.',
    placement: 'right',
  },
]

export const supervisorTourSteps: TourStep[] = [
  {
    target: 'supervisor-dashboard',
    title: 'Supervisor Dashboard',
    description: 'Your overview showing pending submissions, overdue items, and student counts at a glance.',
    placement: 'right',
  },
  {
    target: 'supervisor-queue',
    title: 'Grading Queue',
    description: 'Lessons submitted by your students appear here for grading. Try to review within 24 hours.',
    placement: 'right',
  },
  {
    target: 'supervisor-invoices',
    title: 'Pending Invoices',
    description: 'When staff members enroll with an invoice number, you can verify and approve their enrollment here.',
    placement: 'right',
  },
  {
    target: 'supervisor-students',
    title: 'Your Students',
    description: 'View all students assigned to you, their progress, and send nudge emails to inactive students.',
    placement: 'right',
  },
  {
    target: 'supervisor-reports',
    title: 'Reports',
    description: 'Access activity reports, progress boards, completion stats, grading analytics, and weekly exports.',
    placement: 'right',
  },
  {
    target: 'my-learning',
    title: 'My Learning',
    description: 'You can also take courses yourself! These links take you to your own student dashboard, certificates, and profile.',
    placement: 'right',
  },
]

export const adminTourSteps: TourStep[] = [
  {
    target: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'A quick overview of your platform — course count, students, supervisors, and pending grades.',
    placement: 'right',
  },
  {
    target: 'admin-courses',
    title: 'Course Management',
    description: 'Add, edit, and manage courses and their lessons. Set pricing, upload images, and configure questions.',
    placement: 'right',
  },
  {
    target: 'admin-users',
    title: 'User Management',
    description: 'Manage all users — assign roles, supervisors, organizations, study routes, enroll students, and set certificate permissions.',
    placement: 'right',
  },
  {
    target: 'admin-certificates',
    title: 'Certificates',
    description: 'Attest and issue certificates as students complete courses. Track mailing status for physical certificates.',
    placement: 'right',
  },
  {
    target: 'admin-routes',
    title: 'Study Routes',
    description: 'Define and manage study routes that guide students through courses in a recommended order.',
    placement: 'right',
  },
  {
    target: 'admin-reports',
    title: 'Reports & Revenue',
    description: 'Access all reporting tools including activity, progress, completions, and revenue tracking.',
    placement: 'right',
  },
  {
    target: 'my-learning',
    title: 'My Learning',
    description: 'You can also take courses yourself! These links take you to your own student dashboard, certificates, and profile.',
    placement: 'right',
  },
]
