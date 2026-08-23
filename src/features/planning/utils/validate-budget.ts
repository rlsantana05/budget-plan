/**
 * Budget Validation Logic
 *
 * Enforces the core business rules:
 * 1. Planning is aspirational (can exceed cash)
 * 2. Funding is constrained by real money (Available to Assign)
 * 3. Transactions only reduce Remaining (funded - spent)
 * 4. Moving money between categories preserves total funded
 */

/**
 * Validates that an assignment amount is within the available pool.
 *
 * @param amount - The amount to assign (must be >= 0)
 * @param availableToAssign - Current available pool from liquid accounts minus assigned funds
 * @returns Object with validity status and message
 */
export function validateAssignmentAmount(
  amount: number,
  availableToAssign: number,
): { valid: boolean; message: string; remainingAfter: number } {
  // Rule: Amount must be non-negative
  if (amount < 0) {
    return {
      valid: false,
      message: 'Assignment amount must be zero or positive',
      remainingAfter: availableToAssign,
    };
  }

  // Rule: Cannot assign more than available to assign
  if (amount > availableToAssign) {
    const overBy = amount - availableToAssign;
    return {
      valid: false,
      message: `Amount exceeds available to assign by $${overBy.toFixed(2)}. `
        + `Available: $${availableToAssign.toFixed(2)}`,
      remainingAfter: 0,
    };
  }

  // Valid assignment
  const remaining = availableToAssign - amount;
  return {
    valid: true,
    message: 'Assignment valid',
    remainingAfter: remaining,
  };
}

/**
 * Validates that funding does not exceed planning for a category.
 *
 * Important: Planning is aspirational and MAY exceed funded amount.
 * This validation ensures we don't create confusing states where
 * funded > planned without a specific reason.
 *
 * @param funded - The amount funded (real money assigned)
 * @param planned - The planned amount (aspirational)
 * @returns Validation result
 */
export function validateFundingVsPlanning(
  funded: number,
  planned: number,
): { valid: boolean; message: string } {
  // Planning can exceed funded (aspirational) - this is allowed
  // But we warn when funded significantly exceeds planned without cause

  if (funded <= planned) {
    return {
      valid: true,
      message: 'Funding within planned amount',
    };
  }

  // Funded exceeds planned - this is allowed but should be noted
  const overBy = funded - planned;
  return {
    valid: true,
    message: `Funded exceeds planned by $${overBy.toFixed(2)}. `
      + 'Planning is aspirational; ensure this is intentional.',
  };
}

/**
 * Validates a category target assignment.
 *
 * When assigning to targets, we must ensure we don't overspend the pool.
 *
 * @param amountToAssign - Amount being assigned to targets
 * @param currentPool - Current available to assign
 * @param alreadyAssigned - Already assigned amount in this category
 * @returns Validation result
 */
export function validateTargetAssignment(
  amountToAssign: number,
  currentPool: number,
  alreadyAssigned: number = 0,
): { valid: boolean; message: string; newPool: number } {
  const amountAfter = amountToAssign + alreadyAssigned;

  if (amountAfter > currentPool) {
    const overBy = amountAfter - currentPool;
    return {
      valid: false,
      message: `Target assignment would exceed pool by $${overBy.toFixed(2)}. `
        + `Current pool: $${currentPool.toFixed(2)}, `
        + `Already assigned: $${alreadyAssigned.toFixed(2)}`,
      newPool: currentPool,
    };
  }

  const newPool = currentPool - amountToAssign;
  return {
    valid: true,
    message: 'Target assignment valid',
    newPool,
  };
}

/**
 * Validates a category movement (MOVE_IN/MOVE_OUT).
 *
 * Ensures total funded is preserved when moving money between categories.
 *
 * @param fromAmount - Amount moving out of source category
 * @param toAmount - Amount moving into destination category
 * @param currentFundedSource - Current funded amount in source
 * @param currentFundedDest - Current funded amount in destination
 * @returns Validation result with preserved funding check
 */
export function validateCategoryMovement(
  fromAmount: number,
  toAmount: number,
  currentFundedSource: number,
  currentFundedDest: number,
): { valid: boolean; message: string; preserved: boolean } {
  // MOVE_OUT reduces source funded, MOVE_IN increases dest funded
  // Total funded should remain unchanged: (source - move) + (dest + move) = source + dest

  const newFundedSource = currentFundedSource - fromAmount;
  const newFundedDest = currentFundedDest + toAmount;
  const totalBefore = currentFundedSource + currentFundedDest;
  const totalAfter = newFundedSource + newFundedDest;

  if (totalBefore !== totalAfter) {
    return {
      valid: false,
      message: `Movement would change total funded: ${totalBefore} → ${totalAfter}. `
        + 'Total funded must be preserved when moving between categories.',
      preserved: false,
    };
  }

  // Check source doesn't go negative
  if (newFundedSource < 0) {
    return {
      valid: false,
      message: `Cannot move $${fromAmount.toFixed(2)} from source: `
        + `would result in negative funded (${newFundedSource < 0 ? newFundedSource : 0}).`,
      preserved: false,
    };
  }

  return {
    valid: true,
    message: 'Category movement valid - funding preserved',
    preserved: true,
  };
}
