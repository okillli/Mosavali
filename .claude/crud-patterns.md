# CRUD Patterns

> **When to read:** Creating new entity pages, forms, or delete flows
> **Skip if:** Only styling changes or database work → see [ui-patterns.md](ui-patterns.md) or [database.md](database.md)

## Page Structure

```
/app/[entity]/page.tsx          - List (Add button)
/app/[entity]/new/page.tsx      - Add form
/app/[entity]/[id]/page.tsx     - Detail (Edit/Delete)
/app/[entity]/[id]/edit/page.tsx - Edit form
```

## Form Component Pattern

One form per entity, handles both Add and Edit:

```typescript
interface EntityFormProps {
  mode: 'add' | 'edit';
  initialData?: Entity;
}
```

Example: `FieldForm.tsx` used by `/fields/new` and `/fields/[id]/edit`

## Delete Flow

1. Delete button on detail page
2. `ConfirmDialog` with specific message: `${STRINGS.DELETE_FIELD_CONFIRM} "${field.name}"?`
3. Warn about related data: `${STRINGS.FIELD_HAS_LOTS} (${count})`
4. On confirm: delete + redirect to list

## Delete Warnings

Always check and warn about related records:

```typescript
const warnings: string[] = [];
if (lots.length > 0) warnings.push(`${STRINGS.FIELD_HAS_LOTS} (${lots.length})`);
if (works.length > 0) warnings.push(`${STRINGS.FIELD_HAS_WORKS} (${works.length})`);
```

## Inline Forms

For adding child records from parent detail page (e.g., expenses from work):

**Context Inheritance:**
- Auto-set `season_id` from parent
- Auto-set `allocation_type` + `target_id`
- User only inputs: amount, date, description

**State Checklist:**
```typescript
const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({...defaults});
const [isSaving, setIsSaving] = useState(false);
```

For UI implementation details → see [ui-patterns.md](ui-patterns.md#inline-add-form)
