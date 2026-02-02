# Canvas Editor Technical Specification
**Reference:** Pixilart.com/draw interface

---

## 🎨 Core Canvas Features

### Canvas Grid System
- **Default sizes:** 16x16, 32x32, 64x64, 100x100 pixels
- **Custom size:** Allow user input (max 256x256 for performance)
- **Pixel borders:** Toggle-able grid lines (default: ON)
- **Background:** Transparent checkerboard pattern
- **Coordinates:** Display mouse position (X:0 Y:0) in real-time
- **Canvas info:** Show current canvas dimensions

### Drawing Engine
```javascript
// Core data structure
{
  canvasId: "uuid",
  width: 100,
  height: 100,
  pixels: [
    // 2D array of color values
    ["#FFFFFF", "#000000", ...],
    [...],
  ],
  layers: [
    {
      id: "layer-1",
      name: "Layer 1",
      visible: true,
      opacity: 100,
      pixels: [[...]]
    }
  ]
}
```

---

## 🛠️ Tool System

### 1. Pencil Tool
- **Function:** Draw pixels
- **Options:**
  - Pixel size: 1-10px (brush size)
  - Pixel Perfect mode: ON/OFF (smooth diagonal lines)
  - Stabilizer: 0-10 (line smoothing for shaky hands)
- **Interaction:**
  - Left-click/drag: Draw with primary color
  - Right-click/drag: Erase
- **Keyboard:** P or B

### 2. Eraser Tool
- **Function:** Remove pixels (make transparent)
- **Options:**
  - Eraser size: 1-10px
- **Interaction:**
  - Left-click/drag: Erase
- **Keyboard:** E

### 3. Fill Bucket
- **Function:** Flood fill connected pixels
- **Algorithm:** Stack-based flood fill
- **Tolerance:** 0-255 (for similar colors)
- **Keyboard:** G or F

### 4. Eyedropper
- **Function:** Pick color from canvas
- **Interaction:**
  - Click: Set as primary color
  - Right-click: Set as secondary color
- **Keyboard:** I or hold Alt while using other tools

### 5. Line Tool
- **Function:** Draw straight lines
- **Options:**
  - Line width: 1-10px
  - Pixel Perfect: ON/OFF
- **Interaction:**
  - Click start point, move, click end point
  - Preview line while moving
- **Keyboard:** L

### 6. Shape Tools
**Rectangle:**
- Filled or outlined
- Width control (1-10px for outline)
- Keyboard: R

**Circle/Ellipse:**
- Filled or outlined
- Width control
- Keyboard: C

### 7. Selection Tools (Phase 2)
- Rectangular selection
- Lasso selection
- Magic wand (select similar colors)
- Move, copy, paste selected area

---

## 🪞 Mirror Mode

### Mirror X (Horizontal)
- Toggle button in toolbar
- Draws symmetrically across vertical center axis
- Real-time preview of mirrored pixels
- Works with all drawing tools

### Mirror Y (Vertical)
- Toggle button in toolbar
- Draws symmetrically across horizontal center axis
- Works with all drawing tools

### Both Mirrors
- Can enable both X and Y simultaneously
- Creates 4-way symmetry
- Great for mandalas/patterns

**Implementation:**
```javascript
function drawWithMirror(x, y, color, mirrorX, mirrorY) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Original point
  setPixel(x, y, color);
  
  // Mirror X
  if (mirrorX) {
    const mirroredX = centerX + (centerX - x);
    setPixel(mirroredX, y, color);
  }
  
  // Mirror Y
  if (mirrorY) {
    const mirroredY = centerY + (centerY - y);
    setPixel(x, mirroredY, color);
  }
  
  // Both mirrors
  if (mirrorX && mirrorY) {
    const mirroredX = centerX + (centerX - x);
    const mirroredY = centerY + (centerY - y);
    setPixel(mirroredX, mirroredY, color);
  }
}
```

---

## 🎭 Layer System

### Layer Panel (Right Sidebar)
- **List of layers** (stacked vertically)
- **Current layer count:** Display "LAYERS (3)"
- **Layer controls:**
  - Visibility toggle (eye icon)
  - Opacity slider (0-100%)
  - Lock/unlock layer
  - Rename layer (double-click)
  - Delete layer
  - Duplicate layer
  - Merge down

### Layer Properties
```javascript
{
  id: "uuid",
  name: "Layer 1",
  visible: true,
  locked: false,
  opacity: 100,
  zIndex: 0,
  pixels: [[...]], // 2D array
  blendMode: "normal" // future feature
}
```

### Layer Operations
- **Add layer:** Create new transparent layer on top
- **Delete layer:** Cannot delete last layer
- **Reorder:** Drag-and-drop to change z-index
- **Merge:** Combine current layer with layer below
- **Flatten:** Merge all layers into one

---

## 🎨 Color System

### Color Panel (Right Sidebar)
**Current Color Display:**
- Large swatch showing active color
- Shows hex value
- Click to open full color picker

**Color Picker:**
- **HSV color space** (hue, saturation, value)
- **RGB sliders** (red, green, blue, alpha)
- **Hex input** (#RRGGBB or #RRGGBBAA)
- **Alpha slider** (0-255 opacity)

**Color Palette:**
- **Predefined palettes:**
  - Default (16 colors)
  - Grayscale
  - Retro gaming (NES, Game Boy, etc.)
  - Pastel
  - Material Design
  - User can create custom palettes
- **Recent colors:** Last 10-20 colors used
- **Save palette:** Export/import palette as JSON

---

## 🔍 Zoom & Navigation

### Zoom System
- **Zoom levels:** 10%, 25%, 50%, 100%, 200%, 400%, 800%, 1600%
- **Zoom controls:**
  - Slider in left sidebar
  - Zoom in button (+)
  - Zoom out button (-)
  - Fit to screen button
  - 100% (actual size) button
- **Zoom shortcuts:**
  - Ctrl + Mouse Wheel
  - Ctrl + Plus/Minus
  - Ctrl + 0 (reset to 100%)

### Navigation Mini-Map
- **Mini-map panel** (right sidebar, bottom)
- Shows full canvas in small view (100x100px box)
- Highlights current viewport area
- Click/drag to pan viewport
- Only visible when zoomed in

### Pan Tool
- **Hand tool** or Spacebar + drag
- Moves canvas viewport
- Works at any zoom level
- Cursor changes to hand icon

---

## 📐 Grid & Guidelines

### Pixel Grid
- **Toggle:** ON/OFF button in toolbar
- **Color:** Semi-transparent gray (#00000020)
- **Always visible at zoom > 400%**
- Helps with precise pixel placement

### Guidelines (Future)
- Horizontal and vertical guides
- Drag from rulers
- Snap to guidelines
- Show/hide all guides

---

## 🎬 Animation Frame System

### Frame Timeline (Bottom Panel)
**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ GIF FRAMES: [+ Add] [📋 Copy] [▶ Play] [⏸ Pause] [🔲 Tile]│
│                                                            │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│ │  1  │ │  2  │ │  3  │ │  4  │  ...                     │
│ │ ▓▓▓ │ │ ▓▓▓ │ │ ▓▓▓ │ │ ▓▓▓ │                          │
│ │ 100ms│ │ 100ms│ │ 100ms│ │ 100ms│                       │
│ └─────┘ └─────┘ └─────┘ └─────┘                          │
└────────────────────────────────────────────────────────────┘
```

### Frame Controls
- **Add Frame:** Create new blank frame
- **Copy Frame:** Duplicate current frame
- **Delete Frame:** Remove frame (min 1 frame)
- **Play/Pause:** Preview animation
- **Tile Mode:** Show 3x3 grid of canvas (see seamless patterns)

### Frame Properties
```javascript
{
  frameId: "uuid",
  frameNumber: 0,
  duration: 100, // milliseconds
  layers: [...], // layer data
  thumbnail: "data:image/png;base64..." // cached thumbnail
}
```

### Frame Operations
- **Reorder:** Drag-and-drop frames
- **Set duration:** Click duration to edit (per frame)
- **Frame range:** Select multiple frames (Shift+click)
- **Copy/Paste frames:** Between projects

---

## 🎥 Animation Playback

### Preview System
- **Play button:** Start/stop animation
- **FPS control:** 1, 6, 12, 24, 30, 60 fps
- **Loop toggle:** ON/OFF
- **Onion skin:**
  - Show previous frame as ghost overlay
  - Adjustable opacity (0-100%)
  - Previous and/or next frame
  - Color tint for direction (red=prev, blue=next)

### Export Settings
- **GIF Export:**
  - Frame rate control
  - Loop count (infinite or specific)
  - Color palette optimization
  - Dithering options
  - Quality/file size balance
  
- **Sprite Sheet:**
  - Grid layout (columns x rows)
  - Padding between frames
  - Include frame labels
  - Export as PNG

---

## ⚙️ Settings & Preferences

### Canvas Settings
- Default canvas size
- Default zoom level
- Grid color
- Background pattern (checkerboard, solid, custom)
- Auto-save interval (30s, 1m, 5m, off)

### Editor Preferences
- Theme (light/dark)
- UI scale (80%, 100%, 120%)
- Keyboard shortcuts (customizable)
- Show tooltips (ON/OFF)
- Confirm destructive actions (ON/OFF)

### Performance
- Max undo history (default: 50)
- Canvas size limit (default: 256x256)
- Layer limit (default: 20)
- Frame limit (default: 100)

---

## ⌨️ Keyboard Shortcuts

### Tools
- `P` or `B` - Pencil
- `E` - Eraser
- `G` or `F` - Fill bucket
- `I` - Eyedropper
- `L` - Line tool
- `R` - Rectangle
- `C` - Circle
- `H` - Hand/Pan tool
- `Z` - Zoom tool
- `Alt + Click` - Temporary eyedropper

### Canvas
- `Ctrl + Z` - Undo
- `Ctrl + Shift + Z` or `Ctrl + Y` - Redo
- `Ctrl + S` - Save
- `Ctrl + C` - Copy
- `Ctrl + V` - Paste
- `Ctrl + X` - Cut
- `Delete` - Clear selection
- `Ctrl + A` - Select all

### View
- `Ctrl + 0` - Zoom 100%
- `Ctrl + +` - Zoom in
- `Ctrl + -` - Zoom out
- `Ctrl + Wheel` - Zoom
- `Spacebar + Drag` - Pan
- `G` - Toggle grid

### Layers
- `Ctrl + Shift + N` - New layer
- `Ctrl + Shift + D` - Duplicate layer
- `Ctrl + E` - Merge down
- `Ctrl + Shift + E` - Flatten

### Frames
- `PageUp` / `Up Arrow` - Previous frame
- `PageDown` / `Down Arrow` - Next frame
- `Space` - Play/pause animation
- `Ctrl + Shift + F` - New frame
- `Ctrl + Alt + F` - Copy frame

### Mirror
- `M` - Toggle Mirror X
- `Shift + M` - Toggle Mirror Y

---

## 📊 UI Component Breakdown

### Main Layout Structure
```jsx
<App>
  <Header>
    <Logo />
    <ProjectTitle />
    <SaveButton />
    <FileMenu />
    <SettingsButton />
    <UserMenu />
  </Header>
  
  <MainEditor>
    <LeftSidebar>
      <ToolsPanel>
        <ToolButton tool="pencil" />
        <ToolButton tool="eraser" />
        <ToolButton tool="fill" />
        <ToolButton tool="eyedropper" />
        <ToolButton tool="line" />
        <ToolButton tool="rectangle" />
        <ToolButton tool="circle" />
        <Separator />
        <MirrorXToggle />
        <MirrorYToggle />
        <Separator />
        <UndoButton />
        <RedoButton />
        <Separator />
        <GridToggle />
        <ZoomSlider />
      </ToolsPanel>
    </LeftSidebar>
    
    <CanvasContainer>
      <CanvasInfo>
        Mouse: X:{x} Y:{y} | Canvas: {width}x{height}
      </CanvasInfo>
      <Canvas>
        {/* Konva.js Stage */}
        <Layer name="grid" />
        <Layer name="background" />
        {layers.map(layer => (
          <Layer key={layer.id} opacity={layer.opacity}>
            {/* Render pixels */}
          </Layer>
        ))}
        <Layer name="cursor" />
        <Layer name="preview" /> {/* Tool preview */}
      </Canvas>
    </CanvasContainer>
    
    <RightSidebar>
      <LayersPanel>
        <LayerList>
          {layers.map(layer => (
            <LayerItem
              key={layer.id}
              layer={layer}
              onVisibilityToggle={...}
              onOpacityChange={...}
              onRename={...}
              onDelete={...}
            />
          ))}
        </LayerList>
        <AddLayerButton />
      </LayersPanel>
      
      <PreviewPanel>
        <MiniCanvas /> {/* Full canvas preview */}
      </PreviewPanel>
      
      <ToolOptionsPanel>
        {/* Dynamic based on current tool */}
        <PixelSizeSlider />
        <StabilizerSlider />
        <PixelPerfectToggle />
      </ToolOptionsPanel>
      
      <ColorsPanel>
        <CurrentColorDisplay />
        <ColorPicker />
        <PaletteGrid />
        <RecentColors />
      </ColorsPanel>
      
      <NavigationPanel>
        <MiniMap />
        <ZoomPercentage />
      </NavigationPanel>
    </RightSidebar>
  </MainEditor>
  
  <BottomPanel>
    <FrameTimeline>
      <FrameControls>
        <AddFrameButton />
        <CopyFrameButton />
        <PlayButton />
        <TileModeToggle />
      </FrameControls>
      <FrameList>
        {frames.map(frame => (
          <FrameThumbnail
            key={frame.id}
            frame={frame}
            isActive={...}
            onClick={...}
            onDelete={...}
          />
        ))}
      </FrameList>
    </FrameTimeline>
  </BottomPanel>
</App>
```

---

## 🔧 Technical Implementation

### Recommended Tech Stack
- **Canvas Library:** Konva.js
  - Good for pixel-perfect control
  - Layer support built-in
  - Event handling
  - High performance
  
- **Alternative:** Fabric.js (more features, slightly heavier)

- **State Management:** 
  - React Context for UI state
  - Zustand for complex canvas state (easier than Redux)

### Core Canvas Component
```jsx
import { Stage, Layer, Rect } from 'react-konva';

const PixelCanvas = ({ width, height, pixels, layers, onPixelClick }) => {
  const PIXEL_SIZE = 10; // Adjustable based on zoom
  
  return (
    <Stage width={width * PIXEL_SIZE} height={height * PIXEL_SIZE}>
      {/* Grid layer */}
      <Layer>
        {Array.from({ length: width * height }).map((_, i) => {
          const x = i % width;
          const y = Math.floor(i / width);
          return (
            <Rect
              key={`grid-${i}`}
              x={x * PIXEL_SIZE}
              y={y * PIXEL_SIZE}
              width={PIXEL_SIZE}
              height={PIXEL_SIZE}
              stroke="#ccc"
              strokeWidth={0.5}
            />
          );
        })}
      </Layer>
      
      {/* Pixel layers */}
      {layers.map(layer => (
        <Layer key={layer.id} opacity={layer.opacity / 100}>
          {layer.pixels.flat().map((color, i) => {
            if (!color || color === 'transparent') return null;
            const x = i % width;
            const y = Math.floor(i / width);
            return (
              <Rect
                key={`${layer.id}-${i}`}
                x={x * PIXEL_SIZE}
                y={y * PIXEL_SIZE}
                width={PIXEL_SIZE}
                height={PIXEL_SIZE}
                fill={color}
                onClick={() => onPixelClick(x, y)}
              />
            );
          })}
        </Layer>
      ))}
    </Stage>
  );
};
```

### Performance Optimizations
1. **Virtualize frame thumbnails** - Only render visible frames
2. **Debounce auto-save** - Don't save on every stroke
3. **Canvas caching** - Cache rendered layers
4. **Web Workers** - Use for GIF encoding
5. **Lazy load tools** - Code-split tool implementations
6. **Memoize components** - Prevent unnecessary re-renders

---

## 🎯 MVP Priority Features

### Must Have (Week 3-5)
✅ Pencil, eraser, fill, eyedropper  
✅ Color picker with palettes  
✅ Undo/redo  
✅ Layer system (basic)  
✅ Zoom and pan  
✅ Grid toggle  
✅ Save/load projects  

### Should Have (Week 6-7)
✅ Mirror mode (X and Y)  
✅ Line and shape tools  
✅ Frame animation  
✅ Onion skinning  
✅ Preview panel  
✅ Navigation mini-map  

### Nice to Have (Week 8-9)
✅ Pixel size brush  
✅ Pixel perfect mode  
✅ Tile mode  
✅ Advanced layer controls  
✅ Custom keyboard shortcuts  

### Post-MVP
❌ Selection tools  
❌ Transform tools (rotate, flip)  
❌ Filters and effects  
❌ Custom brushes  
❌ Blend modes  
❌ Animation curves  

---

## 📚 Learning Resources

### Konva.js
- Official docs: https://konvajs.org/
- React Konva: https://konvajs.org/docs/react/
- Examples: https://konvajs.org/docs/sandbox/

### Algorithms
- **Flood fill:** https://en.wikipedia.org/wiki/Flood_fill
- **Bresenham's line:** https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
- **Circle drawing:** https://en.wikipedia.org/wiki/Midpoint_circle_algorithm

### GIF Export
- gif.js: https://github.com/jnordberg/gif.js
- GIF encoder in browser

---

*Last Updated: January 14, 2026*
