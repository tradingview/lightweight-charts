export interface TestCase {
    name: string;
    caseContent: string;
}
export declare function getTestCases(): Record<string, TestCase[]>;
