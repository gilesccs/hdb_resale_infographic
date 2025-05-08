# Frontend Filter Bar Instructions

## Filters Available

- **Flat Type**: Dropdown to select HDB flat type (ALL, 1 ROOM, 2 ROOM, etc.)
- **Lease Years**: Min/Max sliders for remaining lease years
- **Floor Area**: Min/Max number inputs for floor area in square meters (m²)
- **Storey Range**: Min/Max number inputs for storey (floor) range

## UI/UX
- All filters are presented in a seamless, modern, single-row bar (on desktop; stacked on mobile)
- Advanced filters (Lease Years, Floor Area, Storey Range) are shown when "Advanced Filters" is toggled
- All filter controls use shadcn/ui and Tailwind for a clean, glassmorphic look
- All text uses PT Root UI font

## Expected Behavior
- Changing any filter updates the map and info panel accordingly
- Floor Area and Storey Range inputs are validated so min ≤ max
- Reset button resets all filters to their default values 