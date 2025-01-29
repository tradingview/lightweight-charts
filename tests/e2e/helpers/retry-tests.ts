type TestFn = () => void | Promise<void>;
export async function retryTest(retries: number, fn: TestFn): Promise<void> {
	for (let i = 0; i <= retries; i++) {
		try {
			await fn();
			return;
		} catch (err) {
			if (i === retries) {
				console.log('Test failed after retries');
				throw err;
			}
			console.log(`Retrying test... (${i + 1}/${retries})`);
		}
	}
}
