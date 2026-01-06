# UI/UX Patterns

## Components (`components/ui/`)

### Button
```tsx
<Button variant="primary">შენახვა</Button>      // Green - main actions
<Button variant="secondary">გაუქმება</Button>  // Gray - cancel/back
<Button variant="danger">წაშლა</Button>        // Red - delete
<Button variant="outline">...</Button>         // Bordered - alternative
```

### Input, Select, TextArea
```tsx
<Input label="სახელი" value={v} onChange={...} error={err} placeholder="..." />
<Select label="სტატუსი" options={[{value, label}]} />
<TextArea label="შენიშვნები" rows={4} />
```
- `noMargin` prop removes bottom margin for inline forms

### SearchableDropdown
Feature-rich dropdown with:
- Search with debounce (300ms)
- Async loading via `loadOptions`
- Create new inline via `allowCreate` + `onCreateOption`
- Keyboard navigation (arrows, enter, escape)

```tsx
<SearchableDropdown
  label="მყიდველი"
  value={buyerId}
  onChange={(value) => setBuyerId(value)}
  options={buyers}           // or loadOptions={async (q) => ...}
  allowCreate={true}
  onCreateOption={handleCreate}
/>
```

### ConfirmDialog
Required for all delete operations:
```tsx
<ConfirmDialog
  isOpen={show}
  title={STRINGS.DELETE_CONFIRM_TITLE}
  message={`${STRINGS.DELETE_FIELD_CONFIRM} "${field.name}"?`}
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShow(false)}
  isLoading={deleting}
/>
```

---

## Layout Patterns

### List Page
```tsx
<div>
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold">{STRINGS.NAV_FIELDS}</h1>
    <Link href="/app/fields/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center">
      <Plus size={16} className="mr-1" /> {STRINGS.ADD}
    </Link>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    {items.map(item => (
      <Link href={`/app/fields/${item.id}`} className="bg-white p-4 rounded-lg shadow-sm border hover:border-green-500">
        ...
      </Link>
    ))}
  </div>
</div>
```

### Detail Page
```tsx
<div>
  {/* Header */}
  <div className="mb-6">
    <Button variant="secondary" onClick={() => router.back()} className="mb-4">
      &larr; {STRINGS.BACK}
    </Button>
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <Icon className="mr-2 text-green-600" />
          {item.name}
        </h1>
        <p className="text-gray-500">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={...}><Pencil size={16} /> {STRINGS.EDIT}</Button>
        <Button variant="danger" onClick={...}><Trash2 size={16} /> {STRINGS.DELETE}</Button>
      </div>
    </div>
  </div>

  {/* Tabs (optional) */}
  <div className="flex border-b mb-6">
    <button className={`px-4 py-2 ${active ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>
      {label}
    </button>
  </div>

  {/* Content */}
  <div className="bg-white p-6 rounded shadow">...</div>

  <ConfirmDialog {...} />
</div>
```

### Inline Add Form
For adding related items from detail page:
```tsx
<button onClick={() => setShowForm(true)} className="border-2 border-dashed border-gray-300 p-3 rounded hover:bg-gray-50">
  + {STRINGS.ADD}
</button>

{showForm && (
  <div className="border-2 border-dashed border-green-300 p-4 rounded bg-green-50 space-y-2">
    <Input ... />
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => setShowForm(false)}>{STRINGS.CANCEL}</Button>
      <Button onClick={save} disabled={saving}>{saving ? '...' : STRINGS.SAVE}</Button>
    </div>
  </div>
)}
```

---

## Color Scheme

| Usage | Class |
|-------|-------|
| Primary action | `bg-green-600`, `text-green-600` |
| Sidebar | `bg-green-900` |
| Focus ring | `focus:ring-green-500` |
| Active tab | `border-green-600 text-green-700` |
| Secondary | `bg-gray-100`, `text-gray-500` |
| Danger | `bg-red-600`, `text-red-500` |
| Error bg | `bg-red-100 text-red-700` |

---

## States

### Loading
```tsx
{loading && <div className="text-gray-500">{STRINGS.LOADING}</div>}
<Button disabled={loading}>{loading ? '...' : STRINGS.SAVE}</Button>
```

### Empty
```tsx
{items.length === 0 && <div className="text-center py-10 text-gray-500">{STRINGS.NO_DATA}</div>}
```

### Error
```tsx
{error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
<Input error={fieldError} />  // Shows below input in red
```

---

## Mobile-First

- `md:grid-cols-2` - 1 col mobile, 2 desktop
- `hidden md:flex` - sidebar hidden on mobile
- Bottom nav: 4 main items, fixed at bottom
- Parent content: `pb-16` to clear bottom nav

---

## Icons (lucide-react)

```tsx
// Sizing
<Icon size={16} />  // buttons
<Icon size={20} />  // nav
<Icon size={24} />  // cards

// With button text
<Button><Plus size={16} className="mr-1" /> {STRINGS.ADD}</Button>
```

Common: `Plus`, `Pencil`, `Trash2`, `Check`, `X`, `ChevronDown`, `Loader2`, `ArrowRight`

---

## Card Styling

```tsx
// List card
<div className="bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">

// Stat card
<div className="bg-blue-50 p-4 rounded text-center">
  <Icon className="mx-auto mb-2 text-blue-500" />
  <span className="block font-bold text-xl">{value}</span>
  <span className="text-xs text-gray-500">{label}</span>
</div>

// Info row
<div className="flex justify-between border-b pb-2">
  <span className="text-gray-500">{label}</span>
  <span className="font-medium">{value}</span>
</div>
```
