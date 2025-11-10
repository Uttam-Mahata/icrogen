# Material UI to shadcn UI Migration Summary

## Completed Migrations

### Common Components
1. **LoadingSpinner.tsx** - Complete
2. **ErrorAlert.tsx** - Complete
3. **ConfirmDialog.tsx** - Complete

### Pages
1. **Dashboard.tsx** - Complete

## Key Migration Patterns

### Material UI → shadcn UI Component Mapping

#### Layout Components
- `Box` → `div` with Tailwind classes
- `Grid container` → `div` with `grid grid-cols-*`
- `Grid item xs={12} sm={6}` → `div` with grid column classes
- `Stack` → `div` with `flex` classes
- `Paper` → `Card` from `@/components/ui/card`

#### Typography
- `Typography variant="h4"` → `h1-h6` with Tailwind `text-*` classes
- `Typography variant="body1"` → `p` with appropriate classes
- `Typography color="text.secondary"` → `p` with `text-muted-foreground`

#### Form Components
- `TextField` → `Input` from `@/components/ui/input` + `Label` from `@/components/ui/label`
- `Select/MenuItem` → `Select` components from `@/components/ui/select`
- `FormControl/InputLabel` → Use shadcn Select with built-in label
- `Switch` → `Switch` from `@/components/ui/switch`
- `FormControlLabel` → `div` with `Label` component

#### Feedback Components
- `Alert` → `Alert` from `@/components/ui/alert`
- `CircularProgress` → `Loader2` from `lucide-react` with `animate-spin`
- `Chip` → `Badge` from `@/components/ui/badge`

#### Navigation & Actions
- `Button` → `Button` from `@/components/ui/button`
- `IconButton` → `Button` with `variant="ghost"` and `size="icon"`
- `Tooltip` → `Tooltip` components from `@/components/ui/tooltip`

#### Data Display
- `Table` components → `Table` components from `@/components/ui/table`
- `Card/CardContent` → `Card/CardHeader/CardTitle/CardContent` from `@/components/ui/card`
- `List/ListItem` → `ul/li` with Tailwind classes

#### Dialogs
- `Dialog` → `Dialog` components from `@/components/ui/dialog`
- `DialogTitle` → `DialogTitle` from shadcn
- `DialogContent` → `DialogContent` from shadcn
- `DialogActions` → `DialogFooter` from shadcn

### Icon Migration (Material UI Icons → lucide-react)

#### Common Icons
- `Add` → `Plus`
- `Edit` → `Pencil` or `Edit`
- `Delete` → `Trash2`
- `Close` → `X`
- `Check` → `Check`
- `Search` → `Search`
- `Visibility` → `Eye`
- `Business` → `Building2`
- `School` → `GraduationCap`
- `Person` → `User` or `Users`
- `Email` → `Mail`
- `MeetingRoom` → `DoorOpen`
- `CalendarMonth` → `Calendar`
- `DateRange` → `Calendar`
- `PlayArrow` → `Play`
- `Save` → `Save`
- `Download` → `Download`
- `Print` → `Printer`
- `Refresh` → `RefreshCw`
- `History` → `History`
- `Warning` → `AlertTriangle`
- `Info` → `Info`

### Tailwind Class Patterns

#### Spacing
- `sx={{ mb: 3 }}` → `className="mb-3"`
- `sx={{ mt: 1 }}` → `className="mt-1"`
- `sx={{ p: 2 }}` → `className="p-2"`
- `gap={2}` → `className="gap-2"`

#### Flexbox
- `display="flex"` → `className="flex"`
- `alignItems="center"` → `className="items-center"`
- `justifyContent="space-between"` → `className="justify-between"`
- `flexDirection="column"` → `className="flex-col"`

#### Grid
- `Grid container spacing={2}` → `className="grid gap-2"`
- `Grid item xs={12} sm={6}` → Use appropriate grid-cols classes

#### Colors
- `color="primary"` → `className="text-primary"`
- `color="text.secondary"` → `className="text-muted-foreground"`
- `bgcolor="background.default"` → `className="bg-background"`

#### Sizing
- `fullWidth` → `className="w-full"`
- `minHeight="200px"` → `className="min-h-[200px]"`

## Files Requiring Migration

### Department Components
- `/home/user/icrogen/client/src/pages/Departments/DepartmentList.tsx`
- `/home/user/icrogen/client/src/pages/Departments/DepartmentFormDialog.tsx`

### Programme Components
- `/home/user/icrogen/client/src/pages/Programmes/ProgrammeList.tsx`
- `/home/user/icrogen/client/src/pages/Programmes/ProgrammeFormDialog.tsx`

### Teacher Components
- `/home/user/icrogen/client/src/pages/Teachers/TeacherList.tsx`
- `/home/user/icrogen/client/src/pages/Teachers/TeacherFormDialog.tsx`

### Subject Components
- `/home/user/icrogen/client/src/pages/Subjects/SubjectList.tsx`
- `/home/user/icrogen/client/src/pages/Subjects/SubjectFormDialog.tsx`

### Room Components
- `/home/user/icrogen/client/src/pages/Rooms/RoomList.tsx`
- `/home/user/icrogen/client/src/pages/Rooms/RoomFormDialog.tsx`

### Session Components
- `/home/user/icrogen/client/src/pages/Sessions/SessionList.tsx`
- `/home/user/icrogen/client/src/pages/Sessions/SessionFormDialog.tsx`

### SemesterOffering Components
- `/home/user/icrogen/client/src/pages/SemesterOfferings/SemesterOfferingList.tsx`
- `/home/user/icrogen/client/src/pages/SemesterOfferings/SemesterOfferingFormDialog.tsx`
- `/home/user/icrogen/client/src/pages/SemesterOfferings/CourseOfferingDialog.tsx`

### Routine Components
- `/home/user/icrogen/client/src/pages/Routines/RoutineGenerator.tsx`

## Special Cases

### DatePicker (SessionFormDialog.tsx)
The MUI DatePicker component needs special handling. You have two options:
1. Keep using MUI DatePicker with LocalizationProvider (works alongside shadcn)
2. Use a shadcn-compatible date picker like react-day-picker

### Avatar Component
- Material UI `Avatar` → Use `div` with rounded styling or create custom Avatar component
- Example: `<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">`

### Accordion Component (RoutineGenerator.tsx)
- MUI `Accordion` → `Collapsible` from `@/components/ui/collapsible` or create custom accordion

### Tabs Component (RoutineGenerator.tsx)
- MUI `Tabs/Tab` → `Tabs` from `@/components/ui/tabs`

### Stepper Component (RoutineGenerator.tsx)
- MUI `Stepper/Step/StepLabel` → Create custom stepper or use a library compatible with shadcn

## Testing Checklist

After migration, test each component for:
1. Visual appearance matches original
2. All interactive elements work correctly
3. Form validation still functions
4. Dialogs open and close properly
5. Icons display correctly
6. Responsive behavior maintained
7. Dark mode compatibility (if applicable)
8. Accessibility features preserved

## Notes

- Remove all `@mui/material` imports
- Remove all `@mui/icons-material` imports
- Ensure `lucide-react` is installed
- Ensure all shadcn UI components are installed in `/home/user/icrogen/client/src/components/ui/`
- Use `cn()` utility for conditional className joining
- Maintain TypeScript types and interfaces
- Keep the same component export structure
