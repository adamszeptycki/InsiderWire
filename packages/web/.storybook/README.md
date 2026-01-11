# Storybook for AirFrame Web App

This directory contains Storybook setup and component stories for the AirFrame web application.

## Getting Started

### Running Storybook Locally

Start the Storybook development server:

```bash
pnpm run storybook
```

This will start Storybook on [http://localhost:6006](http://localhost:6006).

### Building Storybook

Build a static version of Storybook:

```bash
pnpm run build-storybook
```

The static build will be output to the `storybook-static` directory.

## Available Stories

We've created example stories for the following components:

### Status & Feedback Components
- **DocumentStatus** - Shows different document processing statuses (processed, uploaded, error, unknown)
- **CallRecordFeedbackBadge** - Displays feedback badges for call records (positive, neutral, negative)
- **CreatedAtLabel** - Shows formatted creation dates with icons

### Interactive Components
- **SlidingNumber** - Animated number counter with smooth transitions
  - Includes an interactive demo with increment/decrement controls

### Card Components
- **FeatureCard** - Feature cards with hover effects and animations
- **CallRecordStatCard** - Statistical cards for call records
- **DownloadButton** - Platform-specific download buttons with variants

## Writing New Stories

To create a new story for a component:

1. Create a file named `ComponentName.stories.tsx` next to your component
2. Follow this basic structure:

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { YourComponent } from "./YourComponent";

const meta: Meta<typeof YourComponent> = {
  title: "Components/YourComponent",
  component: YourComponent,
  tags: ["autodocs"],
  argTypes: {
    propName: {
      control: "select",
      options: ["option1", "option2"],
      description: "Description of the prop",
    },
  },
};

export default meta;
type Story = StoryObj<typeof YourComponent>;

export const Default: Story = {
  args: {
    propName: "defaultValue",
  },
};

export const Variant: Story = {
  args: {
    propName: "variantValue",
  },
};
```

## Story Organization

Stories are organized following the component structure:

- `Components/` - General UI components
- `Components/Download/` - Download-related components
- `Components/CallRecord/` - Call record components
- `Components/Document/` - Document-related components (add more as needed)

## Controls & Interactions

All stories include Storybook controls that allow you to:
- Modify props in real-time
- Test different component states
- Explore component variants
- See documentation generated from TypeScript types

## Decorators

Some stories use decorators to provide proper context:

- Dark background for light-themed components
- Spacing/padding for better visual presentation
- Grid layouts for multi-component displays

## Features

- ✅ TypeScript support
- ✅ Auto-generated documentation from props
- ✅ Interactive controls
- ✅ Tailwind CSS integration
- ✅ Next.js integration
- ✅ SWC compiler for fast builds

## Known Issues

- **Webpack Cache Disabled**: Due to Next.js 15 compatibility, webpack cache is disabled in the Storybook config. This may result in slightly slower builds but ensures stability.

## Configuration Files

- `.storybook/main.ts` - Main Storybook configuration
- `.storybook/preview.ts` - Preview configuration and global styles

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Storybook for Next.js](https://storybook.js.org/docs/get-started/frameworks/nextjs)
- [Writing Stories](https://storybook.js.org/docs/writing-stories)
- [Controls](https://storybook.js.org/docs/essentials/controls)
