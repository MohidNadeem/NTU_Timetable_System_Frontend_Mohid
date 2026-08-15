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
  'Drop-in',
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

export const ALL_STATUSES = Object.keys(STATUS_LABELS);

// matches ConstraintRequestService.updateStatus's backend validation - reason becomes required for these two
export const STATUSES_REQUIRING_REASON = ['ACCEPTED', 'REJECTED'];

export const SESSION_TYPE_LABELS = {
  LECTURE: 'Lecture',
  SEMINAR: 'Seminar',
  LAB: 'Lab',
  TUTORIAL: 'Tutorial',
  SURGERY: 'Surgery',
  PROJECT: 'Project',
};

// ---- Change Request options (Increment 2)

export const ACADEMIC_PERIODS = [
  { value: 'HALF_YEAR_1', label: 'Half Year 1' },
  { value: 'HALF_YEAR_2', label: 'Half Year 2' },
  { value: 'FULL_YEAR', label: 'Full Year' },
];

export const PREFERRED_ROOM_ANSWERS = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
  { value: 'ONLINE', label: 'Online' },
];

// also doubles as the standard filter category on both lecturer and Timetabling Team views.
export const CHANGE_CATEGORIES = [
  { value: 'SESSION_TIME', label: 'Session time' },
  { value: 'CLASHES', label: 'Clashes' },
  { value: 'ROOM_TYPE', label: 'Room type' },
  { value: 'ADDITIONAL_SESSION', label: 'Additional session' },
  { value: 'ROOM_BOOKING', label: 'Room booking' },
  { value: 'STUDENT_ALLOCATION', label: 'Students are not allocated correctly to groups' },
  { value: 'STAFF_CHANGE', label: 'Staff change', requiresApproval: true },
  { value: 'SESSION_DATE', label: 'Session date', requiresApproval: true },
  { value: 'SESSION_REMOVAL', label: 'Session removal', requiresApproval: true },
  { value: 'MERGE_SESSIONS_GROUPS', label: 'Merge sessions/groups', requiresApproval: true },
  { value: 'OTHER', label: 'Other' },
];

export function changeCategoryLabel(value) {
  return CHANGE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// Effect calculator labels (Violations / Changes in Queue / View Effect)
export const ACTION_TYPE_LABELS = {
  NONE: 'Nothing to do',
  UPDATE_SESSION: 'Update session',
  ADD_SESSION: 'Add session',
  MANUAL_REVIEW: 'Needs manual review',
};

// Room dropdown ordering (Update Session / Add Session)
export function orderRoomsBySuggestion(allRooms, suggestedNames = [], currentRoomName = null) {
  const priority = suggestedNames.length > 0 ? suggestedNames : (currentRoomName ? [currentRoomName] : []);
  const priorityRooms = priority.map((name) => allRooms.find((r) => r.name === name)).filter(Boolean);
  const rest = allRooms.filter((r) => !priority.includes(r.name));
  return { ordered: [...priorityRooms, ...rest], defaultId: priorityRooms[0]?.id ?? null };
}
