import { writeFile } from 'fs/promises';
import path from 'path';

const DIRECTUS_URL = 'https://cms.pstsauveur.ca';
const { DIRECTUS_TOKEN } = process.env;

if (!DIRECTUS_TOKEN) {
  throw new Error('DIRECTUS_TOKEN missing');
}

interface ICMSContent {
  annonces: {
    id: number,
    attributes: {
      Texte: string,
      Date: string,
      Titre: string,
      createdAt: string,
      updatedAt: string,
      publishedAt: string
    }
  }[]
}

(async function main() {
  const outputPath = path.join(__dirname, '../dist', 'content.json');
  const content: ICMSContent = {
    annonces: await fetchResources('annonces'),
  };

  await writeFile(outputPath, JSON.stringify(content, null, 2), 'utf8');
}());

async function fetchResources(type: string) {
  const { data } = await fetch(`${DIRECTUS_URL}/api/${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
  }).then((response) => response.json());

  return data;
}

export {};
