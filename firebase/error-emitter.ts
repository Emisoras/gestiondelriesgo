
import { EventEmitter } from 'events';

// This is a global event emitter for Firebase errors.
// It's used to propagate permission errors to a central listener.
export const errorEmitter = new EventEmitter();
