# Ubiquitous Language: Planning Feature Screen

This document defines the terminology specifically used on the **Planning screen** (`/planning`), which is the primary budgeting interface for monthly budget management.

## Screen Components

|| Term | Code Component | Meaning |
| ---- | -------------- | ------- |
| Left Column | `.leftCol` | The main budget table area containing Income, BudgetBanner, and BudgetGroupListWithHeader. |
| Right Column | `.rightCol` | The transaction panel that shows Summary view, Transactions view, or CategoryHub detail view. |
| Transaction Panel | `TransactionsPanel` | The right-hand side panel for viewing and managing transactions. |
| Hub Panel | `[data-hub-panel]` | Data attribute on the aside element containing the transaction panel. |

## View States

|| Term | Code | Meaning |
| ---- | ---- | ------- |
| Summary View | `activeView === 'summary'` | Shows the donut chart and summary table with Planned/Spent/Available metrics. |
| Transactions View | `activeView === 'transactions'` | Shows the list of transactions grouped by month, with StatusSubtabs for filter toggle. |
| Category Hub | `selectedItem` is truthy | Shows detailed view of a selected category/group item with its transactions and assign functionality. |

## Income Section

|| Term | Code | Meaning |
| ---- | ---- | ------- |
| Income | `<Income />` | Self-contained table of income sources matching the budget group cards' style. |
| Income Group | `g.isIncome` | The special group containing all income items. |
| Received | `item.received` | Income that has actually arrived as real money. |
| Remaining (Income) | `planned - received` | Difference between planned and actual received income. |

## Budget Banner

|| Term | Code | Meaning |
| ---- | ---- | ------- |
| Budget Banner | `<BudgetBanner />` | Status indicator showing the monthly budget position. |
| On Budget | `bannerAmount === 0` | Income equals spending; perfect balance. |
| Left to Budget | `bannerAmount > 0` | Income exceeds spending; money left to assign. |
| Over Budget | `bannerAmount < 0` | Spending exceeds income; need to adjust. |
| Available to Allocate | `message="Available to allocate"` | Inline message shown on the banner (text only, no label). |

## Transactions Views

|| Term | Code | Meaning |
| ---- | ---- | ------- |
| Status Subtabs | `'new' \| 'tracked' \| 'deleted'` | Tab filters for transaction states within Transactions view. |
| Transaction Search | `<TransactionSearch />` | Search input with magnifying glass icon for filtering transactions. |
| Month Group | `txByMonth` | Transactions grouped by month for display in the list. |
| Assign All | `onAssignAll()` | One-click function to assign all Available to Assign money to underfunded targets. |

## Assign / Target Functionality

|| Term | Code | Meaning |
| ---- | ---- | ------- |
| Assign to Targets | `<TargetModal>` | Modal dialog for setting or editing a category's target. |
| Ready to Assign | `readyToAssign` | Amount of Available to Assign available for all targets. |
| Target Modal | `targetItem` state | Controls when the target editing modal is shown. |

## Accessibility Attributes

|| Term | Code | Meaning |
| ---- | ---- | ------- |
| Hub Panel | `data-hub-panel` | Attribute marking the transaction panel container. |
| Category Row | `data-category-row` | Attribute used to detect clicks outside for collapsing. |

## Layout Order (Left Column)

The order of components in the left column matters:

1. `<Income />` - Income section with income sources table
2. `<BudgetBanner />` - Monthly budget status banner
3. `<BudgetGroupListWithHeader />` - Budget categories list

## Visibility Rules

1. **Summary and Transactions views toggle** - Always visible when no item is selected
2. **Assign to Target button** - Only visible when:
   - No item is selected (`selectedItem === null`)
   - AND `activeView === 'transactions'`
   - AND `readyToAssign > 0`
3. **StatusSubtabs** - Only visible in Transactions view when no item is selected
4. **CategoryHub** - Only visible when an item IS selected (contains item-specific assign button)