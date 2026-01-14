# Pixelit MVP Roadmap
**Goal:** Portfolio-ready pixel art editor with animation in 8-10 weeks

---

## 🎯 MVP Scope

### ✅ INCLUDE (Must-Have Frontend)
- User authentication (register/login)
- Pixel canvas editor (16x16, 32x32, 64x64, 100x100)
- Drawing tools (pencil, eraser, fill, eyedropper, line, shapes)
- Mirror mode (X/Y symmetry)
- Color picker + palette
- Undo/Redo
- Layer system (add, delete, opacity, visibility)
- Frame-by-frame animation
- Timeline UI
- Animation playback with onion skinning
- Export as PNG/GIF/Sprite Sheet
- Save/Load projects
- Public gallery (view only)
- Basic search/filter
- Preview panel & navigation mini-map

### ⏸️ BACKEND READY - NO UI YET (Post-MVP v2.0)
**Note:** All these features have complete backend APIs, just no frontend UI in MVP
- ✅ **Likes/Comments** - Routes exist in `likeComment.js`
- ✅ **Bookmarks** - Routes exist in `bookmarks.js`
- ✅ **Collaboration** - Routes exist in `collaboration.js`
- ✅ **Notifications** - Routes exist in `notifications.js`
- ✅ **Reports/Admin** - Routes exist in `admin.js`
- ✅ **Download tracking** - Routes exist in `download.js`
- ✅ **Template layers** - Routes exist in `templates.js`
- ✅ **User analytics** - Routes exist in `authAccount.js`

### ❌ NOT BUILT YET (Future)
- Version history UI
- MP4 export
- Advanced filters/effects
- Selection tools (lasso, magic wand)
- Custom brushes
- Blend modes

---

## 📅 Phase Breakdown

### **Phase 1: Setup & Planning** (Week 1-2) - *WORK LAPTOP*
**Status:** ⏸️ Ready to start

#### Week 1: Documentation & Research
- [ ] Update all dependencies (`npm install` at home)
- [ ] Document full feature vision
- [ ] Create focused MVP feature list ✅
- [ ] Research canvas libraries (recommendation: Konva.js or Fabric.js)
- [ ] Sketch UI wireframes for canvas editor
- [ ] Plan React component architecture

#### Week 2: API Planning
- [ ] Write OpenAPI/Swagger docs for MVP endpoints
- [ ] Design frontend component hierarchy
- [ ] Create database seed data plan
- [ ] Set up GitHub Projects or Trello board
- [ ] Review and clean up existing API routes

**Deliverables:** 
- Clear specification document
- Component architecture diagram
- API documentation
- Updated dependencies ready to install

---

### **Phase 2: Core Canvas Editor** (Week 3-5) - *HOME MACHINE*
**Status:** 🔴 Not Started

#### Week 3: Basic Canvas (Pixilart-Style)
**Priority:** CRITICAL - Everything depends on this

- [ ] Set up frontend (React + Vite if not on separate branch)
- [ ] Install canvas library (Konva.js recommended for pixel control)
- [ ] Implement pixel grid renderer
  - [ ] Support 16x16, 32x32, 64x64, 100x100 canvas sizes
  - [ ] Pixel grid with visible borders
  - [ ] Render saved pixel data
  - [ ] Show mouse coordinates (X:0 Y:0)
  - [ ] Display canvas size info
- [ ] Basic mouse interaction
  - [ ] Click to draw single pixel
  - [ ] Mouse down + drag to draw continuously
  - [ ] **Pixel Perfect mode** (smooth lines between pixels)
  - [ ] **Right-click erase** functionality
  - [ ] Track mouse position in real-time
- [ ] Color picker component (RIGHT SIDEBAR)
  - [ ] Current color display (large swatch)
  - [ ] RGB/HSV color picker
  - [ ] Color palette (predefined colors)
  - [ ] Recent colors history
  - [ ] Hex color input
- [ ] Toolbar UI (LEFT SIDEBAR)
  - [ ] Pencil tool (default)
  - [ ] Eraser tool
  - [ ] **Pixel size selector** (1-10px brush)
  - [ ] Clear canvas button

**API Needs:**
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `GET /api/projects/:id` - Get project data

#### Week 4: Essential Tools (Pixilart Features)
- [ ] **Fill bucket tool** (flood fill algorithm)
- [ ] **Eyedropper tool** (color picker from canvas)
- [ ] **Line tool** (draw straight lines)
- [ ] **Shape tools** (rectangle, circle, filled/outlined)
- [ ] **Mirror mode** (Mirror X and Mirror Y toggles)
  - [ ] Draw symmetrically on X-axis
  - [ ] Draw symmetrically on Y-axis
  - [ ] Both mirrors simultaneously
- [ ] **Pan canvas** (hand tool or spacebar + drag)
- [ ] **Zoom controls** 
  - [ ] Zoom slider (10% - 1600%)
  - [ ] Zoom in/out buttons
  - [ ] Fit to screen
  - [ ] 100% reset
- [ ] **Grid toggle** (show/hide pixel borders)
- [ ] **Undo/Redo implementation**
  - [ ] History stack (limit to 50 states)
  - [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - [ ] Visual indicators for undo/redo availability
- [ ] **Canvas resize/scale options**
- [ ] **Layer system** (RIGHT SIDEBAR)
  - [ ] Add/delete layers
  - [ ] Layer visibility toggle
  - [ ] Layer opacity slider (0-100%)
  - [ ] Reorder layers
  - [ ] Rename layers
- [ ] **Preview panel** (mini canvas showing full view)
- [ ] **Navigation mini-map** (shows viewport position on zoomed canvas)

**Testing:**
- [ ] Can draw complex pixel art
- [ ] Tools work reliably
- [ ] Undo/redo doesn't lose data

#### Week 5: Save/Load System
- [ ] Project metadata form (title, description)
- [ ] Save project to backend
  - [ ] Serialize canvas state to JSON
  - [ ] Handle authentication
  - [ ] Auto-save every 30 seconds
  - [ ] Save indicator (saving/saved)
- [ ] Load existing project
  - [ ] Restore canvas state from JSON
  - [ ] Load project metadata
- [ ] "My Projects" page
  - [ ] List user's projects
  - [ ] Thumbnail previews
  - [ ] Edit/Delete actions
- [ ] Project privacy toggle (public/private)

**API Routes:**
- ✅ Already exist in `/API/projects.js`
- [ ] Verify and test existing routes
- [ ] Add Zod validation schemas

**Deliverable:** Working solo pixel editor - **This alone is portfolio-worthy!**

---

### **Phase 3: Animation System** (Week 6-7) - *HOME MACHINE*
**Status:** 🔴 Not Started

#### Week 6: Frame Management (Pixilart GIF Frames)
- [ ] Frame timeline UI (horizontal strip at bottom - **Pixilart style**)
- [ ] Frame operations
  - [ ] **Add Frame** button
  - [ ] **Copy Frame** button (duplicate current frame)
  - [ ] Delete frame
  - [ ] Reorder frames (drag-and-drop)
- [ ] Frame navigation
  - [ ] Previous/Next frame buttons
  - [ ] Click frame thumbnail to jump to it
  - [ ] Keyboard shortcuts (PageUp/PageDown or Arrow keys)
- [ ] Frame thumbnails
  - [ ] Render canvas to small preview (64x64 thumbnails)
  - [ ] Show frame number
  - [ ] Highlight active frame with border
  - [ ] Frame duration indicator (for GIF)
- [ ] **Tile Mode** toggle (see pattern repeat)
- [ ] Canvas state per frame
  - [ ] Store separate pixel data per frame
  - [ ] Store layers per frame
  - [ ] Smoothly switch between frames without lag

**Data Structure:**
```json
{
  "projectId": "uuid",
  "frames": [
    {
      "frameNumber": 0,
      "pixels": [[...]]
    }
  ]
}
```

#### Week 7: Playback System
- [ ] Animation player controls
  - [ ] Play/Pause button
  - [ ] Stop button (reset to frame 0)
  - [ ] Loop toggle
  - [ ] FPS selector (6, 12, 24, 30 fps)
- [ ] Playback engine
  - [ ] Render frames at specified FPS
  - [ ] Loop or stop at end
  - [ ] Smooth frame transitions
- [ ] Onion skinning
  - [ ] Show previous frame as ghost overlay
  - [ ] Adjustable opacity
  - [ ] Toggle on/off
- [ ] Frame range selection (play subset of frames)

**API Updates:**
- [ ] Update projects API to handle multiple frames
- [ ] Use existing `CanvasData` model for frames
- [ ] Link to `Animation` model

**Deliverable:** Working frame-by-frame animation tool

---

### **Phase 4: Export & Gallery** (Week 8-9) - *HOME MACHINE*
**Status:** 🔴 Not Started

#### Week 8: Export Features
- [ ] PNG export (single frame)
  - [ ] Export current frame
  - [ ] Select canvas size multiplier (1x, 2x, 4x, 8x)
  - [ ] Download as PNG file
- [ ] Sprite sheet export
  - [ ] Arrange frames in grid
  - [ ] Configurable columns
  - [ ] Include frame numbers (optional)
  - [ ] Download as PNG
- [ ] GIF export
  - [ ] Use `gif.js` library
  - [ ] Respect FPS setting
  - [ ] Quality settings
  - [ ] Progress indicator (GIF encoding is slow)
  - [ ] Download as GIF
- [ ] JSON export/import
  - [ ] Export project as .json file
  - [ ] Import .json to restore project
  - [ ] Useful for backups/sharing

**Libraries to Add:**
```json
{
  "gif.js": "^0.2.0",
  "file-saver": "^2.0.5"
}
```

#### Week 9: Public Gallery
- [ ] Gallery page (`/discover` or `/gallery`)
  - [ ] Grid of public projects
  - [ ] Thumbnail images
  - [ ] Project title + author
  - [ ] Click to view details
- [ ] Project detail page (read-only)
  - [ ] View canvas/animation
  - [ ] Play animation
  - [ ] Project metadata
  - [ ] Cannot edit (unless owner)
- [ ] Search functionality
  - [ ] Search by title/description
  - [ ] Filter by tags
  - [ ] Sort by date/popularity (later)
- [ ] Responsive design polish
  - [ ] Mobile-friendly layout
  - [ ] Touch support for canvas (if time)

**API Routes:**
- ✅ `/API/discover.js` already exists
- [ ] Verify and enhance existing routes

**Deliverable:** Complete, shareable application

---

### **Phase 5: Deploy & Polish** (Week 10) - *HOME MACHINE*
**Status:** 🔴 Not Started

#### Deployment
- [ ] Backend deployment
  - [ ] Choose platform (Railway, Render, Fly.io)
  - [ ] Set up PostgreSQL database
  - [ ] Configure environment variables
  - [ ] Deploy API
  - [ ] Test endpoints
- [ ] Frontend deployment
  - [ ] Build production bundle
  - [ ] Deploy to Vercel or Netlify
  - [ ] Configure API URLs
  - [ ] Test full application
- [ ] Database seeding
  - [ ] Create impressive demo projects
  - [ ] Add sample user accounts
  - [ ] Seed with pixel art examples

#### Documentation
- [ ] Update README.md
  - [ ] Project description
  - [ ] Features list
  - [ ] Screenshots/GIFs
  - [ ] Tech stack
  - [ ] Setup instructions
  - [ ] Live demo link
- [ ] Record demo video
  - [ ] Show creating pixel art
  - [ ] Demonstrate animation
  - [ ] Show export features
  - [ ] Browse gallery
  - [ ] 2-3 minutes max
- [ ] Add to portfolio site
  - [ ] Project card with thumbnail
  - [ ] Link to live demo
  - [ ] Link to GitHub repo
  - [ ] Technology highlights

#### Polish
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design refinements
- [ ] Accessibility improvements

**Deliverable:** Live, deployed application ready to show employers

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Auth:** JWT (jsonwebtoken)
- **File Storage:** AWS S3
- **Caching:** Redis (Phase 2)
- **Validation:** Zod
- **Security:** bcrypt, express-rate-limit, CORS

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Canvas Library:** Konva.js or Fabric.js
- **GIF Export:** gif.js
- **File Download:** file-saver
- **State Management:** React Context (or Zustand if needed)

### DevOps
- **Backend Host:** Railway / Render / Fly.io
- **Frontend Host:** Vercel / Netlify
- **Database:** Managed PostgreSQL
- **Version Control:** Git / GitHub

---

## 📝 Key API Endpoints for MVP

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/user/:userId` - Get user's projects
- `GET /api/discover` - Get public projects (gallery)

### Canvas/Frames
- `POST /api/projects/:id/frames` - Add frame
- `PUT /api/projects/:id/frames/:frameId` - Update frame
- `DELETE /api/projects/:id/frames/:frameId` - Delete frame
- `GET /api/projects/:id/frames` - Get all frames

---

## 🎨 UI/UX Considerations

### Canvas Editor Layout (Pixilart-Style)
```
┌──────────────────────────────────────────────────────────────────┐
│ Header: [Logo] [Save] [File] [Settings]            [User Menu]  │
├────────┬──────────────────────────────────────┬──────────────────┤
│ TOOLS  │                                      │ LAYERS           │
│        │                                      │ - Layer 1 (100%) │
│ Pencil │          CANVAS GRID                 │ [+] Add Layer    │
│ Eraser │     (with pixel coordinates)         │                  │
│ Fill   │                                      │ PREVIEW          │
│ Picker │     Mouse: X:0 Y:0                   │ [Mini canvas]    │
│ Line   │     Canvas: 100x100                  │                  │
│ Shape  │                                      │ TOOL OPTIONS     │
│        │                                      │ - Pixel Size: 1  │
│ Mirror │                                      │ - Stabilizer: 0  │
│ [X][Y] │                                      │ - Pixel Perfect  │
│        │                                      │                  │
│ [Undo] │                                      │ COLORS           │
│ [Redo] │                                      │ ████ Current     │
│        │                                      │ Palette: [....] │
│ Grid ☑ │                                      │                  │
│ Zoom   │                                      │ NAVIGATION       │
│ [━━━]  │                                      │ [Mini map]       │
│        │                                      │ Zoom: 100%       │
├────────┴──────────────────────────────────────┴──────────────────┤
│ GIF FRAMES: [+] [Copy] [▶ Play] [Tile Mode]                     │
│ Frames: [1] [2] [3] [4] ...                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Design Principles
- **Clean interface** - Don't clutter, pixel art needs focus
- **Keyboard shortcuts** - Power users love them
- **Visual feedback** - Show what tool is active
- **Auto-save indicator** - Users need confidence
- **Mobile consideration** - Responsive, but desktop-first

---

## 🚨 Common Pitfalls to Avoid

1. **Premature optimization** - Get it working first
2. **Scope creep** - Resist adding "just one more feature"
3. **Perfect code syndrome** - MVP doesn't need perfection
4. **Ignoring user testing** - Get feedback early
5. **Over-engineering** - Simple solutions often work best
6. **No auto-save** - Users will lose work and blame you
7. **Poor error handling** - Fails silently = frustrated users
8. **Skipping deployment** - "Almost done" projects don't count

---

## 💡 MVP Success Criteria

### Technical
- ✅ Can create pixel art from scratch
- ✅ Can create multi-frame animations
- ✅ Can export PNG/GIF/Sprite Sheet
- ✅ Projects save reliably
- ✅ Gallery displays public projects
- ✅ Responsive on desktop
- ✅ Deployed and accessible via URL

### Portfolio Value
- ✅ Live demo link works
- ✅ Code is clean and documented
- ✅ Shows full-stack skills
- ✅ Demonstrates complex UI/UX
- ✅ Has visual appeal
- ✅ README explains features well

### User Experience
- ✅ New user can create art in < 2 minutes
- ✅ No major bugs in core flows
- ✅ Feels responsive (< 100ms interactions)
- ✅ Intuitive without tutorial

---

## 📦 Post-MVP Features (v2.0)

**All of these have complete backend APIs already built!** Just add frontend UI when ready.

### Social Features (Backend: ✅ Ready)
1. **Likes & Comments** - `likeComment.js`
   - Like button on projects
   - Comment section
   - Comment editing/deletion
   - Like counter display

2. **Bookmarks** - `bookmarks.js`
   - Bookmark button
   - "My Bookmarks" page
   - Bookmark counter

3. **Notifications** - `notifications.js`
   - Notification bell icon
   - Notification panel
   - Mark as read
   - Real-time updates (add Socket.io)

### Community Features (Backend: ✅ Ready)
4. **Collaboration** - `collaboration.js`
   - Invite collaborators
   - Role management (Owner/Editor/Viewer)
   - Real-time editing (add WebSockets)
   - Presence indicators
   - Permission system

5. **User Profiles** - `authAccount.js` & `users.js`
   - Profile pages
   - User activity feed
   - Follow system
   - User analytics/stats

### Moderation (Backend: ✅ Ready)
6. **Reporting System** - `admin.js`
   - Report button
   - Report reasons
   - Admin review panel

7. **Admin Panel** - `admin.js`
   - Activity logs
   - User management
   - Content moderation
   - Analytics dashboard

### Advanced Creative Tools (Backend: ✅ Ready)
8. **Template Layers** - `templates.js`
   - Import reference images
   - Opacity, position, scale controls
   - Rotation and flip
   - Layer locking
   - Predefined template library

9. **Download Tracking** - `download.js`
   - Download history
   - Download analytics
   - Most downloaded projects

### Future Features (Not Built Yet)
10. **Premium Features**
    - Higher resolution exports
    - MP4 video export
    - Private projects
    - More storage
    - No watermarks

11. **Advanced Tools**
    - Layers system (already have basic)
    - Selection tools
    - Copy/paste between frames
    - Symmetry mode
    - Custom brushes
    - Filters and effects

12. **Community**
    - Featured projects
    - Contests
    - Tutorials
    - Asset marketplace

---

## 🎯 Next Actions (Work Laptop)

**Right now, you can:**

1. ✅ Review this roadmap
2. [ ] Sketch UI wireframes on paper/Figma
3. [ ] Research Konva.js vs Fabric.js (for canvas)
4. [ ] Read Konva.js documentation
5. [ ] Plan React component structure
6. [ ] Write pseudo-code for core features
7. [ ] Review existing API routes (`/API/*.js`)
8. [ ] Update README with current vision
9. [ ] Set up GitHub Projects board
10. [ ] Plan database seed data

**When you get home:**
1. `npm install` (backend and frontend)
2. `npx prisma migrate dev` (update to Prisma 7)
3. Start Phase 2: Core Canvas Editor

---

## 🔗 Useful Resources

### Canvas Libraries
- **Konva.js** - https://konvajs.org/ (Good for pixel-perfect control)
- **Fabric.js** - http://fabricjs.com/ (More features, slightly heavier)
- **Raw Canvas API** - MDN docs (Most control, most work)

### Animation/Export
- **gif.js** - https://github.com/jnordberg/gif.js (GIF encoding)
- **file-saver** - https://github.com/eligrey/FileSaver.js (Download files)

### Learning Resources
- Prisma 7 Migration Guide
- React + Canvas best practices
- Pixel art flood fill algorithms
- Onion skinning implementation

---

## 💪 Motivation

**Remember:**
- You already have 60-70% of backend done
- Your database design is professional-grade
- This is more interesting than most portfolio projects
- Game dev companies will love this
- You have a clear path forward
- 10 weeks is achievable
- You're building something people can actually use

**You've got this!** 🚀

---

*Last Updated: January 13, 2026*
*Next Review: Start of Phase 2 (at home machine)*
