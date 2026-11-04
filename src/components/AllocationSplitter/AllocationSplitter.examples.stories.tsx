import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import '../../common/tokens.css';
import { AllocationSplitter } from './AllocationSplitter';
import type { AllocationCategory } from './allocation';

const meta = {
  title: 'Allocation/Allocation Splitter/Examples',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const NEW_CATEGORY_COLORS: AllocationCategory['color'][] = [
  'teal-medium-dark',
  'purple-medium-dark',
  'pink-medium-dark',
  'red-medium-dark',
];

function CategoryManagementPage() {
  const [value, setValue] = useState(12_000);
  const [strategy, setStrategy] = useState<'proportional' | 'freeform'>('proportional');
  const [categories, setCategories] = useState<AllocationCategory[]>([
    { name: 'Rent', description: 'office lease', percentage: 40, color: 'blue-dark' },
    { name: 'Payroll', description: 'salaries and benefits', percentage: 35, color: 'green-medium-dark' },
    { name: 'Marketing', description: 'ads and content', percentage: 25, color: 'orange-dark' },
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const trimmedName = newCategoryName.trim();
  const isDuplicateName = categories.some(
    (category) => category.name.toLowerCase() === trimmedName.toLowerCase()
  );

  const handleAddCategory = () => {
    if (!trimmedName || isDuplicateName) return;
    const color = NEW_CATEGORY_COLORS[categories.length % NEW_CATEGORY_COLORS.length];
    setCategories([...categories, { name: trimmedName, percentage: 0, color }]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (name: string) => {
    setCategories(categories.filter((category) => category.name !== name));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'var(--as-font-base)' }}>
      {/* Inline styles can't express a media query, and this is a
          demo-only page (not a distributable component), so a scoped
          <style> tag is the pragmatic choice over introducing a CSS Module
          just for these breakpoints. The page's own chrome (header/main/card
          padding) shrinks at narrow widths so AllocationSplitter's table —
          which has its own 280px min-width — has room to fit without
          forcing the whole page into horizontal scroll. */}
      <style>{`
        .example-page-header {
          padding: 20px 32px;
        }
        .example-page-main {
          padding: 32px 24px;
        }
        .example-page-card {
          padding: 24px;
        }
        .example-add-category-form {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 480px) {
          .example-page-header {
            padding: 16px 20px;
          }
          .example-page-main {
            padding: 20px 12px;
          }
          .example-page-card {
            padding: 16px;
          }
          .example-add-category-form {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
        }
        /* AllocationSplitter's own table has a fixed 280px min-width, so
           below ~360px the 480px breakpoint's padding alone isn't enough
           to leave it room — its "Total allocated" row (and any other
           content past that floor) scrolls within its own nested
           container instead of being visible outright. Trimming chrome
           further here keeps everything in view without touching that
           min-width, which belongs to the component, not this page. */
        @media (max-width: 360px) {
          .example-page-main {
            padding: 16px 8px;
          }
          .example-page-card {
            padding: 8px;
          }
        }
      `}</style>
      <header
        className="example-page-header"
        style={{
          backgroundColor: 'var(--as-color-ink)',
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        Acme Co. — Budgeting
      </header>
      <main className="example-page-main" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          className="example-page-card"
          style={{
            backgroundColor: '#fff',
            borderRadius: 'var(--as-radius-md)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>Monthly Budget</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddCategory();
              }}
              className="example-add-category-form"
            >
              <label htmlFor="new-category-name" style={{ fontSize: 14, color: '#666' }}>
                New category
              </label>
              <input
                id="new-category-name"
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="e.g. Savings"
                style={{
                  border: '1px solid #c9c9c9',
                  borderRadius: 'var(--as-radius-md)',
                  padding: '9px 12px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={!trimmedName || isDuplicateName}
                style={{
                  border: 'none',
                  borderRadius: 'var(--as-radius-md)',
                  backgroundColor: 'var(--as-color-ink)',
                  color: '#fff',
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: trimmedName && !isDuplicateName ? 'pointer' : 'default',
                  opacity: trimmedName && !isDuplicateName ? 1 : 0.5,
                }}
              >
                + Add Category
              </button>
            </form>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {categories.map((category) => (
              <span
                key={category.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--as-color-surface)',
                  borderRadius: 999,
                  padding: '4px 6px 4px 12px',
                  fontSize: 13,
                  color: 'var(--as-color-ink)',
                }}
              >
                {category.name}
                <button
                  type="button"
                  aria-label={`Remove ${category.name}`}
                  onClick={() => handleRemoveCategory(category.name)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    border: 'none',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    color: 'var(--as-color-muted)',
                    fontSize: 14,
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <AllocationSplitter
            value={value}
            onValueChange={setValue}
            strategy={strategy}
            onStrategyChange={setStrategy}
            categories={categories}
            onCategoriesChange={setCategories}
          />
        </div>
      </main>
    </div>
  );
}

export const CategoryManagement: Story = {
  render: () => <CategoryManagementPage />,
};
