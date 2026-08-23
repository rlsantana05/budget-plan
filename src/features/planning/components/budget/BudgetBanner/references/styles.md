# Budget Banner Design Specification

## Visual Requirements

### Height Reduction (1/3 of original)
- **Original**: padding `22px 26px 8px`, font-size `48px`, total height ~80px
- **Target**: padding `14px 26px 4px`, font-size `16px`, total height ~30px

### Layout Changes
```
┌─────────────────────────────────┐
│  $1,500.00 Available to allocate  │  ← Message inline with amount
│  ✓                            │  ← Status checkmark (complete only)
└─────────────────────────────────┘
```

### Removed Elements
- `bannerEyebrow` section entirely
- Animated `bannerLed` label
- Status dot indicator

### New Structure
```tsx
<div className={classes.bannerRow}>
  <span className={classes.bannerAmount}>
    {formatMoney(Math.abs(amount))}
    {message && <span className={classes.bannerMessage}>{message}</span>}
  </span>
  {status === 'complete' && <Check size={16} />}
</div>
```

## CSS Values

```css
.banner {
  padding: 14px 26px 4px;  /* Reduced from 22px 26px 8px */
}

.bannerAmount {
  font-size: 16px;  /* Reduced from 48px */
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bannerMessage {
  font-size: 12px;
  font-weight: 400;
  color: var(--ink-soft);
  font-style: italic;
}
```

## Type Definition

```tsx
interface BudgetBannerProps {
  amount: number;
  label: string;
  children?: ReactNode;
  flat?: boolean;
  message?: string;  // NEW: inline message to right of amount
}
```

## Layout Order in Planning.tsx

```
BudgetGroupsProvider>
  <Income />
  <BudgetBanner amount={bannerAmount} label={bannerLabel} message="Available to allocate" />
  <BudgetGroupListWithHeader />
</BudgetGroupsProvider>
```

⚠️ **Key Order Rule**: `<Income />` must be ABOVE `<BudgetBanner />`, not beside it.