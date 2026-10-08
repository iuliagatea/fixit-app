import { TextDecoder, TextEncoder } from 'node:util'
import '@testing-library/jest-dom'

// jsdom's test environment doesn't provide these globals, but react-router
// (via its dependency chain) expects them to exist.
Object.assign(global, { TextEncoder, TextDecoder })

// React 19 checks this flag before deciding whether state updates need
// act() wrapping; without it, every async state update outside an explicit
// act() call logs a spurious warning.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
