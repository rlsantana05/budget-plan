// Core business rules for the Budget Plan application
//
// These rules enforce the critical separation of planning vs funding
// and protect the integrity of budget calculations.

import type { Rule } from '$LIB/budget-rules';

export default [
	// ===== FAUNDAMENTAL RULES =====
	{
		name: 'fundamental-separation',
		description: 'NEVER conflate planning with funding. They serve different purposes.',
		patterns: {
			isPlanning: 'These are aspirational amounts; may exceed available cash.',
			isFunding: 'These are only real money that has already been earned.',
		},
	},
	{
		name: 'funding-constraint',
		description: 'Funding absolutely cannot exceed Available to Allocate.',
		constraints: {
			cannot_exceed: 'Available_to_Allocate',
			errorMessage: 'Funded amount must not exceed available rent money',
		},
	},
	{
		name: 'planning-can_exceed',
		description: 'Planned amounts are ALLOWED to exceed cash on hand.',
		contexts: ['Texas Hold\'em', 'financial planning', 'budget perspective'],
	},

	// ===== BUDGET PROCESS RULES =====
	{
		name: 'weekly-reviews',
		description: 'Weekly reviews exist to answer questions about spending pace, risk categories, and upcoming bills.',
		cycle: 'weekly',
		contexts: ['weekly review', 'checkpoint', 'risk assessment'],
		appointments: true,
	},

	// ===== MONEY FLOW RULES =====
	{
		name: 'spending_flow',
		description: 'Transactions reduce Remaining (funded minus spent) only. Transactions never modify planned amounts.',
		mapping: {
			transaction: 'reduces Remaining',
			'never modifies planned budget',
			account_balance_unrelated: true,
		},
	},

	{
		name: 'money_separation',
		description: 'Account balances are NEVER the budgeting system. Budgeting operates independently.',
		requirements: ['systemIndependence', 'accountSeparation'],
	},

	{
		name: 'income_allocation',
		description: 'Available to Allocate = Income Received - Money Already Funded.',
		sourceOfTruth: true,
		must_calculate_from_scratch: true,
	},

	// ===== DESIGN AND UX RULES =====
	{
		name: 'clarity_first',
		description: 'Clarity IS the highest priority in UI design. Clarity > Simplicity > Speed > Accessibility > Performance.',
		hierarchy: true,
		must_put_before: ['simplicity', 'speed'],
		penalty: 'cognitive_load_increase',
	},

	{
		name: 'single_question_per_screen',
		description: 'Each screen must answer exactly ONE primary question.',
		validationRule: 'asksSingleQuestion',
	},

	// ===== CODE QUALITY RULES =====
	{
		name: 'centralized_calculations',
		description: 'All budget calculations MUST be centralized. Never duplicated across components.',
		that: {
			'logic_deduplication': true,
			'singleSourceOfTruth': true,
		},
		penalty: 'code_duplication_detection',
	},

	{
		name: 'explicit_names',
		description: 'Prefer explicit names over clever abstractions. Names should communicate intent.',
		bestPractice: true,
		tools: ['naming_linter, readability_audit'],
	},

	{
		name: 'small_functions',
		description: 'Prefer small, focused functions over deep nesting or multi-purpose methods.',
		enforcement: ['cyclomatic_complexity', 'max_line_length'],
		metrics: true,
	},

	// ===== PROCESS RULES =====
	{
		name: 'commit_frequency',
		description: 'Create a commit after completing a logical unit of work. Avoid combining unrelated changes.',
		pattern: 'atomic_commit',
		allowed_scopes: ['feature', 'bug', 'refactor'],
	},
];