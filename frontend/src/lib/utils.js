import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getTierColor(tier) {
  const colors = {
    'Bronze': 'tier-bronze',
    'Silver': 'tier-silver', 
    'Gold': 'tier-gold',
    'Platinum': 'tier-platinum',
    'Diamond': 'tier-diamond',
    'Gladiator': 'tier-gladiator'
  }
  return colors[tier] || 'tier-bronze'
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
} 