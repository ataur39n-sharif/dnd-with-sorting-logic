# 🎯 Next.js Drag & Drop Task Manager

A modern, responsive task management application built with Next.js 15, featuring smooth drag-and-drop functionality for organizing action lists and items with advanced sparse ranking algorithms.

## ✨ Features

### 🎪 Drag & Drop Functionality
- **Smooth List Reordering**: Drag and drop action lists to reorganize them
- **Item Management**: Reorder items within lists with intuitive drag-and-drop
- **Visual Feedback**: Enhanced drag effects with colored borders and smooth animations
- **Optimized Performance**: 8px movement constraint for better drag activation

### 📋 Task Management
- **Action Lists**: Create, edit, delete, and reorder lists
- **Action Items**: Add items with titles and descriptions
- **Real-time Updates**: Immediate UI updates with server synchronization
- **Persistent Storage**: Cookie-based local storage with server backup

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Clean Interface**: Modern design with Tailwind CSS
- **Interactive Components**: Built with Radix UI primitives
- **Toast Notifications**: Real-time feedback for all operations

## 🚀 Recent Improvements

### Fixed Drag & Drop Issues (Latest Update)
- ✅ **Corrected Position Calculations**: Fixed `beforeId`/`afterId` calculation logic using `arrayMove`
- ✅ **Eliminated Race Conditions**: Removed conflicting optimistic updates
- ✅ **Enhanced Visual Experience**: Improved drag sensors and visual feedback
- ✅ **Better Error Handling**: Added comprehensive logging and error recovery
- ✅ **Accurate Reordering**: Both action lists and items now reorder correctly

### Technical Improvements
- **Sparse Ranking Algorithm**: Efficient ordering system that minimizes database updates
- **Optimistic UI Updates**: Immediate visual feedback with server validation
- **Enhanced Drag Sensors**: Improved touch and mouse interaction handling
- **Data Consistency**: Proper sorting by `orderRank` ensures UI accuracy

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Drag & Drop**: @dnd-kit (Core, Sortable, Utilities)
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Validation**: Zod
- **State Management**: React hooks with cookie persistence

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ataur39n-sharif/dnd-with-sorting-logic.git
   cd dnd-with-sorting-logic
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── db/           # Database operations
│   │   ├── items/        # Item CRUD operations
│   │   └── lists/        # List CRUD operations
│   ├── globals.css       # Global styles
│   └── page.tsx          # Main page component
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── DashboardLayout.tsx
│   ├── DraggableItemsPanel.tsx
│   └── DraggableListsPanel.tsx
├── hooks/                 # Custom React hooks
│   └── useLocalDB.ts     # Local storage management
└── lib/                   # Utility functions
    ├── ranking.ts        # Sparse ranking algorithms
    ├── types.ts          # TypeScript definitions
    └── utils.ts          # Helper utilities
```

## 🎮 Usage

### Creating Lists and Items
1. **Add a List**: Click "Add List" button and enter a title
2. **Select a List**: Click on any list to view its items
3. **Add Items**: Click "Add Item" to create new tasks with titles and descriptions
4. **Edit/Delete**: Use the dropdown menu on each item for editing or deletion

### Drag & Drop Operations
1. **Reorder Lists**: Drag any list up or down to change its position
2. **Reorder Items**: Drag items within a list to reorganize them
3. **Visual Feedback**: See real-time visual feedback during drag operations
4. **Auto-Save**: Changes are automatically saved to the server

## 🔧 API Endpoints

- `GET /api/db` - Fetch all lists and items
- `POST /api/lists` - Create a new list
- `PATCH /api/lists/[id]` - Update list details
- `PATCH /api/lists/[id]/move` - Reorder lists
- `DELETE /api/lists/[id]` - Delete a list
- `POST /api/items` - Create a new item
- `PATCH /api/items/[id]` - Update item details
- `PATCH /api/items/[id]/move` - Reorder items
- `DELETE /api/items/[id]` - Delete an item

## 🔧 Sparse Ranking Algorithm & Reordering Logic

The application uses a sophisticated sparse ranking system for efficient drag-and-drop reordering. Here's how it works:

### 📊 **Core Ranking System**

**Initial Ranks**: Items start with sparse ranks (1024, 2048, 3072...) to allow insertions
```typescript
// From src/lib/ranking.ts
export const DEFAULT_STEP = 1024;

export function initialRanks(n: number, step = DEFAULT_STEP): number[] {
  return Array.from({ length: n }, (_, i) => (i + 1) * step);
}
```

**Mid-Point Calculation**: New positions use the midpoint between neighbors
```typescript
export function midRank(left?: number | null, right?: number | null): number {
  if (left == null && right == null) return step;        // First item
  if (left == null) return Math.floor((right! - 1) / 2); // Insert at head
  if (right == null) return left + step;                 // Insert at tail
  const mid = Math.floor((left + right) / 2);
  return mid > left && mid < right ? mid : Number.NaN;   // NaN = needs reindex
}
```

### 🎯 **Client-Side Reordering Logic**

**1. Drag Detection**: When a drag operation ends, both `DraggableListsPanel` and `DraggableItemsPanel` use identical logic:

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (over && active.id !== over.id) {
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
```

**2. Array Reordering**: Uses `@dnd-kit/sortable`'s `arrayMove` for accurate positioning:
```typescript
// Use arrayMove to get the correct final order
const reorderedItems = arrayMove(items, oldIndex, newIndex);

// Find the new position of the moved item
const finalIndex = reorderedItems.findIndex((item) => item.id === active.id);
```

**3. Neighbor Calculation**: Determines `beforeId` and `afterId` from final positions:
```typescript
let beforeId: string | undefined;
let afterId: string | undefined;

// Get neighbors from the final order
if (finalIndex > 0) {
  beforeId = reorderedItems[finalIndex - 1].id;
}
if (finalIndex < reorderedItems.length - 1) {
  afterId = reorderedItems[finalIndex + 1].id;
}
```

### 🚀 **Server-Side Processing**

**1. API Endpoints**: 
- Lists: `PATCH /api/lists/{id}/move`
- Items: `PATCH /api/items/{id}/move`

**2. Rank Calculation**: Server calculates new `orderRank` using sparse ranking:
```typescript
const { leftRank, rightRank } = await getNeighbors({
  collection: 'lists',
  beforeId: validatedData.beforeId,
  afterId: validatedData.afterId
});

let newRank = midRank(leftRank, rightRank);
```

**3. Automatic Reindexing**: When ranks get too close, system reindexes:
```typescript
if (Number.isNaN(newRank)) {
  // Reindex all items with proper spacing
  const sortedItems = db.items.sort((a, b) => a.orderRank - b.orderRank);
  reindexCollection(sortedItems, DEFAULT_STEP);
  
  // Recalculate with new spacing
  newRank = midRank(newLeftRank, newRightRank);
}
```

### 🔄 **Data Flow & State Management**

**1. Optimistic Updates**: UI updates immediately for smooth UX
**2. Server Sync**: API call updates server-side ranks
**3. Data Refresh**: `onDataRefresh()` reloads data from server
**4. Consistent Sorting**: Components sort by `orderRank` for consistent display

### 🎪 **Why This Approach Works**

- **Efficient**: O(1) insertions without shifting all items
- **Scalable**: Handles thousands of items without performance issues  
- **Reliable**: Automatic reindexing prevents rank collisions
- **Smooth UX**: Optimistic updates provide immediate feedback
- **Consistent**: Server-side validation ensures data integrity

## 🎨 Styling & Theming

- **Tailwind CSS 4**: Latest version with enhanced features
- **Responsive Design**: Mobile-first approach
- **Custom Components**: Consistent design system
- **Animations**: Smooth transitions and hover effects

## 🚀 Deployment

The app is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service.

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **@dnd-kit** - Excellent drag and drop library
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Next.js Team** - Amazing React framework

---

**Built with ❤️ using Next.js 15 and modern web technologies**
