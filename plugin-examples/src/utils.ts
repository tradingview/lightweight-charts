import * as fs from 'fs';
import { parse } from 'csv-parse';

export const parseCSV = async (filePath: string): Promise<any[]> => {
  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  const records: any[] = [];
  for await (const record of parser) {
    records.push(record);
  }

  return records;
};

// Usage
parseCSV('./path/to/your/file.csv')
  .then(data => console.log(data))
  .catch(error => console.error(error));