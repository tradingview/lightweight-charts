/**
 * This will get all the class names within the source code.
 * This is used within the mem leaks to ensure that no instances
 * of these classes exist in the memory heap.
 */
export declare function getClassNames(): Promise<Set<string>>;
