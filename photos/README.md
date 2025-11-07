# Photo Portfolio

A modern, TypeScript-based photo portfolio with a banner-based navigation system.

## Features

- **Banner View**: Beautiful rounded rectangular banners for each photo category with blurred backgrounds
- **Grid View**: Click any banner to see all photos in that category in a responsive grid
- **Lightbox**: Click on any photo to view it in full screen with details
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **TypeScript**: Type-safe code for better maintainability

## Structure

- `photos.ts` - TypeScript source code
- `photos.js` - Compiled JavaScript (auto-generated)
- `photo_data.json` - Photo data with metadata
- `index.html` - Main HTML file with inline styles
- `tsconfig.json` - TypeScript configuration
- `package.json` - Node.js package configuration

## Development

### Compile TypeScript

To compile the TypeScript code to JavaScript:

```bash
npm run build
```

Or for continuous compilation during development:

```bash
npm run watch
```

### Adding New Photos

1. Add photo files to the appropriate folder in `/images/photos/`
2. Update `photo_data.json` with the new photo information:

```json
{
  "Category Name": [
    {
      "path": "../images/photos/Category/filename.jpg",
      "what": "Photo Description",
      "where": "Location",
      "when": "Date",
      "elo": 1500
    }
  ]
}
```

3. The page will automatically display the new photos

## Photo Data Format

Each photo object should have:
- `path` (required): Relative path to the image file
- `what` (required): Description of the photo
- `where` (optional): Location where photo was taken
- `when` (optional): Date or time period
- `elo` (optional): Rating/ranking number

## Meta-data

The `meta-data` object in `photo_data.json` controls global settings:
- `display`: Maximum number of photos to show per category (default: all)

## How It Works

1. **Banner View**: The main page displays rounded banners for each category. Each banner uses the first photo in the category as a blurred background with the category name overlaid.

2. **Grid View**: Clicking a banner transitions to a grid view showing all photos in that category. A back button returns to the banner view.

3. **Single Page**: All views are rendered dynamically on the same page - no navigation required!

4. **TypeScript Logic**: The `photos.ts` file handles:
   - Loading photo data from JSON
   - Creating banner elements
   - Creating grid elements
   - Managing lightbox functionality
   - State management between views

