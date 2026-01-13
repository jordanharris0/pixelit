# Pixelit MVP Roadmap
**Goal:** Portfolio-ready pixel art editor with animation in 8-10 weeks

---

## 🎯 MVP Scope

### ✅ INCLUDE (Must-Have)
- User authentication (register/login)
- Pixel canvas editor (16x16, 32x32, 64x64)
- Drawing tools (pencil, eraser, fill, eyedropper)
- Color picker + palette
- Undo/Redo
- Frame-by-frame animation
- Timeline UI
- Animation playback
- Export as PNG/GIF/Sprite Sheet
- Save/Load projects
- Public gallery (view only)
- Basic search/filter

### ❌ EXCLUDE (Post-MVP)
- Collaboration features
- Likes/Comments/Bookmarks
- Notifications
- Template layers
- Reporting system
- Admin panel
- User profiles (beyond auth)
- Version history
- Download tracking
- MP4 export

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

#### Week 3: Basic Canvas
**Priority:** CRITICAL - Everything depends on this

- [ ] Set up frontend (React + Vite if not on separate branch)
- [ ] Install canvas library (Konva.js recommended)
- [ ] Implement pixel grid renderer
  - [ ] Support 16x16, 32x32, 64x64 canvas sizes
  - [ ] Pixel grid with borders
  - [ ] Render saved pixel data
- [ ] Basic mouse interaction
  - [ ] Click to draw single pixel
  - [ ] Mouse down + drag to draw continuously
  - [ ] Color selection
- [ ] Color picker component
  - [ ] RGB/HSV picker
  - [ ] Recent colors palette
  - [ ] Predefined color palettes
- [ ] Toolbar UI
  - [ ] Pencil tool (default)
  - [ ] Eraser tool
  - [ ] Clear canvas button

**API Needs:**
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `GET /api/projects/:id` - Get project data

#### Week 4: Essential Tools
- [ ] Fill bucket tool (flood fill algorithm)
- [ ] Eyedropper tool (color picker from canvas)
- [ ] Pan canvas (spacebar + drag)
- [ ] Zoom controls (zoom in/out/reset)
- [ ] Grid toggle (show/hide pixel borders)
- [ ] Undo/Redo implementation
  - [ ] History stack (limit to 50 states)
  - [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] Canvas resize/scale options
- [ ] Background transparency toggle

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

#### Week 6: Frame Management
- [ ] Frame timeline UI (horizontal strip at bottom)
- [ ] Frame operations
  - [ ] Add new frame (blank or duplicate current)
  - [ ] Delete frame
  - [ ] Duplicate frame
  - [ ] Reorder frames (drag-and-drop)
- [ ] Frame navigation
  - [ ] Previous/Next frame buttons
  - [ ] Click frame to jump to it
  - [ ] Keyboard shortcuts (PageUp/PageDown)
- [ ] Frame thumbnails
  - [ ] Render canvas to small preview
  - [ ] Show frame number
  - [ ] Highlight active frame
- [ ] Canvas state per frame
  - [ ] Store separate pixel data per frame
  - [ ] Smoothly switch between frames

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

### Canvas Editor Layout
```
┌─────────────────────────────────────────────────┐
│ Header: [Logo] [Project Title] [Save] [Export] │
├──────────┬──────────────────────┬───────────────┤
│ Toolbar  │                      │ Color Picker  │
│          │                      │               │
│ [Pencil] │                      │  [Current]    │
│ [Eraser] │     CANVAS GRID      │  [Palette]    │
│ [Fill]   │                      │  [Recent]     │
│ [Picker] │                      │               │
│ [Pan]    │                      │               │
│          │                      │               │
│ [Undo]   │                      │ Settings      │
│ [Redo]   │                      │ - Grid: [x]   │
│          │                      │ - Size: 32x32 │
├──────────┴──────────────────────┴───────────────┤
│ Timeline: [+] [Frame 1] [Frame 2] [▶ Play]     │
└─────────────────────────────────────────────────┘
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

After you land a job, consider adding:

1. **Collaboration** (your unique feature!)
   - Real-time multi-user editing
   - WebSocket integration
   - Presence indicators
   - Permission system

2. **Social Features**
   - Likes, comments, bookmarks
   - User profiles
   - Follow system
   - Activity feed

3. **Advanced Tools**
   - Layers system
   - Template layers with transforms
   - Selection tools
   - Copy/paste between frames
   - Symmetry mode

4. **Premium Features**
   - Higher resolution exports
   - MP4 video export
   - Private projects
   - More storage

5. **Community**
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
