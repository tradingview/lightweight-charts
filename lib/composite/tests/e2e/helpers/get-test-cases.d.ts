export interface TestCase {
    name: string;
    caseContent: string;
}
export declare function getTestCases(testCasesDir: string): Record<string, TestCase[]>;
