// Content Moderation Utilities

// High-risk keywords and patterns for text filtering
const HIGH_RISK_KEYWORDS = [
  // Financial scams
  'send money', 'wire transfer', 'bank details', 'sort code', 'account number',
  'urgent payment', 'cash urgently', 'bitcoin', 'cryptocurrency',
  
  // Threats and harassment
  'kill you', 'hurt you', 'attack', 'threaten',
  
  // Explicit content
  'nude', 'naked', 'sex', 'porn',
  
  // Hate speech indicators
  'hate', 'racist', 'terrorism',
  
  // Grooming/exploitation
  'secret', 'don\'t tell', 'keep quiet', 'our secret',
  
  // Self-harm
  'kill myself', 'end it all', 'suicide',
];

const MEDIUM_RISK_KEYWORDS = [
  'meet me', 'come to my house', 'visit me alone',
  'password', 'pin code', 'credit card',
  'lonely', 'depressed', 'help me please',
];

const SCAM_PATTERNS = [
  /\b\d{16}\b/, // Credit card numbers
  /\b\d{2}-\d{2}-\d{2}\b/, // Sort codes
  /\b\d{8}\b/, // Account numbers
  /urgent.*money/i,
  /help.*financial.*emergency/i,
];

export interface ModerationResult {
  isBlocked: boolean;
  riskScore: number;
  flags: string[];
  warnings: string[];
}

export function moderateText(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();
  let riskScore = 0;
  const flags: string[] = [];
  const warnings: string[] = [];

  // Check high-risk keywords
  HIGH_RISK_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      riskScore += 30;
      flags.push(`High-risk keyword detected: "${keyword}"`);
    }
  });

  // Check medium-risk keywords
  MEDIUM_RISK_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      riskScore += 15;
      warnings.push(`Medium-risk keyword detected: "${keyword}"`);
    }
  });

  // Check scam patterns
  SCAM_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      riskScore += 25;
      flags.push('Potential financial information detected');
    }
  });

  // Check for urgency language
  if (/urgent|immediately|right now|asap/i.test(content)) {
    riskScore += 10;
    warnings.push('Urgency language detected');
  }

  // Check for meeting offline
  if (/meet|visit|come over|my address|my home/i.test(content)) {
    riskScore += 15;
    warnings.push('Offline meeting mentioned');
  }

  // Block if risk score is very high
  const isBlocked = riskScore >= 60;

  return {
    isBlocked,
    riskScore,
    flags,
    warnings,
  };
}

export function calculateUserRiskScore(user: {
  createdAt: Date;
  isAdmin: boolean;
  accountType: string;
}): number {
  let score = 0;

  // New account (less than 7 days)
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 1) {
    score += 20;
  } else if (daysSinceCreation < 7) {
    score += 10;
  }

  // Admin accounts are trusted
  if (user.isAdmin) {
    score -= 50;
  }

  // Verified organizations are more trusted
  if (user.accountType === 'CHARITY') {
    score -= 10;
  }

  return Math.max(0, score);
}

export function shouldShowSafetyWarning(content: string): {
  show: boolean;
  message?: string;
} {
  // Financial information warning
  if (/money|payment|bank|card|account/i.test(content)) {
    return {
      show: true,
      message: '⚠️ Safety Reminder: Never share bank details, passwords, or send money to people you haven\'t met in person. Report suspicious requests.',
    };
  }

  // Meeting offline warning
  if (/meet|visit|come|address|home/i.test(content)) {
    return {
      show: true,
      message: '🛡️ Safety Reminder: When meeting someone for the first time, always meet in a public place, tell a friend or family member, and never share your full address until you trust them.',
    };
  }

  // Personal information warning
  if (/phone|mobile|number|email|address/i.test(content)) {
    return {
      show: true,
      message: '🔒 Privacy Reminder: Be careful sharing personal contact information publicly. Use platform messaging first to build trust.',
    };
  }

  return { show: false };
}

export function getImageModerationWarning(): string {
  return '⚠️ All images are reviewed by our moderation team. Do not upload inappropriate, illegal, or harmful content.';
}

export interface ReportCategory {
  value: string;
  label: string;
  description: string;
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    value: 'SCAM',
    label: 'Scam or Fraud',
    description: 'Requesting money, financial information, or suspicious offers',
  },
  {
    value: 'HARASSMENT',
    label: 'Harassment or Bullying',
    description: 'Threatening, abusive, or intimidating behavior',
  },
  {
    value: 'INAPPROPRIATE',
    label: 'Inappropriate Content',
    description: 'Sexual, violent, or disturbing content',
  },
  {
    value: 'HATE_SPEECH',
    label: 'Hate Speech',
    description: 'Discriminatory or hateful language',
  },
  {
    value: 'FAKE_HELP',
    label: 'Fake Help Request',
    description: 'Suspicious or dishonest help request',
  },
  {
    value: 'SPAM',
    label: 'Spam',
    description: 'Repetitive, irrelevant, or excessive posting',
  },
  {
    value: 'IMPERSONATION',
    label: 'Impersonation',
    description: 'Pretending to be someone else',
  },
  {
    value: 'ILLEGAL',
    label: 'Illegal Content',
    description: 'Content that may be illegal',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other safety or community concern',
  },
];
