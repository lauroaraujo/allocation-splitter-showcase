export { AllocationSplitter } from './components/AllocationSplitter/AllocationSplitter';
export type {
  AllocationSplitterProps,
  AllocationSplitterValueInputMode,
} from './components/AllocationSplitter/AllocationSplitter';
export type {
  AllocationCategory as AllocationSplitterCategory,
  AllocationRow as AllocationSplitterRow,
  AllocationStrategy,
  AllocationStrategyMap,
} from './components/AllocationSplitter/allocation';
export {
  getMaxAvailable,
  proportionalAllocation,
  freeformAllocation,
  defaultAllocationStrategies,
} from './components/AllocationSplitter/allocation';
