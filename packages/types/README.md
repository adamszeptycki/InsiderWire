# @airframe/types

Shared schema definitions using Zod for the AirFrame project.

## Usage

```typescript
import { exampleSchema } from '@airframe/types'

// Use the schema for validation
const data = exampleSchema.parse({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Example',
  createdAt: new Date()
})
```

## Development

- `pnpm build` - Build the package
- `pnpm typecheck` - Type check the code

