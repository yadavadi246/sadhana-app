import { h } from 'preact';
import htm from 'htm';

// Bind htm to Preact's virtual DOM creator
export const html = htm.bind(h);

// Re-export common hooks for convenience
export {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from 'preact/hooks';
