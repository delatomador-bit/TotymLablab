export async function parseCatalogJsonFile(file: File): Promise<unknown> {
  if (!file.name.endsWith('.json')) {
    throw new Error('Only .json files are accepted for catalog import.');
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error('Could not read the selected file.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
}
