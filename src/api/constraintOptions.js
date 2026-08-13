export const WEEK_MODES = [
  { value: 'ALL_REMAINING', label: 'All weeks ahead in this block' },
  { value: 'SINGLE', label: 'Single week' },
  { value: 'MULTIPLE', label: 'Multiple weeks' },
];

export const DAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
];

export const DURATIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
];

// common on-the-hour teaching slots
export const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export const LEARNING_ACTIVITIES = [
  'Lecture - Subject lecture',
  'Seminar',
  'Lab / Practical',
  'Tutorial',
  'Surgery',
  'Workshop',
  'Assessment',
  'Other',
];

export const ROOM_TYPES = [
  { value: 'OFFSITE', label: 'Offsite' },
  { value: 'POOLED', label: 'Pooled' },
  { value: 'RESTRICTED', label: 'Restricted' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'NO_ROOM_REQ', label: 'No room req' },
];

export const ROOM_LAYOUTS = [
  { value: 'NONE', label: 'None' },
  { value: 'OFFSITE', label: 'Offsite' },
  { value: 'COLLABORATIVE', label: 'Collaborative' },
  { value: 'IT', label: 'IT' },
  { value: 'RESTRICTED_STUDIO', label: 'Restricted Studio' },
  { value: 'ROWS', label: 'Rows' },
  { value: 'RESTRICTED_OTHER', label: 'Restricted Other' },
  { value: 'RESTRICTED_IT', label: 'Restricted IT' },
  { value: 'TIERED_FIXED_ROWS', label: 'Tiered Fixed Rows' },
  { value: 'GROUP_TECHNOLOGY', label: 'Group Technology' },
  { value: 'SMALL_GROUP', label: 'Small Group' },
  { value: 'FLAT_FIXED_ROWS', label: 'Flat Fixed Rows' },
  { value: 'RESTRICTED_LABORATORY', label: 'Restricted Laboratory' },
  { value: 'SCALE_UP', label: 'SCALE-UP' },
  { value: 'HORSESHOE', label: 'Horseshoe' },
  { value: 'TERCO_GROUP_TECHNOLOGY', label: 'TERCO/Group Technology' },
  { value: 'RESTRICTED_WORKSHOP', label: 'Restricted Workshop' },
  { value: 'HYFLEARNING', label: 'HYFLearning' },
  { value: 'INDEPENDENT_MS_TEAMS_LINK', label: 'Independent MS Teams link (via Lecturer)' },
];

export const ROOM_FEATURES = [
  { value: 'NONE', label: 'None' },
  { value: 'STEP_FREE_ACCESS', label: 'Step Free Access' },
  { value: 'BLACKOUT', label: 'Blackout' },
  { value: 'PODIUM_AT_FRONT', label: 'Podium at Front' },
  { value: 'SINK', label: 'Sink' },
  { value: 'HEIGHT_ADJUSTABLE_DESK', label: 'Height Adjustable Desk' },
  { value: 'NO_CATERING', label: 'No Catering' },
  { value: 'STAGE', label: 'Stage' },
];

// status labels shown across the dashboard + request tables
export const STATUS_LABELS = {
  AWAITING_DECISION: 'Awaiting Decision',
  DRAFT_COMPLETE: 'Draft Complete',
  IN_PROGRESS: 'In Progress',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  COMPLETE: 'Complete',
};
